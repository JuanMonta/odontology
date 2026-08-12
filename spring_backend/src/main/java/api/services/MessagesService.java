package api.services;

import api.dto.ClinicMessageDto;
import api.dto.MessageDraftDto;
import api.entities.ClinicMessage;
import api.repositories.ClinicMessageRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Bandeja de mensajes de la clínica.
 */
@Service
@RequiredArgsConstructor
public class MessagesService {

    private final ClinicMessageRepository messageRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<ClinicMessageDto> list() {
        return messageRepository.findAll().stream()
                .sorted(Comparator.comparing(ClinicMessage::getCodigo).reversed())
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return messageRepository.countByEstado(ClinicMessage.Estado.unread);
    }

    @Transactional
    public ClinicMessageDto send(MessageDraftDto draft) {
        LocalDate hoy = LocalDate.now();
        ClinicMessage message = ClinicMessage.builder()
                .codigo(codigoService.nextCodigo("MSG", "MSG-%03d"))
                .asunto(draft.subject())
                .cuerpo(draft.body())
                .remitente(draft.remitente())
                .canal(ClinicMessage.Canal.valueOf(draft.channel()))
                .fecha(hoy)
                .hora(LocalTime.now())
                .estado(ClinicMessage.Estado.unread)
                .destino(ClinicMessage.Destino.valueOf(draft.destino()))
                .prioridad(ClinicMessage.Prioridad.valueOf(draft.prioridad()))
                .build();
        return toDto(messageRepository.save(message));
    }

    @Transactional
    public ClinicMessageDto markRead(String code) {
        return cambiarEstado(code, ClinicMessage.Estado.read);
    }

    @Transactional
    public ClinicMessageDto markUnread(String code) {
        return cambiarEstado(code, ClinicMessage.Estado.unread);
    }

    private ClinicMessageDto cambiarEstado(String code, ClinicMessage.Estado estado) {
        ClinicMessage message = messageRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Mensaje no encontrado: " + code));
        message.setEstado(estado);
        return toDto(messageRepository.save(message));
    }

    private ClinicMessageDto toDto(ClinicMessage m) {
        return new ClinicMessageDto(
                m.getCodigo(),
                m.getAsunto(),
                m.getCuerpo(),
                m.getRemitente(),
                m.getCanal().name(),
                FormatoUtil.fecha(m.getFecha()),
                FormatoUtil.hora(m.getHora()),
                m.getEstado().name(),
                m.getDestino().name(),
                m.getPrioridad().name());
    }
}
