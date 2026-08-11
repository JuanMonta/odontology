package api.services;

import api.dto.AbonoDto;
import api.dto.AccountEntryDto;
import api.dto.PacienteDetailDto;
import api.dto.PacienteDto;
import api.dto.PacienteDraftDto;
import api.dto.PatientAlertDto;
import api.dto.PatientAppointmentDto;
import api.dto.ToothConditionDto;
import api.dto.ToothDto;
import api.dto.ToothFaceDto;
import api.entities.AccountEntry;
import api.entities.Paciente;
import api.entities.PatientAlert;
import api.entities.PatientAppointment;
import api.entities.PatientTooth;
import api.entities.PatientToothCondition;
import api.entities.PatientToothFace;
import api.entities.VistaPaciente;
import api.entities.converter.CondicionDentalConverter;
import api.entities.converter.PatientAppointmentEstadoConverter;
import api.repositories.AccountEntryRepository;
import api.repositories.PacienteRepository;
import api.repositories.PatientAlertRepository;
import api.repositories.PatientAppointmentRepository;
import api.repositories.PatientToothConditionRepository;
import api.repositories.PatientToothFaceRepository;
import api.repositories.PatientToothRepository;
import api.repositories.VistaPacienteRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pacientes: directorio, expediente (citas + cuenta + odontograma), abonos y
 * alertas. El saldo se lee de la vista {@code v_pacientes}.
 */
@Service
@RequiredArgsConstructor
public class PacientesService {

    private static final CondicionDentalConverter CONDICION_CONVERTER = new CondicionDentalConverter();
    private static final PatientAppointmentEstadoConverter CITA_ESTADO_CONVERTER = new PatientAppointmentEstadoConverter();

    /** FDI permanentes: 11-18, 21-28, 31-38, 41-48. */
    private static final List<Integer> DIENTES = List.of(
            11, 12, 13, 14, 15, 16, 17, 18,
            21, 22, 23, 24, 25, 26, 27, 28,
            31, 32, 33, 34, 35, 36, 37, 38,
            41, 42, 43, 44, 45, 46, 47, 48);

    private final VistaPacienteRepository vistaRepository;
    private final PacienteRepository pacienteRepository;
    private final PatientAppointmentRepository appointmentRepository;
    private final AccountEntryRepository accountRepository;
    private final PatientToothRepository toothRepository;
    private final PatientToothConditionRepository conditionRepository;
    private final PatientToothFaceRepository faceRepository;
    private final PatientAlertRepository alertRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<PacienteDto> list() {
        return vistaRepository.findAll().stream()
                .sorted(Comparator.comparing(VistaPaciente::getId))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteDto find(String id) {
        return vistaRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public PacienteDetailDto detail(String id) {
        List<PatientAppointmentDto> appointments = appointmentRepository
                .findByPacienteIdOrderByFechaDescHoraDesc(id)
                .stream()
                .map(this::toAppointmentDto)
                .toList();

        List<AccountEntryDto> account = accountRepository.findByPacienteIdOrderByFechaDesc(id)
                .stream()
                .map(this::toAccountDto)
                .toList();

        List<ToothDto> teeth = odontograma(id);

        return new PacienteDetailDto(appointments, account, teeth);
    }

    @Transactional
    public PacienteDto add(PacienteDraftDto draft) {
        Paciente paciente = Paciente.builder()
                .id(codigoService.nextCodigo("HC", "HC-%04d"))
                .nombre(draft.name())
                .fechaNacimiento(draft.fechaNacimiento() != null
                        ? draft.fechaNacimiento()
                        : LocalDate.of(1990, 1, 1))
                .telefono(draft.phone())
                .email(draft.email())
                .direccion(draft.address())
                .alergias(draft.allergies() == null || draft.allergies().isBlank()
                        ? "NINGUNA"
                        : draft.allergies())
                .estado(draft.status() == null
                        ? Paciente.Estado.active
                        : Paciente.Estado.valueOf(draft.status()))
                .tratamiento(draft.treatment())
                .build();
        Paciente guardado = pacienteRepository.saveAndFlush(paciente);
        return find(guardado.getId());
    }

    @Transactional
    public PacienteDto update(String id, PacienteDraftDto draft) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado: " + id));
        if (draft.name() != null) {
            paciente.setNombre(draft.name());
        }
        if (draft.fechaNacimiento() != null) {
            paciente.setFechaNacimiento(draft.fechaNacimiento());
        }
        if (draft.phone() != null) {
            paciente.setTelefono(draft.phone());
        }
        if (draft.email() != null) {
            paciente.setEmail(draft.email());
        }
        if (draft.address() != null) {
            paciente.setDireccion(draft.address());
        }
        if (draft.allergies() != null) {
            paciente.setAlergias(draft.allergies());
        }
        if (draft.status() != null) {
            paciente.setEstado(Paciente.Estado.valueOf(draft.status()));
        }
        if (draft.treatment() != null) {
            paciente.setTratamiento(draft.treatment());
        }
        if (draft.lastVisit() != null) {
            paciente.setUltimaVisita(draft.lastVisit());
        }
        pacienteRepository.saveAndFlush(paciente);
        return find(id);
    }

    @Transactional
    public AccountEntryDto addAbono(String id, AbonoDto abono) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado: " + id));
        AccountEntry entry = AccountEntry.builder()
                .pacienteId(paciente.getId())
                .fecha(LocalDate.now())
                .concepto("ABONO A CUENTA")
                .monto(abono.monto())
                .tipo(AccountEntry.Tipo.payment)
                .metodo(abono.metodo() == null
                        ? AccountEntry.Metodo.EFECTIVO
                        : AccountEntry.Metodo.valueOf(abono.metodo()))
                .build();
        return toAccountDto(accountRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<PatientAlertDto> alerts() {
        return alertRepository.findByAtendidaFalse().stream()
                .sorted(Comparator.comparing(PatientAlert::getId))
                .map(this::toAlertDto)
                .toList();
    }

    @Transactional
    public PatientAlertDto markAlertHandled(String alertId) {
        PatientAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));
        alert.setAtendida(true);
        return toAlertDto(alertRepository.save(alert));
    }

