package api.services;

import api.dto.ClinicMessageDto;
import api.dto.MessageDraftDto;
import api.entities.ClinicMessage;
import api.repositories.ClinicMessageRepository;
import api.repositories.UsuarioRolRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Bandeja de mensajes de la clínica. Cada mutación difunde el mensaje por el
 * topic STOMP {@code /topic/messages} para que la UI actualice el badge y la
 * bandeja en tiempo real sin polling.
 */
@Service
@RequiredArgsConstructor
public class MessagesService {

    private static final String TOPIC_MESSAGES = "/topic/messages";

    private final ClinicMessageRepository messageRepository;
    private final CodigoService codigoService;
    private final UsuarioRolRepository rolRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ClinicMessageDto> list() {
        return messageRepository.findAll().stream()
                .sorted(Comparator.comparing(ClinicMessage::getCodigo).reversed())
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ClinicMessageDto send(MessageDraftDto draft) {
        LocalDate hoy = LocalDate.now();
        ClinicMessage message = ClinicMessage.builder()
                .codigo(codigoService.nextCodigo("MSG", "MSG-%03d"))
                .asunto(draft.subject())
                .cuerpo(draft.body())
                .remitente(draft.remitente())
                .fecha(hoy)
                .hora(LocalTime.now())
                .estado(ClinicMessage.Estado.unread)
                .destino(validarDestino(draft.destino()))
                .prioridad(ClinicMessage.Prioridad.valueOf(draft.prioridad()))
                .build();
        return difundir(toDto(messageRepository.save(message)));
    }

    @Transactional
    public ClinicMessageDto markRead(String code) {
        return difundir(cambiarEstado(code, ClinicMessage.Estado.read));
    }

    @Transactional
    public ClinicMessageDto markUnread(String code) {
        return difundir(cambiarEstado(code, ClinicMessage.Estado.unread));
    }

    private ClinicMessageDto difundir(ClinicMessageDto dto) {
        messagingTemplate.convertAndSend(TOPIC_MESSAGES, dto);
        return dto;
    }

    private ClinicMessageDto cambiarEstado(String code, ClinicMessage.Estado estado) {
        ClinicMessage message = messageRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Mensaje no encontrado: " + code));
        message.setEstado(estado);
        return toDto(messageRepository.save(message));
    }

    /**
     * El destino es 'todos' (todo el consultorio) o un rol del catálogo
     * {@code usuario_roles}. Cualquier otro valor se rechaza, igual que el
     * rol de un usuario.
     */
    private String validarDestino(String destino) {
        String valor = destino == null ? "" : destino.trim().toLowerCase();
        if (valor.equals("todos")) {
            return "todos";
        }
        if (valor.isEmpty() || rolRepository.findByNombre(valor).isEmpty()) {
            throw new IllegalArgumentException("DESTINO NO VÁLIDO: " + destino);
        }
        return valor;
    }

    private ClinicMessageDto toDto(ClinicMessage m) {
        return new ClinicMessageDto(
                m.getCodigo(),
                m.getAsunto(),
                m.getCuerpo(),
                m.getRemitente(),
                FormatoUtil.fecha(m.getFecha()),
                FormatoUtil.hora(m.getHora()),
                m.getEstado().name(),
                m.getDestino(),
                m.getPrioridad().name());
    }
}
