package api.services;

import api.dto.ChatCanalDraftDto;
import api.dto.ChatConversacionDto;
import api.dto.ChatMensajeDto;
import api.dto.ChatParticipanteDto;
import api.dto.ChatPresenciaDto;
import api.entities.ChatConversacion;
import api.entities.ChatMensaje;
import api.entities.ChatMiembro;
import api.entities.Usuario;
import api.repositories.ChatConversacionRepository;
import api.repositories.ChatMensajeRepository;
import api.repositories.ChatMiembroRepository;
import api.repositories.UsuarioRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Chat interno del consultorio (DMs 1:1 + canales creados por el administrador).
 * Todo el historial es append-only en {@code chat_mensajes}; la lectura se mide
 * con {@code chat_miembros.ultima_lectura}.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversacionRepository conversacionRepository;
    private final ChatMiembroRepository miembroRepository;
    private final ChatMensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PresenciaService presenciaService;

    @Transactional(readOnly = true)
    public List<ChatConversacionDto> listMisConversaciones(String usuarioCodigo) {
        List<ChatConversacion> mios = conversacionRepository.findAll().stream()
                .filter(c -> miembroRepository.existsById_ConversacionIdAndId_UsuarioCodigo(c.getId(), usuarioCodigo))
                .toList();
        return mios.stream()
                .map(c -> toConversacionDto(c, usuarioCodigo))
                .sorted(Comparator.comparing(ChatConversacionDto::ultimoMensajeHora, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    @Transactional
    public ChatConversacionDto getOrCreateDm(String usuarioCodigo, String otroCodigo) {
        List<ChatConversacion> existentes = conversacionRepository
                .findDmEntre(usuarioCodigo, otroCodigo, ChatConversacion.Tipo.dm);
        if (!existentes.isEmpty()) {
            return toConversacionDto(existentes.get(0), usuarioCodigo);
        }
        ChatConversacion dm = conversacionRepository.save(ChatConversacion.builder()
                .tipo(ChatConversacion.Tipo.dm)
                .build());
        agregarMiembroRow(dm.getId(), usuarioCodigo, false);
        agregarMiembroRow(dm.getId(), otroCodigo, false);
        return toConversacionDto(dm, usuarioCodigo);
    }

    @Transactional
    public ChatConversacionDto createCanal(String adminCodigo, ChatCanalDraftDto draft) {
        Usuario admin = usuarioRepository.findById(adminCodigo)
                .orElseThrow(() -> new IllegalArgumentException("ADMIN NO ENCONTRADO"));
        if (!"administrador".equals(admin.getRol())) {
            throw new IllegalArgumentException("SOLO EL ADMINISTRADOR PUEDE CREAR CANALES");
        }
        String nombre = draft.nombre() == null ? "" : draft.nombre().trim().toUpperCase();
        if (nombre.isEmpty()) {
            throw new IllegalArgumentException("EL CANAL REQUIERE UN NOMBRE");
        }
        ChatConversacion canal = conversacionRepository.save(ChatConversacion.builder()
                .tipo(ChatConversacion.Tipo.canal)
                .nombre(nombre)
                .creador(adminCodigo)
                .build());
        agregarMiembroRow(canal.getId(), adminCodigo, true);
        for (String codigo : distinctDe(draft.miembros())) {
            if (!codigo.equals(adminCodigo)) {
                agregarMiembroRow(canal.getId(), codigo, false);
            }
        }
        return toConversacionDto(canal, adminCodigo);
    }

    @Transactional
    public ChatConversacionDto addMiembro(String adminCodigo, Long conversacionId, String usuarioCodigo) {
        verificarAdminCanal(adminCodigo, conversacionId);
        agregarMiembroRow(conversacionId, usuarioCodigo, false);
        return toConversacionDto(obtenerConversacion(conversacionId), adminCodigo);
    }

    @Transactional
    public ChatConversacionDto removeMiembro(String adminCodigo, Long conversacionId, String usuarioCodigo) {
        verificarAdminCanal(adminCodigo, conversacionId);
        ChatMiembro.Id id = new ChatMiembro.Id(conversacionId, usuarioCodigo);
        if (miembroRepository.existsById(id)) {
            miembroRepository.deleteById(id);
        }
        return toConversacionDto(obtenerConversacion(conversacionId), adminCodigo);
    }

    @Transactional(readOnly = true)
    public List<ChatMensajeDto> historial(Long conversacionId, String usuarioCodigo) {
        verificarMiembro(conversacionId, usuarioCodigo);
        List<ChatMensaje> mensajes = mensajeRepository.findTop100ByConversacionIdOrderByIdDesc(conversacionId);
        List<ChatMensaje> reversados = new ArrayList<>(mensajes);
        java.util.Collections.reverse(reversados);
        Map<String, String> nombres = nombresDeUsuarios();
        return reversados.stream().map(m -> toMensajeDto(m, nombres)).toList();
    }

    @Transactional
    public ChatMensajeDto send(Long conversacionId, String remitenteCodigo, String cuerpo) {
        verificarMiembro(conversacionId, remitenteCodigo);
        String texto = cuerpo == null ? "" : cuerpo.trim();
        if (texto.isEmpty()) {
            throw new IllegalArgumentException("MENSAJE VACÍO");
        }
        ChatMensaje mensaje = mensajeRepository.save(ChatMensaje.builder()
                .conversacionId(conversacionId)
                .remitente(remitenteCodigo)
                .cuerpo(texto)
                .build());
        return toMensajeDto(mensaje, nombresDeUsuarios());
    }

    @Transactional
    public void markRead(Long conversacionId, String usuarioCodigo) {
        verificarMiembro(conversacionId, usuarioCodigo);
        ChatMiembro.Id id = new ChatMiembro.Id(conversacionId, usuarioCodigo);
        ChatMiembro miembro = miembroRepository.findById(id).orElseThrow();
        miembro.setUltimaLectura(LocalDateTime.now());
        miembroRepository.save(miembro);
    }

    @Transactional(readOnly = true)
    public long unreadTotal(String usuarioCodigo) {
        List<ChatConversacion> mios = conversacionRepository.findAll().stream()
                .filter(c -> miembroRepository.existsById_ConversacionIdAndId_UsuarioCodigo(c.getId(), usuarioCodigo))
                .toList();
        long total = 0;
        for (ChatConversacion c : mios) {
            total += noLeidos(c.getId(), usuarioCodigo);
        }
        return total;
    }

    @Transactional(readOnly = true)
    public List<ChatPresenciaDto> presencia() {
        Map<String, Boolean> online = presenciaService.online();
        Map<String, Usuario> usuarios = usuarioRepository.findAll().stream()
                .collect(Collectors.toMap(Usuario::getCodigo, u -> u));
        return online.entrySet().stream()
                .filter(e -> usuarios.containsKey(e.getKey()))
                .map(e -> {
                    Usuario u = usuarios.get(e.getKey());
                    return new ChatPresenciaDto(u.getCodigo(), u.getNombre(), u.getRol(), e.getValue());
                })
                .sorted(Comparator.comparing(ChatPresenciaDto::nombre))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatParticipanteDto> usuariosActivos() {
        return usuarioRepository.findAll().stream()
                .filter(u -> "activo".equals(u.getEstado()))
                .sorted(Comparator.comparing(Usuario::getNombre))
                .map(u -> new ChatParticipanteDto(u.getCodigo(), u.getNombre(), u.getRol()))
                .toList();
    }

    private void verificarAdminCanal(String adminCodigo, Long conversacionId) {
        ChatConversacion conv = obtenerConversacion(conversacionId);
        if (conv.getTipo() != ChatConversacion.Tipo.canal) {
            throw new IllegalArgumentException("NO ES UN CANAL");
        }
        Usuario admin = usuarioRepository.findById(adminCodigo).orElseThrow();
        if (!"administrador".equals(admin.getRol())) {
            throw new IllegalArgumentException("SOLO EL ADMINISTRADOR GESTIONA CANALES");
        }
    }

    private void verificarMiembro(Long conversacionId, String usuarioCodigo) {
        if (!miembroRepository.existsById_ConversacionIdAndId_UsuarioCodigo(conversacionId, usuarioCodigo)) {
            throw new IllegalArgumentException("NO ERES MIEMBRO DE ESTA CONVERSACIÓN");
        }
    }

    private ChatConversacion obtenerConversacion(Long conversacionId) {
        return conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> new IllegalArgumentException("CONVERSACIÓN NO ENCONTRADA"));
    }

    private void agregarMiembroRow(Long conversacionId, String usuarioCodigo, boolean esAdmin) {
        miembroRepository.save(ChatMiembro.builder()
                .id(new ChatMiembro.Id(conversacionId, usuarioCodigo))
                .esAdmin(esAdmin)
                .ultimaLectura(LocalDateTime.now())
                .build());
    }

    private ChatConversacionDto toConversacionDto(ChatConversacion c, String miVista) {
        List<ChatMiembro> miembros = miembroRepository.findById_ConversacionId(c.getId());
        Map<String, Usuario> usuarios = usuarioRepository.findAll().stream()
                .collect(Collectors.toMap(Usuario::getCodigo, u -> u));
        List<ChatParticipanteDto> participantes = miembros.stream()
                .map(m -> {
                    Usuario u = usuarios.get(m.getId().getUsuarioCodigo());
                    return u == null ? null : new ChatParticipanteDto(u.getCodigo(), u.getNombre(), u.getRol());
                })
                .filter(java.util.Objects::nonNull)
                .toList();
        ChatMensaje ultimo = mensajeRepository.findTop100ByConversacionIdOrderByIdDesc(c.getId())
                .stream().findFirst().orElse(null);
        boolean esAdmin = miembros.stream()
                .anyMatch(m -> m.getId().getUsuarioCodigo().equals(miVista) && m.isEsAdmin());
        return new ChatConversacionDto(
                c.getId(),
                c.getTipo().name(),
                c.getTipo() == ChatConversacion.Tipo.canal ? c.getNombre() : null,
                ultimo == null ? "" : ultimo.getCuerpo(),
                ultimo == null ? "" : FormatoUtil.fechaHora(ultimo.getCreatedAt()),
                noLeidos(c.getId(), miVista),
                esAdmin,
                participantes);
    }

    private long noLeidos(Long conversacionId, String usuarioCodigo) {
        ChatMiembro.Id id = new ChatMiembro.Id(conversacionId, usuarioCodigo);
        ChatMiembro miembro = miembroRepository.findById(id).orElse(null);
        LocalDateTime corte = miembro == null || miembro.getUltimaLectura() == null
                ? LocalDateTime.MIN : miembro.getUltimaLectura();
        return mensajeRepository.findTop100ByConversacionIdOrderByIdDesc(conversacionId).stream()
                .filter(m -> !m.getRemitente().equals(usuarioCodigo))
                .filter(m -> m.getCreatedAt().isAfter(corte))
                .count();
    }

    private Map<String, String> nombresDeUsuarios() {
        return usuarioRepository.findAll().stream()
                .collect(Collectors.toMap(Usuario::getCodigo, Usuario::getNombre));
    }

    private ChatMensajeDto toMensajeDto(ChatMensaje m, Map<String, String> nombres) {
        return new ChatMensajeDto(
                m.getId(),
                m.getConversacionId(),
                m.getRemitente(),
                nombres.getOrDefault(m.getRemitente(), m.getRemitente()),
                m.getCuerpo(),
                FormatoUtil.fechaHora(m.getCreatedAt()));
    }

    private List<String> distinctDe(List<String> lista) {
        return lista == null ? List.of()
                : lista.stream().filter(java.util.Objects::nonNull).distinct().toList();
    }
}
