package api.services;

import api.dto.AbonoDto;
import api.dto.AccountEntryDto;
import api.dto.EvolucionDto;
import api.dto.HclDto;
import api.dto.PacienteDetailDto;
import api.dto.PacienteDto;
import api.dto.PacienteDraftDto;
import api.dto.PatientAlertDto;
import api.dto.PatientAppointmentDto;
import api.dto.ToothConditionDto;
import api.dto.ToothDto;
import api.dto.ToothFaceDto;
import api.entities.AccountEntry;
import api.entities.EvolucionClinica;
import api.entities.HcSesionProcedimiento;
import api.entities.HistoriaClinica;
import api.entities.Odontologo;
import api.entities.Paciente;
import api.entities.PatientAlert;
import api.entities.PatientAppointment;
import api.entities.PatientTooth;
import api.entities.PatientToothCondition;
import api.entities.PatientToothFace;
import api.entities.Procedimiento;
import api.entities.Usuario;
import api.entities.VistaPaciente;
import api.entities.converter.CondicionDentalConverter;
import api.entities.converter.PatientAppointmentEstadoConverter;
import api.repositories.AccountEntryRepository;
import api.repositories.EvolucionClinicaRepository;
import api.repositories.HistoriaClinicaRepository;
import api.repositories.OdontologoRepository;
import api.repositories.PacienteRepository;
import api.repositories.PatientAlertRepository;
import api.repositories.PatientAppointmentRepository;
import api.repositories.PatientToothConditionRepository;
import api.repositories.PatientToothFaceRepository;
import api.repositories.PatientToothRepository;
import api.repositories.ProcedimientoRepository;
import api.repositories.HcSesionProcedimientoRepository;
import api.repositories.VistaPacienteRepository;
import api.util.FormatoUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

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
    private final HistoriaClinicaRepository hclRepository;
    private final EvolucionClinicaRepository evolucionRepository;
    private final OdontologoRepository odontologoRepository;
    private final ProcedimientoRepository procedimientoRepository;
    private final HcSesionProcedimientoRepository hcSesionProcedimientoRepository;
    private final CodigoService codigoService;
    private final ObjectMapper objectMapper;

    /** Divide nombre/apellido del draft. El fragmento legado {@code name} se reparte: último token → apellidos. */
    private String[] splitNombreDraft(PacienteDraftDto draft) {
        String nombre = draft.nombre() == null ? "" : draft.nombre().trim().toUpperCase();
        String apellido = draft.apellido() == null ? "" : draft.apellido().trim().toUpperCase();
        if (!nombre.isEmpty() || !apellido.isEmpty()) {
            return new String[]{nombre, apellido};
        }
        String full = draft.name() == null ? "" : draft.name().trim().toUpperCase();
        if (full.isEmpty()) {
            return new String[]{"", ""};
        }
        int space = full.lastIndexOf(' ');
        if (space < 0) {
            return new String[]{full, ""};
        }
        return new String[]{full.substring(0, space).trim(), full.substring(space + 1).trim()};
    }

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
        String[] nombreApellido = splitNombreDraft(draft);
        Paciente paciente = Paciente.builder()
                .id(codigoService.nextCodigo("HC", "HC-%04d"))
                .cedula(draft.cedula() == null || draft.cedula().isBlank() ? null : draft.cedula().trim())
                .sexo(draft.sexo() == null || draft.sexo().isBlank()
                        ? null
                        : Paciente.Sexo.valueOf(draft.sexo()))
                .nombres(nombreApellido[0])
                .apellidos(nombreApellido[1])
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
        if (draft.nombre() != null || draft.apellido() != null || draft.name() != null) {
            if (draft.nombre() != null && draft.apellido() != null) {
                paciente.setNombres(draft.nombre().trim().toUpperCase());
                paciente.setApellidos(draft.apellido().trim().toUpperCase());
            } else {
                String[] nombreApellido = splitNombreDraft(draft);
                if (draft.nombre() != null) {
                    paciente.setNombres(nombreApellido[0]);
                }
                if (draft.apellido() != null) {
                    paciente.setApellidos(nombreApellido[1]);
                }
            }
        }
        if (draft.cedula() != null) {
            paciente.setCedula(draft.cedula().isBlank() ? null : draft.cedula().trim());
        }
        if (draft.sexo() != null) {
            paciente.setSexo(draft.sexo().isBlank() ? null : Paciente.Sexo.valueOf(draft.sexo()));
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
        if (draft.lastVisit() != null && !draft.lastVisit().isBlank()) {
            try {
                paciente.setUltimaVisita(LocalDate.parse(draft.lastVisit()));
            } catch (DateTimeParseException ignored) {
                // formato de presentación ("11 AGO 2026"): no toca la última visita
            }
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

    @Transactional(readOnly = true)
    public List<EvolucionDto> listarEvolucion(String id) {
        return evolucionRepository.findByPacienteIdOrderByFechaDescIdDesc(id).stream()
                .map(this::toEvolucionDto)
                .toList();
    }

    /** Alta de una hoja de evolución: append-only, no admite edición ni borrado. */
    @Transactional
    public EvolucionDto guardarEvolucion(String id, EvolucionDto.EvolucionDraftDto dto) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado: " + id));

        String odontologoCodigo = normalizar(dto.odontologoCodigo());
        String odontologoNombre = null;
        if (odontologoCodigo != null) {
            Odontologo odontologo = odontologoRepository.findById(odontologoCodigo)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Odontólogo no registrado: " + odontologoCodigo));
            odontologoNombre = odontologo.getNombre();
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario usuario)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Se requiere iniciar sesión para registrar una evolución clínica");
        }

        EvolucionClinica ev = EvolucionClinica.builder()
                .pacienteId(paciente.getId())
                .fecha(dto.fecha() != null ? dto.fecha() : LocalDate.now())
                .hora(dto.hora())
                .odontologo(odontologoNombre)
                .odontologoCodigo(odontologoCodigo)
                .registradoPor(usuario.getCodigo())
                .registradoPorNombre(usuario.getNombre())
                .motivo(normalizar(dto.motivo()))
                .evolucion(normalizar(dto.evolucion()))
                .plan(normalizar(dto.plan()))
                .proximaCita(dto.proximaCita())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return toEvolucionDto(evolucionRepository.saveAndFlush(ev));
    }

    private EvolucionDto toEvolucionDto(EvolucionClinica ev) {
        return new EvolucionDto(
                ev.getId(),
                ev.getPacienteId(),
                ev.getFecha(),
                ev.getHora(),
                ev.getOdontologo(),
                ev.getOdontologoCodigo(),
                ev.getRegistradoPor(),
                ev.getRegistradoPorNombre(),
                ev.getMotivo(),
                ev.getEvolucion(),
                ev.getPlan(),
                ev.getProximaCita(),
                ev.getCreatedAt() == null ? null : ev.getCreatedAt().toString());
    }

    private String normalizar(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    @Transactional(readOnly = true)
    public HclDto hclinica(String id) {
        return hclinica(id, 1);
    }

    @Transactional(readOnly = true)
    public HclDto hclinica(String id, int hoja) {
        return hclRepository.findById(new HistoriaClinica.HojaId(id, hoja))
                .map(this::toHclDto)
                .orElseGet(() -> hclVacia(id, hoja));
    }

    @Transactional(readOnly = true)
    public List<HclDto.HojaResumenDto> listarHojas(String id) {
        return hclRepository.findAllByPacienteIdOrderByHojaAsc(id).stream()
                .map(h -> new HclDto.HojaResumenDto(
                        h.getHoja(),
                        h.getFechaApertura(),
                        h.getFechaControl(),
                        h.getActualizadaEn() == null ? null : h.getActualizadaEn().toString()))
                .toList();
    }

    private HclDto hclVacia(String id, int hoja) {
        return new HclDto(
                id,
                hoja,
                null, null, false, null, null,
                false, false, false, false, false,
                false, false, false, false, false,
                null, null,
                null, null, null, null,
                List.of(),
                null, null, null, null, null,
                null,
                new HclDto.IndicesCpoDto(null, null, null, null, null, null, null, null),
                List.of(),
                false, false, false, false,
                null, null, null,
                null, null, null,
                null, null, null,
                List.of(), List.of(),
                null);
    }

    @Transactional
    public HclDto guardarHclinica(String id, int hoja, HclDto dto) {
        pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado: " + id));
        HistoriaClinica hc = hclRepository.findById(new HistoriaClinica.HojaId(id, hoja))
                .orElseGet(() -> HistoriaClinica.builder().pacienteId(id).hoja(hoja).build());
        hc.setHoja(hoja);

        verificarSello(id, hoja, hc, dto);

        hc.setSexo(dto.sexo());
        hc.setEstablecimiento(dto.establecimiento());
        hc.setProgramado(dto.programado());
        hc.setMotivoConsulta(dto.motivoConsulta());
        hc.setProblemaActual(dto.problemaActual());
        hc.setAntAlergiaAntibiotico(dto.alergiaAntibiotico());
        hc.setAntAlergiaAnestesia(dto.alergiaAnestesia());
        hc.setAntHemorragias(dto.hemorragias());
        hc.setAntVihSida(dto.vihSida());
        hc.setAntTuberculosis(dto.tuberculosis());
        hc.setAntAsma(dto.asma());
        hc.setAntDiabetes(dto.diabetes());
        hc.setAntHipertension(dto.hipertension());
        hc.setAntEnfCardiaca(dto.enfCardiaca());
         hc.setAntOtro(dto.otroAntecedente());
         hc.setAntOtroTexto(dto.otroAntecedenteTexto());
         hc.setParentesco(dto.parentesco());
         hc.setPresionArterial(dto.presionArterial());
        hc.setFrecuenciaCardiaca(dto.frecuenciaCardiaca());
        hc.setTemperatura(dto.temperatura());
        hc.setFrecuenciaRespiratoria(dto.frecuenciaRespiratoria());
        hc.setExamenRegiones(toJson(dto.examenRegiones()));
        hc.setHigienePlaca(dto.higienePlaca());
        hc.setHigieneCalculo(dto.higieneCalculo());
        hc.setGingivitis(dto.gingivitis());
        hc.setMalOclusion(dto.malOclusion());
        hc.setFluorosis(dto.fluorosis());
        hc.setEnfermedadPeriodontal(dto.enfermedadPeriodontal());
        hc.setHigieneSextantes(toJson(dto.higieneSextantes()));
        hc.setIndicesCpo(toJson(dto.indicesCpo()));
        hc.setPlanBiometria(dto.planBiometria());
        hc.setPlanRayosX(dto.planRayosX());
        hc.setPlanQuimicaSanguinea(dto.planQuimicaSanguinea());
         hc.setPlanOtros(dto.planOtros());
         hc.setPlanOtrosTexto(dto.planOtrosTexto());
         hc.setPlanTerapeutico(dto.planTerapeutico());
         hc.setPlanEducacional(dto.planEducacional());
         hc.setFechaApertura(dto.fechaApertura());
        hc.setFechaControl(dto.fechaControl());
        hc.setNumeroHoja(dto.numeroHoja());
        hc.setProfesionalNombre(dto.profesionalNombre());
        hc.setProfesionalCodigo(dto.profesionalCodigo());
        hc.setProfesionalFirma(dto.profesionalFirma());
        hc.setDiagnosticosCie(toJson(dto.diagnosticosCie()));
        hc.setSesiones(toJson(dto.sesiones()));
        hc.setActualizadaEn(LocalDateTime.now());

        HistoriaClinica guardada = hclRepository.saveAndFlush(hc);
        persistirSesionProcedimientos(guardada.getPacienteId(), guardada.getHoja(), dto.sesiones());

        return toHclDto(guardada);
    }

    /** Reemplaza la relación FK de procedimientos de una hoja de HC a partir de las sesiones del DTO. */
    private void persistirSesionProcedimientos(String pacienteId, int hoja, List<HclDto.SesionTratamientoDto> sesiones) {
        hcSesionProcedimientoRepository.deleteByPacienteIdAndHoja(pacienteId, hoja);
        if (sesiones == null) {
            return;
        }
        List<HcSesionProcedimiento> filas = new ArrayList<>();
        for (HclDto.SesionTratamientoDto s : sesiones) {
            if (s.procedimientosCodigos() == null) {
                continue;
            }
            Set<String> unicos = new java.util.LinkedHashSet<>(s.procedimientosCodigos());
            for (String codigo : unicos) {
                if (codigo == null || codigo.isBlank()) {
                    continue;
                }
                filas.add(HcSesionProcedimiento.builder()
                        .pacienteId(pacienteId)
                        .hoja(hoja)
                        .sesion(s.sesion())
                        .procedimientoCodigo(codigo.trim().toUpperCase())
                        .build());
            }
        }
        if (!filas.isEmpty()) {
            hcSesionProcedimientoRepository.saveAll(filas);
        }
    }

    /**
     * Sello legal del Formulario 033: al iniciar el tratamiento (sesión 1 con
     * datos registrados) la evaluación inicial (secciones 1-5, 7, 8) y la
     * identidad de la hoja quedan inmutables; cada sesión que ya tiene contenido
     * también. Un intento de modificar esos campos devuelve 409 CONFLICT.
     */
    private void verificarSello(String id, int hoja, HistoriaClinica hc, HclDto dto) {
        List<HclDto.SesionTratamientoDto> previas = fromJson(hc.getSesiones(),
                new TypeReference<List<HclDto.SesionTratamientoDto>>() {
                });

        boolean sellada = previas != null && previas.stream().anyMatch(s -> s.sesion() == 1 && sesionTieneDatos(s));
        if (sellada) {
            List<String> cambios = camposSelladosCambiados(hc, dto);
            if (!cambios.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "NO SE PUEDE MODIFICAR LA HISTORIA CLÍNICA — TRATAMIENTO INICIADO. CAMPOS SELLADOS: "
                                + String.join(", ", cambios));
            }
        }

        if (previas == null || previas.isEmpty()) {
            return;
        }
        List<String> sesiones = new ArrayList<>();
        for (HclDto.SesionTratamientoDto previa : previas) {
            if (!sesionTieneDatos(previa)) {
                continue;
            }
            HclDto.SesionTratamientoDto entrante = dto.sesiones() == null ? null : dto.sesiones().stream()
                    .filter(s -> s.sesion() == previa.sesion())
                    .findFirst()
                    .orElse(null);
            if (!sesionIgual(previa, entrante)) {
                sesiones.add(String.valueOf(previa.sesion()));
            }
        }
        if (!sesiones.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "NO SE PUEDE MODIFICAR LA HISTORIA CLÍNICA — SESIONES YA REGISTRADAS: "
                            + String.join(", ", sesiones));
        }
    }

    /** Nombres de los campos de identidad/evaluación que el cliente intentó alterar. */
    private List<String> camposSelladosCambiados(HistoriaClinica hc, HclDto dto) {
        List<String> cambios = new ArrayList<>();

        if (!strIgual(hc.getEstablecimiento(), dto.establecimiento())) {
            cambios.add("ESTABLECIMIENTO");
        }
        if (!strIgual(hc.getSexo(), dto.sexo())) {
            cambios.add("SEXO");
        }
        if (hc.isProgramado() != dto.programado()) {
            cambios.add("TIPO DE CITA");
        }
        if (!Objects.equals(hc.getFechaApertura(), dto.fechaApertura())) {
            cambios.add("FECHA DE APERTURA");
        }
        if (!strIgual(hc.getNumeroHoja(), dto.numeroHoja())) {
            cambios.add("NÚMERO DE HOJA");
        }
        if (!strIgual(hc.getMotivoConsulta(), dto.motivoConsulta())) {
            cambios.add("MOTIVO DE CONSULTA");
        }
        if (!strIgual(hc.getProblemaActual(), dto.problemaActual())) {
            cambios.add("PROBLEMA ACTUAL");
        }
        if (hc.isAntAlergiaAntibiotico() != dto.alergiaAntibiotico()
                || hc.isAntAlergiaAnestesia() != dto.alergiaAnestesia()
                || hc.isAntHemorragias() != dto.hemorragias()
                || hc.isAntVihSida() != dto.vihSida()
                || hc.isAntTuberculosis() != dto.tuberculosis()
                || hc.isAntAsma() != dto.asma()
                || hc.isAntDiabetes() != dto.diabetes()
                || hc.isAntHipertension() != dto.hipertension()
                || hc.isAntEnfCardiaca() != dto.enfCardiaca()
                || hc.isAntOtro() != dto.otroAntecedente()) {
            cambios.add("ANTECEDENTES");
        }
        if (!strIgual(hc.getAntOtroTexto(), dto.otroAntecedenteTexto())) {
            cambios.add("ANTECEDENTE OTRO");
        }
        if (!strIgual(hc.getParentesco(), dto.parentesco())) {
            cambios.add("PARENTESCO");
        }
        if (!strIgual(hc.getPresionArterial(), dto.presionArterial())
                || !Objects.equals(hc.getFrecuenciaCardiaca(), dto.frecuenciaCardiaca())
                || !strIgual(hc.getTemperatura(), dto.temperatura())
                || !Objects.equals(hc.getFrecuenciaRespiratoria(), dto.frecuenciaRespiratoria())) {
            cambios.add("SIGNOS VITALES");
        }
        if (!jsonContenidoIgual(hc.getExamenRegiones(), dto.examenRegiones())) {
            cambios.add("EXAMEN ESTOMATOGNÁTICO");
        }
        if (!Objects.equals(hc.getHigienePlaca(), dto.higienePlaca())
                || !Objects.equals(hc.getHigieneCalculo(), dto.higieneCalculo())
                || !strIgual(hc.getGingivitis(), dto.gingivitis())
                || !strIgual(hc.getMalOclusion(), dto.malOclusion())
                || !strIgual(hc.getFluorosis(), dto.fluorosis())
                || !strIgual(hc.getEnfermedadPeriodontal(), dto.enfermedadPeriodontal())
                || !jsonContenidoIgual(hc.getHigieneSextantes(), dto.higieneSextantes())) {
            cambios.add("SALUD BUCAL");
        }
        if (!jsonContenidoIgual(hc.getIndicesCpo(), dto.indicesCpo())) {
            cambios.add("ÍNDICES CPO-ceo");
        }
        return cambios;
    }

    /**
     * Compara dos JSON (listas u objetos, ej. examen por regiones o índices CPO)
     * por su CONTENIDO significativo, no por su estructura: los campos vacíos
     * (null, texto en blanco) y los labels estructurales (region, sextante,
     * sesion) no cuentan. Esto evita falsos positivos cuando el backend guardó
     * un JSON vacío y el frontend reenvía la lista normalizada con defaults.
     */
    private boolean jsonContenidoIgual(String storedJson, Object incoming) {
        JsonNode a = parseJsonNode(storedJson);
        JsonNode b = parseJsonNode(toJson(incoming));
        return Objects.equals(normalizarContenido(a), normalizarContenido(b));
    }

    private JsonNode parseJsonNode(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** Etiquetas estructurales que identifican una fila; no son contenido clínico. */
    private static final Set<String> ETIQUETAS_ESTRUCTURALES = Set.of("region", "sextante", "sesion");

    /** Devuelve el subárbol con solo contenido significativo (null si no hay). */
    private JsonNode normalizarContenido(JsonNode n) {
        if (n == null || n.isNull()) {
            return null;
        }
        if (n.isTextual()) {
            String t = n.asText();
            return (t == null || t.isBlank()) ? null : TextNode.valueOf(t);
        }
        if (n.isArray()) {
            ArrayNode arr = objectMapper.createArrayNode();
            for (JsonNode hijo : n) {
                JsonNode norm = normalizarContenido(hijo);
                if (norm != null) {
                    arr.add(norm);
                }
            }
            return arr.isEmpty() ? null : arr;
        }
        if (n.isObject()) {
            ObjectNode obj = objectMapper.createObjectNode();
            var it = n.fields();
            while (it.hasNext()) {
                var e = it.next();
                if (ETIQUETAS_ESTRUCTURALES.contains(e.getKey())) {
                    continue;
                }
                JsonNode norm = normalizarContenido(e.getValue());
                if (norm != null) {
                    obj.set(e.getKey(), norm);
                }
            }
            return obj.isEmpty() ? null : obj;
        }
        return n;
    }

    private boolean sesionTieneDatos(HclDto.SesionTratamientoDto s) {
        return s != null && !(blanco(s.fecha()) && blanco(s.diagnosticos()) && listaVacia(s.procedimientosCodigos())
                && blanco(s.prescripciones()) && blanco(s.proximaCita()) && blanco(s.codigo()));
    }

    /** Igualdad leniente de sesión: entrada nula o sin datos equivale a sesión vacía. */
    private boolean sesionIgual(HclDto.SesionTratamientoDto previa, HclDto.SesionTratamientoDto entrante) {
        if (entrante == null) {
            return false;
        }
        return strIgual(previa.fecha(), entrante.fecha())
                && strIgual(previa.diagnosticos(), entrante.diagnosticos())
                && listasIguales(previa.procedimientosCodigos(), entrante.procedimientosCodigos())
                && strIgual(previa.prescripciones(), entrante.prescripciones())
                && strIgual(previa.proximaCita(), entrante.proximaCita())
                && strIgual(previa.codigo(), entrante.codigo());
    }

    private boolean listaVacia(java.util.List<String> l) {
        return l == null || l.isEmpty();
    }

    private boolean listasIguales(java.util.List<String> a, java.util.List<String> b) {
        if (a == null || b == null) {
            return (a == null || a.isEmpty()) && (b == null || b.isEmpty());
        }
        return a.equals(b);
    }

    private boolean strIgual(String a, String b) {
        return blanco(a) && blanco(b) || Objects.equals(a, b);
    }

    private boolean blanco(String s) {
        return s == null || s.isBlank();
    }

    private HclDto toHclDto(HistoriaClinica hc) {
        return new HclDto(
                hc.getPacienteId(),
                hc.getHoja(),
                hc.getEstablecimiento(),
                hc.getSexo(),
                hc.isProgramado(),
                hc.getMotivoConsulta(),
                hc.getProblemaActual(),
                hc.isAntAlergiaAntibiotico(),
                hc.isAntAlergiaAnestesia(),
                hc.isAntHemorragias(),
                hc.isAntVihSida(),
                hc.isAntTuberculosis(),
                hc.isAntAsma(),
                hc.isAntDiabetes(),
                hc.isAntHipertension(),
                hc.isAntEnfCardiaca(),
                 hc.isAntOtro(),
                 hc.getAntOtroTexto(),
                 hc.getParentesco(),
                 hc.getPresionArterial(),
                hc.getFrecuenciaCardiaca(),
                hc.getTemperatura(),
                hc.getFrecuenciaRespiratoria(),
                fromJson(hc.getExamenRegiones(), new TypeReference<List<HclDto.RegionExamenDto>>() {
                }),
                hc.getHigienePlaca(),
                hc.getHigieneCalculo(),
                hc.getGingivitis(),
                hc.getMalOclusion(),
                hc.getFluorosis(),
                hc.getEnfermedadPeriodontal(),
                fromJson(hc.getIndicesCpo(), new TypeReference<HclDto.IndicesCpoDto>() {
                }),
                fromJson(hc.getHigieneSextantes(), new TypeReference<List<HclDto.HigieneSextanteDto>>() {
                }),
                hc.isPlanBiometria(),
                hc.isPlanRayosX(),
                hc.isPlanQuimicaSanguinea(),
                 hc.isPlanOtros(),
                 hc.getPlanOtrosTexto(),
                 hc.getPlanTerapeutico(),
                 hc.getPlanEducacional(),
                 hc.getFechaApertura(),
                hc.getFechaControl(),
                hc.getNumeroHoja(),
                hc.getProfesionalNombre(),
                hc.getProfesionalCodigo(),
                hc.getProfesionalFirma(),
                fromJson(hc.getDiagnosticosCie(), new TypeReference<List<HclDto.DiagnosticoCieDto>>() {
                }),
                enriquecerSesiones(hc.getPacienteId(), hc.getHoja(),
                        fromJson(hc.getSesiones(), new TypeReference<List<HclDto.SesionTratamientoDto>>() {
                        })),
                hc.getActualizadaEn() == null ? null : hc.getActualizadaEn().toString());
    }

    /**
     * Deriva el texto {@code procedimientos} de cada sesión («D1110 · profilaxis»)
     * viajando por la relación FK {@code hc_sesion_procedimientos} y uniéndolo con el
     * catálogo de procedimientos. Mantiene los códigos en {@code procedimientosCodigos}.
     */
    private List<HclDto.SesionTratamientoDto> enriquecerSesiones(String pacienteId, int hoja,
            List<HclDto.SesionTratamientoDto> sesiones) {
        if (sesiones == null) {
            return null;
        }
        List<HcSesionProcedimiento> rel = hcSesionProcedimientoRepository
                .findByPacienteIdAndHojaOrderBySesion(pacienteId, hoja);
        if (rel.isEmpty()) {
            return sesiones;
        }
        Map<Integer, List<String>> porSesion = new LinkedHashMap<>();
        for (HcSesionProcedimiento r : rel) {
            porSesion.computeIfAbsent(r.getSesion(), k -> new ArrayList<>()).add(r.getProcedimientoCodigo());
        }
        Map<String, String> descripcionPorCodigo = new HashMap<>();
        List<Procedimiento> catalogo = procedimientoRepository.findAll();
        for (Procedimiento p : catalogo) {
            descripcionPorCodigo.put(p.getCodigo(), p.getDescripcion());
        }
        List<HclDto.SesionTratamientoDto> resultado = new ArrayList<>();
        for (HclDto.SesionTratamientoDto s : sesiones) {
            List<String> codigos = porSesion.get(s.sesion());
            if (codigos == null || codigos.isEmpty()) {
                resultado.add(s);
                continue;
            }
            List<String> lineas = new ArrayList<>();
            for (String c : codigos) {
                String d = descripcionPorCodigo.get(c);
                lineas.add(d == null ? c : c + " · " + d);
            }
            resultado.add(new HclDto.SesionTratamientoDto(
                    s.sesion(), s.fecha(), s.diagnosticos(),
                    codigos, String.join("\n", lineas), s.prescripciones(), s.proximaCita(), s.codigo()));
        }
        return resultado;
    }

    private <T> String toJson(T value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private <T> T fromJson(String json, TypeReference<T> type) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            return null;
        }
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
                v.getNombres() == null ? "—" : v.getNombres(),
                v.getApellidos() == null ? "—" : v.getApellidos(),
                v.getCedula() == null ? "—" : v.getCedula(),
                v.getSexo() == null ? "—" : v.getSexo().name(),
                v.getFechaNacimiento() == null ? null : v.getFechaNacimiento().toString(),
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
                a.getOdontologoCodigo(),
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
                e.getMetodo() == null ? null : e.getMetodo().name(),
                e.getAppointmentId(),
                e.getTratamientoCodigo(),
                e.getOdontologoCodigo(),
                e.getConsultorioCodigo());
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
