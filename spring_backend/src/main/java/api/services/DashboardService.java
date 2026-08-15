package api.services;

import api.dto.AppointmentDto;
import api.dto.WaitingCheckInDto;
import api.dto.WaitingPatientDto;
import api.entities.Appointment;
import api.entities.WaitingQueue;
import api.entities.converter.AppointmentEstadoConverter;
import api.repositories.AppointmentRepository;
import api.repositories.WaitingQueueRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Tablero de embarque del día: citas, cola de espera y totales.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppointmentRepository appointmentRepository;
    private final WaitingQueueRepository waitingRepository;
    private static final AppointmentEstadoConverter ESTADO_CONVERTER = new AppointmentEstadoConverter();

    @Transactional(readOnly = true)
    public List<AppointmentDto> appointments(LocalDate fecha) {
        return appointmentRepository.findByFechaOrderByHoraAsc(fecha).stream()
                .map(this::toAppointmentDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WaitingPatientDto> waiting() {
        return waitingRepository.findByAtendidoFalseOrderByLlegadaAsc().stream()
                .map(this::toWaitingDto)
                .toList();
    }

    /**
     * Check-in de un paciente en la sala de espera.
     * Si llega {@code appointmentId}, se deriva nombre/motivo de la cita y se
     * enlaza el paciente (para que LLAMAR SIGUIENTE lo pase a boarding).
     */
    @Transactional
    public WaitingPatientDto checkIn(WaitingCheckInDto dto) {
        String nombre = dto.pacienteNombre();
        String motivo = dto.motivo();
        String pacienteId = null;

        if (dto.appointmentId() != null && !dto.appointmentId().isBlank()) {
            Appointment cita = appointmentRepository.findById(dto.appointmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: " + dto.appointmentId()));
            nombre = cita.getPacienteNombre();
            motivo = cita.getTratamiento();
            pacienteId = cita.getPacienteId();
        }

        if (nombre == null || nombre.isBlank() || motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("NOMBRE Y MOTIVO SON OBLIGATORIOS");
        }

        WaitingQueue paciente = WaitingQueue.builder()
                .ticket(nextTicket())
                .pacienteId(pacienteId)
                .pacienteNombre(nombre.trim().toUpperCase())
                .llegada(LocalTime.now())
                .motivo(motivo.trim().toUpperCase())
                .atendido(false)
                .build();
        return toWaitingDto(waitingRepository.save(paciente));
    }

    /** Siguiente ticket secuencial "A-###" según el último registrado. */
    private String nextTicket() {
        int siguiente = waitingRepository.findFirstByOrderByTicketDesc()
                .map(WaitingQueue::getTicket)
                .map(t -> {
                    try {
                        return Integer.parseInt(t.substring(t.indexOf('-') + 1));
                    } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                        return 0;
                    }
                })
                .orElse(0);
        return String.format("A-%03d", siguiente + 1);
    }

    /** Llamar al siguiente paciente en espera → pasa a "embarque" (boarding). */
    @Transactional
    public AppointmentDto callWaitingPatient(LocalDate fecha) {
        Optional<WaitingQueue> next = waitingRepository.findByAtendidoFalseOrderByLlegadaAsc()
                .stream().findFirst();
        if (next.isEmpty()) {
            return null;
        }
        WaitingQueue paciente = next.get();
        paciente.setAtendido(true);
        waitingRepository.save(paciente);

        return appointmentRepository.findByFechaOrderByHoraAsc(fecha).stream()
                .filter(a -> a.getPacienteId() != null
                        && a.getPacienteId().equals(paciente.getPacienteId())
                        && a.getEstado() == Appointment.Estado.ON_TIME)
                .findFirst()
                .map(a -> {
                    a.setEstado(Appointment.Estado.BOARDING);
                    return toAppointmentDto(appointmentRepository.save(a));
                })
                .orElse(null);
    }

    /** Marcar la cita como atendida. */
    @Transactional
    public AppointmentDto markDone(String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: " + id));
        appointment.setEstado(Appointment.Estado.DONE);
        return toAppointmentDto(appointmentRepository.save(appointment));
    }

    private AppointmentDto toAppointmentDto(Appointment a) {
        return new AppointmentDto(
                a.getId(),
                FormatoUtil.hora(a.getHora()),
                a.getPacienteNombre(),
                a.getTratamiento(),
                a.getConsultorio(),
                a.getOdontologo(),
                a.getEstado() == null ? null : ESTADO_CONVERTER.convertToDatabaseColumn(a.getEstado()),
                a.getHoraFin() == null ? null : FormatoUtil.hora(a.getHoraFin()));
    }

    private WaitingPatientDto toWaitingDto(WaitingQueue w) {
        return new WaitingPatientDto(
                w.getId(),
                w.getTicket(),
                w.getPacienteNombre(),
                FormatoUtil.hora(w.getLlegada()),
                w.getMotivo());
    }
}
