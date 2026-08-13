package api.services;

import api.dto.TurnoDraftDto;
import api.dto.TurnoDto;
import api.entities.Turno;
import api.repositories.TurnoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Turnos laborales del catálogo (tabla {@code turnos}).
 * Define la jornada de un profesional (inicio/fin) y su pausa de almuerzo.
 * El turno de un odontólogo se valida contra este catálogo.
 */
@Service
@RequiredArgsConstructor
public class TurnosService {

    private final TurnoRepository turnoRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<TurnoDto> list() {
        return turnoRepository.findAll().stream()
                .sorted(Comparator.comparing(Turno::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TurnoDto> listActivos() {
        return turnoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TurnoDto add(TurnoDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (turnoRepository.findByNombre(nombre).isPresent()) {
            throw new IllegalArgumentException("EL TURNO YA EXISTE: " + nombre.toUpperCase());
        }
        validarHorario(draft.horaInicio(), draft.horaFin(), draft.descansoInicio(), draft.descansoFin());
        Turno turno = Turno.builder()
                .codigo(codigoService.nextCodigo("TUR", "TUR-%03d"))
                .nombre(nombre)
                .horaInicio(draft.horaInicio())
                .horaFin(draft.horaFin())
                .descansoInicio(draft.descansoInicio())
                .descansoFin(draft.descansoFin())
                .activo(true)
                .build();
        return toDto(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoDto update(TurnoDto dto) {
        Turno turno = turnoRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado: " + dto.code()));
        String nombre = normalizar(dto.nombre());
        turnoRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(dto.code()))
                .ifPresent(existente -> {
                    throw new IllegalArgumentException("EL TURNO YA EXISTE: " + nombre.toUpperCase());
                });
        validarHorario(dto.horaInicio(), dto.horaFin(), dto.descansoInicio(), dto.descansoFin());
        turno.setNombre(nombre);
        turno.setHoraInicio(dto.horaInicio());
        turno.setHoraFin(dto.horaFin());
        turno.setDescansoInicio(dto.descansoInicio());
        turno.setDescansoFin(dto.descansoFin());
        return toDto(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoDto toggleStatus(String code) {
        Turno turno = turnoRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado: " + code));
        turno.setActivo(!Boolean.TRUE.equals(turno.getActivo()));
        return toDto(turnoRepository.save(turno));
    }

    /**
     * Valida la coherencia de la jornada: inicio antes de fin y el descanso
     * dentro de la jornada (ambas horas del descanso o ninguna).
     */
    private static void validarHorario(LocalTime inicio, LocalTime fin, LocalTime descansoInicio, LocalTime descansoFin) {
        if (inicio == null || fin == null) {
            throw new IllegalArgumentException("LA HORA DE INICIO Y DE FIN SON OBLIGATORIAS");
        }
        if (!inicio.isBefore(fin)) {
            throw new IllegalArgumentException("LA HORA DE INICIO DEBE SER ANTERIOR A LA DE FIN");
        }
        if ((descansoInicio == null) != (descansoFin == null)) {
            throw new IllegalArgumentException("EL DESCANSO REQUIERE HORA DE INICIO Y DE FIN");
        }
        if (descansoInicio != null) {
            if (!descansoInicio.isBefore(descansoFin)) {
                throw new IllegalArgumentException("EL DESCANSO DEBE TENER INICIO ANTERIOR A SU FIN");
            }
            if (descansoInicio.isBefore(inicio) || descansoFin.isAfter(fin)) {
                throw new IllegalArgumentException("EL DESCANSO DEBE ESTAR DENTRO DE LA JORNADA LABORAL");
            }
        }
    }

    private static String normalizar(String valor) {
        String limpio = valor == null ? "" : valor.trim().toLowerCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("EL NOMBRE ES OBLIGATORIO");
        }
        return limpio;
    }

    private TurnoDto toDto(Turno t) {
        return new TurnoDto(
                t.getCodigo(),
                t.getCodigo(),
                t.getNombre(),
                t.getHoraInicio(),
                t.getHoraFin(),
                t.getDescansoInicio(),
                t.getDescansoFin(),
                Boolean.TRUE.equals(t.getActivo()));
    }
}
