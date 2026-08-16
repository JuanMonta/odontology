package api.services;

import api.dto.AppointmentDraftDto;
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
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

/**
 * Tablero de embarque del dÃ­a: citas, cola de espera y ciclo de vida de estados.
 *
 * <p>Ciclo de vida empresarial:
 * <ul>
 *   <li>{@code on-time} â€” cita programada.</li>
 *   <li>{@code arrived} â€” el paciente llegÃ³ a tiempo (check-in).</li>
 *   <li>{@code delayed} â€” llegÃ³ tarde (check-in despuÃ©s de la hora pactada).</li>
 *   <li>{@code boarding} â€” llamado a consultorio.</li>
 *   <li>{@code done} â€” atendido.</li>
 *   <li>{@code no-show} â€” no asistiÃ³.</li>
 *   <li>{@code cancelled} â€” cancelada.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final AppointmentEstadoConverter ESTADO_CONVERTER = new AppointmentEstadoConverter();
    private static final int BLOQUE_DEFAULT_MINUTOS = 45;

    private final AppointmentRepository appointmentRepository;
    private final WaitingQueueRepository waitingRepository;
    private final api.repositories.PacienteRepository pacienteRepository;
    private final api.repositories.ClinicaSettingRepository clinicaSettingRepository;
    private final api.repositories.ConsultorioRepository consultorioRepository;
    private final api.repositories.OdontologoRepository odontologoRepository;

    /** Tolerancia por defecto (minutos) si la clínica no la configuró. */
    private static final int TOLERANCIA_DEFAULT_MINUTOS = 10;

    @Transactional(readOnly = true)
    public List<AppointmentDto> appointments(LocalDate fecha) {
        aplicarPoliticaTolerancia(fecha);
        return appointmentRepository.findByFechaOrderByHoraAsc(fecha).stream()
                .map(this::toAppointmentDto)
                .toList();
    }

    /**
     * Política de tolerancia por reloj: una cita {@code on-time} cuya hora ya
     * pasó la tolerancia configurada (y no ha hecho check-in) pasa
     * automáticamente a {@code no-show}.
     */
    @Transactional
    public int aplicarPoliticaTolerancia(LocalDate fecha) {
        int tolerancia = toleranciaMinutos();
        LocalTime ahora = LocalTime.now();
        List<Appointment> vencidas = appointmentRepository.findByFechaAndEstado(fecha, Appointment.Estado.ON_TIME)
                .stream()
                .filter(a -> ahora.isAfter(a.getHora().plusMinutes(tolerancia)))
                .toList();
        vencidas.forEach(a -> a.setEstado(Appointment.Estado.NO_SHOW));
        appointmentRepository.saveAll(vencidas);
        return vencidas.size();
    }

    /**
     * Cierre de día: todas las citas {@code on-time} restantes del día pasan a
     * {@code no-show}. Devuelve cuántas se cerraron.
     */
    @Transactional
    public int closeDay(LocalDate fecha) {
        List<Appointment> pendientes = appointmentRepository.findByFechaAndEstado(fecha, Appointment.Estado.ON_TIME);
        pendientes.forEach(a -> a.setEstado(Appointment.Estado.NO_SHOW));
        appointmentRepository.saveAll(pendientes);
        return pendientes.size();
    }

    private int toleranciaMinutos() {
        return clinicaSettingRepository.findById(1)
                .map(api.entities.ClinicaSetting::getToleranciaRetraso)
                .filter(t -> t != null && t > 0)
                .orElse(TOLERANCIA_DEFAULT_MINUTOS);
    }

    @Transactional(readOnly = true)
    public List<WaitingPatientDto> waiting() {
        return waitingRepository.findByAtendidoFalseOrderByLlegadaAsc().stream()
                .map(this::toWaitingDto)
                .toList();
    }

    /**
     * Check-in de un paciente en la sala de espera.
     * <p>Si llega {@code appointmentId}, la cita pasa a {@code arrived} (llegÃ³ a
     * tiempo) o {@code delayed} (llegÃ³ tarde), segÃºn la hora actual contra la hora
     * pactada. Sin cita, se usa {@code pacienteNombre} + {@code motivo} (walk-in).
     */
    @Transactional
    public WaitingPatientDto checkIn(WaitingCheckInDto dto) {
        String nombre = dto.pacienteNombre();
        String motivo = dto.motivo();
        String pacienteId = null;
        Appointment cita = null;

        if (dto.appointmentId() != null && !dto.appointmentId().isBlank()) {
            cita = appointmentRepository.findById(dto.appointmentId())
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
        waitingRepository.save(paciente);

        if (cita != null) {
            LocalTime hora = LocalTime.now();
            Appointment.Estado nuevo = !hora.isAfter(cita.getHora())
                    ? Appointment.Estado.ARRIVED
                    : Appointment.Estado.DELAYED;
            cita.setEstado(nuevo);
            appointmentRepository.save(cita);
        }
        return toWaitingDto(paciente);
    }

    /**
     * Llamar al siguiente paciente en espera â†’ pasa a "embarque" (boarding).
     * <p>Si el ticket estÃ¡ ligado a una cita ({@code pacienteId}), se marca la
     * cita {@code boarding}. Si es un walk-in (sin cita), se crea una cita
     * {@code boarding} con los datos del ticket para que quede registrada en el
     * tablero y pueda marcarse como atendida.
     */
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

        if (paciente.getPacienteId() == null) {
            return boardingWalkIn(fecha, paciente);
        }

        return appointmentRepository.findByFechaOrderByHoraAsc(fecha).stream()
                .filter(a -> a.getPacienteId() != null
                        && a.getPacienteId().equals(paciente.getPacienteId())
                        && (a.getEstado() == Appointment.Estado.ARRIVED
                        || a.getEstado() == Appointment.Estado.DELAYED
                        || a.getEstado() == Appointment.Estado.ON_TIME))
                .findFirst()
                .map(a -> {
                    a.setEstado(Appointment.Estado.BOARDING);
                    return toAppointmentDto(appointmentRepository.save(a));
                })
                .orElseGet(() -> boardingWalkIn(fecha, paciente));
    }

    /** Un walk-in que entra a consultorio se materializa como cita {@code boarding}. */
    private AppointmentDto boardingWalkIn(LocalDate fecha, WaitingQueue paciente) {
        AsignacionDisponible asignacion = asignarConsultorioYOdotontologo(fecha);
        Appointment cita = Appointment.builder()
                .id(nextAppointmentId())
                .fecha(fecha)
                .hora(LocalTime.now())
                .horaFin(LocalTime.now().plusMinutes(BLOQUE_DEFAULT_MINUTOS))
                .pacienteId(paciente.getPacienteId())
                .pacienteNombre(paciente.getPacienteNombre())
                .tratamiento(paciente.getMotivo())
                .consultorio(asignacion.consultorio())
                .consultorioCodigo(asignacion.consultorioCodigo())
                .odontologo(asignacion.odontologo())
                .odontologoCodigo(asignacion.odontologoCodigo())
                .estado(Appointment.Estado.BOARDING)
                .build();
        return toAppointmentDto(appointmentRepository.save(cita));
    }

    /** Registrar una nueva cita programada para hoy. */
    @Transactional
    public AppointmentDto createAppointment(AppointmentDraftDto dto) {
        if (dto.time() == null || dto.time().isBlank() || dto.patient() == null || dto.patient().isBlank()) {
            throw new IllegalArgumentException("HORA Y PACIENTE SON OBLIGATORIOS");
        }
        LocalTime hora = parseHora(dto.time());
        LocalDate fecha = LocalDate.now();
        String nombre = dto.patient().trim().toUpperCase();
        AsignacionDisponible asignacion = resolverConsultorioYOdotontologo(
                dto.consultorio(), dto.dentist());
        validarSinSolapamiento(fecha, hora, asignacion.consultorioCodigo(), asignacion.odontologoCodigo());
        Appointment cita = Appointment.builder()
                .id(nextAppointmentId())
                .fecha(fecha)
                .hora(hora)
                .horaFin(hora.plusMinutes(BLOQUE_DEFAULT_MINUTOS))
                .pacienteId(lookupPacienteId(nombre))
                .pacienteNombre(nombre)
                .tratamiento((dto.treatment() == null || dto.treatment().isBlank() ? "CONSULTA" : dto.treatment()).trim().toUpperCase())
                .consultorio(asignacion.consultorio())
                .consultorioCodigo(asignacion.consultorioCodigo())
                .odontologo(asignacion.odontologo())
                .odontologoCodigo(asignacion.odontologoCodigo())
                .estado(Appointment.Estado.ON_TIME)
                .build();
        return toAppointmentDto(appointmentRepository.save(cita));
    }

    /**
     * Pre-valida el bloque [hora, hora+BLOQUE] contra las citas del día: si la
     * sala o el odontólogo ya están ocupados en ese rango, el trigger de la BD
     * rechazaría el INSERT. Se traduce a un error de negocio claro (409).
     */
    private void validarSinSolapamiento(LocalDate fecha, LocalTime hora, String consultorioCodigo, String odontologoCodigo) {
        if (consultorioCodigo == null && odontologoCodigo == null) {
            return;
        }
        LocalTime horaFin = hora.plusMinutes(BLOQUE_DEFAULT_MINUTOS);
        boolean solapa = appointmentRepository.findByFechaOrderByHoraAsc(fecha).stream()
                .filter(a -> a.getHoraFin() != null && a.getConsultorioCodigo() != null)
                .filter(a -> hora.isBefore(a.getHoraFin()) && a.getHora().isBefore(horaFin))
                .anyMatch(a -> (consultorioCodigo != null && consultorioCodigo.equals(a.getConsultorioCodigo()))
                        || (odontologoCodigo != null && odontologoCodigo.equals(a.getOdontologoCodigo())));
        if (solapa) {
            throw new api.services.SolapamientoException(
                    "Solapamiento de horario: sala u odontólogo ya ocupado a las " + hora);
        }
    }

    /**
     * Resuelve consultorio/odontólogo del draft: si el usuario los eligió por
     * nombre se buscan sus códigos; si vienen vacíos se asigna automáticamente
     * el consultorio operativo con menos carga del día.
     */
    private AsignacionDisponible resolverConsultorioYOdotontologo(String consultorioNombre, String odontologoNombre) {
        boolean hayConsultorio = consultorioNombre != null && !consultorioNombre.isBlank();
        boolean hayOdontologo = odontologoNombre != null && !odontologoNombre.isBlank();

        if (hayConsultorio || hayOdontologo) {
            api.entities.Consultorio consultorio = hayConsultorio
                    ? consultorioRepository.findAll().stream()
                            .filter(c -> c.getNombre().equalsIgnoreCase(consultorioNombre.trim()))
                            .findFirst().orElse(null)
                    : null;
            api.entities.Odontologo odontologo = hayOdontologo
                    ? odontologoRepository.findAll().stream()
                            .filter(o -> o.getNombre().equalsIgnoreCase(odontologoNombre.trim()))
                            .findFirst().orElse(null)
                    : null;
            if (consultorio == null && odontologo == null) {
                return asignarConsultorioYOdotontologo(LocalDate.now());
            }
            return new AsignacionDisponible(
                    consultorio != null ? consultorio.getNombre() : consultorioNombre.trim().toUpperCase(),
                    consultorio != null ? consultorio.getCodigo() : null,
                    odontologo != null ? odontologo.getNombre() : odontologoNombre.trim().toUpperCase(),
                    odontologo != null ? odontologo.getCodigo() : null);
        }
        return asignarConsultorioYOdotontologo(LocalDate.now());
    }

    /** Id de paciente existente cuyo nombre coincide (para ligar check-in â†’ boarding). */
    private String lookupPacienteId(String nombre) {
        return pacienteRepository.findByNombreContainingIgnoreCase(nombre.trim())
                .stream().findFirst().map(api.entities.Paciente::getId).orElse(null);
    }

    /** Marcar la cita como atendida. */
    @Transactional
    public AppointmentDto markDone(String id) {
        return cambiarEstado(id, Appointment.Estado.DONE);
    }

    /** Marcar la cita como cancelada. */
    @Transactional
    public AppointmentDto markCancelled(String id) {
        return cambiarEstado(id, Appointment.Estado.CANCELLED);
    }

    /** Marcar la cita como no-show (no asistiÃ³). */
    @Transactional
    public AppointmentDto markNoShow(String id) {
        return cambiarEstado(id, Appointment.Estado.NO_SHOW);
    }

    private AppointmentDto cambiarEstado(String id, Appointment.Estado estado) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: " + id));
        appointment.setEstado(estado);
        return toAppointmentDto(appointmentRepository.save(appointment));
    }

    /** Siguiente ticket secuencial "A-###" segÃºn el Ãºltimo registrado. */
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

    /** Id secuencial "apt-N" global segÃºn el mayor sufijo numÃ©rico de la tabla. */
    private String nextAppointmentId() {
        int max = appointmentRepository.findAll().stream()
                .map(a -> {
                    try {
                        return Integer.parseInt(a.getId().replaceAll("\\D", ""));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);
        return "apt-" + (max + 1);
    }

    private LocalTime parseHora(String hora) {
        try {
            return LocalTime.parse(hora.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("HORA NO VÃLIDA: " + hora);
        }
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

    private record AsignacionDisponible(
            String consultorio,
            String consultorioCodigo,
            String odontologo,
            String odontologoCodigo) {
    }

    /**
     * Asigna el consultorio operativo con menos carga del día y un odontólogo
     * activo que trabaje en él (o el odontólogo activo con menos carga).
     * El snapshot visible usa el nombre del consultorio/odontólogo.
     */
    private AsignacionDisponible asignarConsultorioYOdotontologo(LocalDate fecha) {
        List<api.entities.Consultorio> disponibles = consultorioRepository
                .findByEstado(api.entities.Consultorio.Estado.operativo);
        if (disponibles.isEmpty()) {
            return new AsignacionDisponible("SIN ASIGNAR", null, "SIN ASIGNAR", null);
        }

        List<Appointment> citasHoy = appointmentRepository.findByFechaOrderByHoraAsc(fecha);

        api.entities.Consultorio elegido = disponibles.stream()
                .min(java.util.Comparator
                        .comparingLong((api.entities.Consultorio c) -> citasHoy.stream()
                                .filter(a -> c.getCodigo().equals(a.getConsultorioCodigo())
                                        && a.getEstado() != Appointment.Estado.DONE
                                        && a.getEstado() != Appointment.Estado.NO_SHOW
                                        && a.getEstado() != Appointment.Estado.CANCELLED)
                                .count())
                        .thenComparing(api.entities.Consultorio::getCodigo))
                .orElse(disponibles.get(0));

        api.entities.Odontologo elegidoOdo = odontologoRepository
                .findByConsultorioCodigo(elegido.getCodigo())
                .stream()
                .filter(o -> o.getEstado() == api.entities.Odontologo.Estado.activo)
                .min(java.util.Comparator
                        .comparingLong((api.entities.Odontologo o) -> citasHoy.stream()
                                .filter(a -> o.getCodigo().equals(a.getOdontologoCodigo())
                                        && a.getEstado() != Appointment.Estado.DONE
                                        && a.getEstado() != Appointment.Estado.NO_SHOW
                                        && a.getEstado() != Appointment.Estado.CANCELLED)
                                .count())
                        .thenComparing(api.entities.Odontologo::getCodigo))
                .orElseGet(() -> odontologoRepository.findByEstado(api.entities.Odontologo.Estado.activo)
                        .stream()
                        .findFirst()
                        .orElse(null));

        if (elegidoOdo == null) {
            return new AsignacionDisponible(elegido.getNombre(), elegido.getCodigo(), "SIN ASIGNAR", null);
        }
        return new AsignacionDisponible(
                elegido.getNombre(), elegido.getCodigo(),
                elegidoOdo.getNombre(), elegidoOdo.getCodigo());
    }
}