    @Transactional
    public ToothDto updateTooth(String id, ToothDto tooth) {
        toothRepository.findById(new api.entities.PatientToothId(id, tooth.number()))
                .ifPresentOrElse(
                        t -> {
                            t.setMovilidad(tooth.movilidad());
                            t.setRecesion(tooth.recesion());
                        },
                        () -> {
                            if (tooth.movilidad() != null || tooth.recesion() != null
                                    || hasConditions(tooth)) {
                                toothRepository.save(PatientTooth.builder()
                                        .pacienteId(id)
                                        .diente(tooth.number())
                                        .movilidad(tooth.movilidad())
                                        .recesion(tooth.recesion())
                                        .build());
                            }
                        });

        conditionRepository.deleteByPacienteIdAndDiente(id, tooth.number());
        conditionRepository.flush();
        if (tooth.conditions() != null) {
            tooth.conditions().forEach(c -> conditionRepository.save(PatientToothCondition.builder()
                    .pacienteId(id)
                    .diente(tooth.number())
                    .condicion(CONDICION_CONVERTER.convertToEntityAttribute(c.condition()))
                    .build()));
        }

        faceRepository.deleteByPacienteIdAndDiente(id, tooth.number());
        faceRepository.flush();
        if (tooth.faces() != null) {
            tooth.faces().forEach(f -> faceRepository.save(PatientToothFace.builder()
                    .pacienteId(id)
                    .diente(tooth.number())
                    .cara(PatientToothFace.Cara.valueOf(f.face()))
                    .condicion(PatientToothFace.Condicion.valueOf(f.condition()))
                    .build()));
        }
        return readTooth(id, tooth.number());
    }

    @Transactional(readOnly = true)
    public List<ToothDto> odontograma(String id) {
        Map<Integer, PatientTooth> teeth = new HashMap<>();
        toothRepository.findByPacienteId(id).forEach(t -> teeth.put(t.getDiente(), t));

        Map<Integer, List<String>> conditions = new HashMap<>();
        conditionRepository.findByPacienteId(id).forEach(c ->
                conditions.computeIfAbsent(c.getDiente(), k -> new ArrayList<>())
                        .add(CONDICION_CONVERTER.convertToDatabaseColumn(c.getCondicion())));

        Map<Integer, List<ToothFaceDto>> faces = new HashMap<>();
        faceRepository.findByPacienteId(id).forEach(f ->
                faces.computeIfAbsent(f.getDiente(), k -> new ArrayList<>())
                        .add(new ToothFaceDto(f.getCara().name(), f.getCondicion().name())));

        List<ToothDto> result = new ArrayList<>();
        for (int numero : DIENTES) {
            PatientTooth tooth = teeth.get(numero);
            List<ToothConditionDto> cond = conditions.getOrDefault(numero, List.of())
                    .stream().map(ToothConditionDto::new).toList();
            List<ToothFaceDto> caras = faces.get(numero);
            result.add(new ToothDto(
                    numero,
                    cond,
                    caras,
                    tooth == null ? null : tooth.getMovilidad(),
                    tooth == null ? null : tooth.getRecesion()));
        }
        return result;
    }

    private ToothDto readTooth(String id, int numero) {
        return odontograma(id).stream()
                .filter(t -> t.number() == numero)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pieza no leída: " + numero));
    }

    private boolean hasConditions(ToothDto tooth) {
        return (tooth.conditions() != null && !tooth.conditions().isEmpty())
                || (tooth.faces() != null && !tooth.faces().isEmpty());
    }

    private PacienteDto toDto(VistaPaciente v) {
        return new PacienteDto(
                v.getId(),
                v.getNombre(),
                v.getEdad() == null ? 0 : v.getEdad(),
                v.getCumpleanios() == null ? "—" : v.getCumpleanios(),
                v.getTelefono() == null ? "—" : v.getTelefono(),
                v.getEmail(),
                v.getDireccion(),
                v.getAlergias(),
                v.getEstado().name(),
                v.getTratamiento(),
                v.getUltimaVisita() == null ? "—" : FormatoUtil.fecha(v.getUltimaVisita()),
                v.getSaldo() == null ? BigDecimal.ZERO : v.getSaldo());
    }

    private PatientAppointmentDto toAppointmentDto(PatientAppointment a) {
        return new PatientAppointmentDto(
                a.getId(),
                FormatoUtil.fecha(a.getFecha()),
                FormatoUtil.hora(a.getHora()),
                a.getTratamiento(),
                a.getOdontologo(),
                a.getEstado() == null ? null : CITA_ESTADO_CONVERTER.convertToDatabaseColumn(a.getEstado()),
                a.getNota());
    }

    private AccountEntryDto toAccountDto(AccountEntry e) {
        return new AccountEntryDto(
                e.getId(),
                FormatoUtil.fecha(e.getFecha()),
                e.getConcepto(),
                e.getMonto(),
                e.getTipo().name(),
                e.getMetodo() == null ? null : e.getMetodo().name());
    }

    private PatientAlertDto toAlertDto(PatientAlert a) {
        return new PatientAlertDto(
                a.getId(),
                a.getTipo().name(),
                a.getPacienteId(),
                a.getEtiqueta(),
                a.getAtendida());
    }
}
