package api.services;

import api.dto.ChatAdjuntoDto;
import api.entities.ChatAdjunto;
import api.repositories.ChatAdjuntoRepository;
import api.repositories.ChatMiembroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Subida y descarga segura de adjuntos del chat (fotos, documentos, audio).
 *
 * <p>Reglas (OWASP WSTG-BUSLOGIC/PenTest File Upload):
 * <ol>
 *   <li>Whitelist de extensiones + MIME: la extensión del nombre y el
 *       {@code Content-Type} declarado deben coincidir con un par permitido.</li>
 *   <li>Magic bytes: la firma binaria real del archivo debe cuadrar con la
 *       extensión (bloquea ejecutables renombrados, poliglots y dobles extensiones).</li>
 *   <li>Tope de tamaño por categoría (imagen/audio/documento).</li>
 *   <li>Almacenamiento fuera del webroot con nombre UUID; nunca se usa el nombre
 *       original como ruta en disco.</li>
 *   <li>Descarga solo para miembros de la conversación; el MIME se sirve desde
 *       el metadato verificado (no del Content-Type enviado por el cliente).</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class ChatAdjuntoService {

    private static final long LIMITE_IMAGEN = 8L * 1024 * 1024;
    private static final long LIMITE_AUDIO = 12L * 1024 * 1024;
    private static final long LIMITE_DOCUMENTO = 8L * 1024 * 1024;
    private static final long LIMITE_TEXTO = 1024L * 1024;

    private static final Set<String> IMAGENES = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final Set<String> AUDIOS = Set.of("mp3", "wav", "m4a", "ogg");

    private static final Map<String, Set<String>> MIMES_POR_EXT = Map.ofEntries(
            Map.entry("jpg", Set.of("image/jpeg")),
            Map.entry("jpeg", Set.of("image/jpeg")),
            Map.entry("png", Set.of("image/png")),
            Map.entry("webp", Set.of("image/webp")),
            Map.entry("gif", Set.of("image/gif")),
            Map.entry("pdf", Set.of("application/pdf")),
            Map.entry("doc", Set.of("application/msword")),
            Map.entry("docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            Map.entry("xls", Set.of("application/vnd.ms-excel")),
            Map.entry("xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
            Map.entry("txt", Set.of("text/plain")),
            Map.entry("mp3", Set.of("audio/mpeg")),
            Map.entry("wav", Set.of("audio/wav", "audio/x-wav", "audio/wave")),
            Map.entry("m4a", Set.of("audio/mp4", "audio/x-m4a")),
            Map.entry("ogg", Set.of("audio/ogg", "application/ogg")));

    private final ChatAdjuntoRepository adjuntoRepository;
    private final ChatMiembroRepository miembroRepository;

    @Value("${app.uploads-dir:uploads}")
    private String uploadsDir;

    @Transactional
    public ChatAdjuntoDto guardar(Long conversacionId, String subidoPorCodigo, MultipartFile file) {
        if (conversacionId == null || conversacionId <= 0) {
            throw new IllegalArgumentException("CONVERSACIÓN INVÁLIDA");
        }
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new IllegalArgumentException("ARCHIVO VACÍO");
        }
        if (!miembroRepository.existsById_ConversacionIdAndId_UsuarioCodigo(conversacionId, subidoPorCodigo)) {
            throw new IllegalArgumentException("NO ERES MIEMBRO DE ESTA CONVERSACIÓN");
        }

        String nombre = sanearNombre(file.getOriginalFilename());
        String ext = extDe(nombre);
        if (ext == null) {
            throw new IllegalArgumentException("EXTENSIÓN NO PERMITIDA");
        }
        Set<String> permitidos = MIMES_POR_EXT.get(ext);
        if (permitidos == null) {
            throw new IllegalArgumentException("TIPO DE ARCHIVO NO SOPORTADO");
        }
        String declarado = normalizarMime(file.getContentType());
        if (declarado != null && !declarado.isEmpty() && !permitidos.contains(declarado)) {
            throw new IllegalArgumentException("EL CONTENIDO NO COINCIDE CON LA EXTENSIÓN");
        }
        if (file.getSize() > maximoPara(ext)) {
            throw new IllegalArgumentException("ARCHIVO DEMASIADO GRANDE");
        }

        byte[] cabeza;
        try (InputStream in = file.getInputStream()) {
            cabeza = in.readNBytes(16);
        } catch (IOException e) {
            throw new IllegalArgumentException("NO SE PUDO LEER EL ARCHIVO");
        }
        if (!firmaValida(cabeza, ext)) {
            throw new IllegalArgumentException("ARCHIVO CORRUPTO O NO VÁLIDO");
        }

        String categoria = categoriaDe(ext);
        String relativa = "chat/" + DateTimeFormatter.ofPattern("yyyyMM").format(LocalDate.now()) + "/"
                + UUID.randomUUID() + "." + ext;
        try {
            Path destino = raiz().resolve(relativa);
            Files.createDirectories(destino.getParent());
            try (InputStream full = file.getInputStream()) {
                Files.copy(full, destino);
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("NO SE PUDO GUARDAR EL ARCHIVO");
        }

        ChatAdjunto adjunto = adjuntoRepository.save(ChatAdjunto.builder()
                .conversacionId(conversacionId)
                .subidoPor(subidoPorCodigo)
                .nombreOriginal(nombre)
                .nombreDisco(relativa)
                .tipo(mimeCanonico(ext))
                .categoria(categoria)
                .tamano(file.getSize())
                .build());
        return toDto(adjunto);
    }

    @Transactional(readOnly = true)
    public ChatAdjunto obtenerParaAcceso(Long id, String usuarioCodigo) {
        ChatAdjunto adjunto = adjuntoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ADJUNTO NO ENCONTRADO"));
        if (!miembroRepository.existsById_ConversacionIdAndId_UsuarioCodigo(adjunto.getConversacionId(), usuarioCodigo)) {
            throw new IllegalArgumentException("NO ERES MIEMBRO DE ESTA CONVERSACIÓN");
        }
        return adjunto;
    }

    public Path rutaDe(ChatAdjunto adjunto) {
        Path ruta = raiz().resolve(adjunto.getNombreDisco());
        if (!Files.isRegularFile(ruta)) {
            throw new IllegalArgumentException("ARCHIVO NO DISPONIBLE");
        }
        return ruta;
    }

    public String nombreSeguroDe(ChatAdjunto adjunto) {
        String nombre = adjunto.getNombreOriginal() == null ? "adjunto" : adjunto.getNombreOriginal();
        String limpio = nombre.replaceAll("[^\\p{ASCII}]", "_")
                .replaceAll("[^A-Za-z0-9._ -]", "_")
                .replaceAll("_+", "_");
        if (limpio.isBlank()) {
            limpio = "adjunto";
        }
        return limpio;
    }

    public boolean esInline(ChatAdjunto adjunto) {
        return "imagen".equals(adjunto.getCategoria()) || "audio".equals(adjunto.getCategoria());
    }

    public ChatAdjuntoDto toDto(ChatAdjunto adjunto) {
        return new ChatAdjuntoDto(
                adjunto.getId(),
                adjunto.getConversacionId(),
                adjunto.getSubidoPor(),
                adjunto.getNombreOriginal(),
                adjunto.getCategoria(),
                adjunto.getTipo(),
                adjunto.getTamano(),
                adjunto.getCreatedAt() == null ? "" : api.util.FormatoUtil.fechaHora(adjunto.getCreatedAt()),
                "/api/v1/chat/adjuntos/" + adjunto.getId());
    }

    private Path raiz() {
        return Paths.get(uploadsDir).toAbsolutePath();
    }

    private static String extDe(String nombre) {
        int idx = nombre.lastIndexOf('.');
        if (idx < 0 || idx == nombre.length() - 1) {
            return null;
        }
        String ext = nombre.substring(idx + 1).toLowerCase(java.util.Locale.ROOT).trim();
        return ext.isEmpty() ? null : ext;
    }

    private static long maximoPara(String ext) {
        if (IMAGENES.contains(ext)) {
            return LIMITE_IMAGEN;
        }
        if (AUDIOS.contains(ext)) {
            return LIMITE_AUDIO;
        }
        if ("txt".equals(ext)) {
            return LIMITE_TEXTO;
        }
        return LIMITE_DOCUMENTO;
    }

    private static String categoriaDe(String ext) {
        if (IMAGENES.contains(ext)) {
            return "imagen";
        }
        if (AUDIOS.contains(ext)) {
            return "audio";
        }
        return "documento";
    }

    private static String mimeCanonico(String ext) {
        return MIMES_POR_EXT.get(ext).iterator().next();
    }

    private static String normalizarMime(String mime) {
        if (mime == null) {
            return null;
        }
        int semi = mime.indexOf(';');
        String base = (semi > 0 ? mime.substring(0, semi) : mime).trim().toLowerCase(java.util.Locale.ROOT);
        return base.isEmpty() ? null : base;
    }

    private static String sanearNombre(String original) {
        if (original == null || original.isBlank()) {
            return "adjunto";
        }
        String nombre = original.replace('\\', '/');
        int barra = nombre.lastIndexOf('/');
        if (barra >= 0) {
            nombre = nombre.substring(barra + 1);
        }
        nombre = nombre.replaceAll("[\\p{Cntrl}]", "").trim();
        if (nombre.length() > 100) {
            int dot = nombre.lastIndexOf('.');
            if (dot > 0) {
                nombre = nombre.substring(0, 3) + "…" + nombre.substring(nombre.length() - 96 + 3);
            } else {
                nombre = nombre.substring(0, 100);
            }
        }
        return nombre.isBlank() ? "adjunto" : nombre;
    }

    private static boolean firmaValida(byte[] b, String ext) {
        switch (ext) {
            case "jpg":
            case "jpeg":
                return b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case "png":
                return b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
            case "gif": {
                String s = new String(b, 0, Math.min(6, b.length), StandardCharsets.US_ASCII);
                return s.equals("GIF87a") || s.equals("GIF89a");
            }
            case "webp":
                return b.length >= 12
                        && "RIFF".equals(new String(b, 0, 4, StandardCharsets.US_ASCII))
                        && "WEBP".equals(new String(b, 8, 4, StandardCharsets.US_ASCII));
            case "pdf":
                return b.length >= 5 && "%PDF-".equals(new String(b, 0, 5, StandardCharsets.US_ASCII));
            case "mp3":
                return (b.length >= 3 && b[0] == 'I' && b[1] == 'D' && b[2] == '3')
                        || (b.length >= 2 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xE0) == 0xE0);
            case "wav":
                return b.length >= 12
                        && "RIFF".equals(new String(b, 0, 4, StandardCharsets.US_ASCII))
                        && "WAVE".equals(new String(b, 8, 4, StandardCharsets.US_ASCII));
            case "m4a":
                return b.length >= 12
                        && "ftyp".equals(new String(b, 4, 4, StandardCharsets.US_ASCII))
                        && b[8] == 'M' && b[9] == '4' && b[10] == 'A';
            case "ogg":
                return b.length >= 4 && "OggS".equals(new String(b, 0, 4, StandardCharsets.US_ASCII));
            case "docx":
            case "xlsx":
                return b.length >= 4 && (b[0] & 0xFF) == 0x50 && (b[1] & 0xFF) == 0x4B
                        && (b[2] & 0xFF) == 0x03 && (b[3] & 0xFF) == 0x04;
            case "doc":
            case "xls":
                return b.length >= 8
                        && (b[0] & 0xFF) == 0xD0 && (b[1] & 0xFF) == 0xCF && (b[2] & 0xFF) == 0x11
                        && (b[3] & 0xFF) == 0xE0 && (b[4] & 0xFF) == 0xA1 && (b[5] & 0xFF) == 0xB1
                        && (b[6] & 0xFF) == 0x1A && (b[7] & 0xFF) == 0xE1;
            case "txt":
                return true;
            default:
                return false;
        }
    }
}