package api.services;

import api.dto.EspecialidadDraftDto;
import api.dto.EspecialidadDto;
import api.entities.Especialidad;
import api.repositories.EspecialidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Especialidades clínicas del catálogo (tabla {@code especialidades}).
 * El nombre se almacena en mayúsculas; la especialidad de un odontólogo se
 * valida contra este catálogo (misma mecánica que turnos/roles).
 */
@Service
@RequiredArgsConstructor
public class EspecialidadesService {

    private final EspecialidadRepository especialidadRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<EspecialidadDto> list() {
        return especialidadRepository.findAll().stream()
                .sorted(Comparator.comparing(Especialidad::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EspecialidadDto> listActivas() {
        return especialidadRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public EspecialidadDto add(EspecialidadDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (especialidadRepository.findByNombre(nombre).isPresent()) {
            throw new IllegalArgumentException("LA ESPECIALIDAD YA EXISTE: " + nombre);
        }
        Especialidad especialidad = Especialidad.builder()
                .codigo(codigoService.nextCodigo("ESP", "ESP-%03d"))
                .nombre(nombre)
                .activo(true)
                .build();
        return toDto(especialidadRepository.save(especialidad));
    }

    @Transactional
    public EspecialidadDto update(EspecialidadDto dto) {
        Especialidad especialidad = especialidadRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada: " + dto.code()));
        String nombre = normalizar(dto.nombre());
        especialidadRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(dto.code()))
                .ifPresent(existente -> {
                    throw new IllegalArgumentException("LA ESPECIALIDAD YA EXISTE: " + nombre);
                });
        especialidad.setNombre(nombre);
        return toDto(especialidadRepository.save(especialidad));
    }

    @Transactional
    public EspecialidadDto toggleStatus(String code) {
        Especialidad especialidad = especialidadRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada: " + code));
        especialidad.setActivo(!Boolean.TRUE.equals(especialidad.getActivo()));
        return toDto(especialidadRepository.save(especialidad));
    }

    private static String normalizar(String valor) {
        String limpio = valor == null ? "" : valor.trim().toUpperCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("EL NOMBRE ES OBLIGATORIO");
        }
        return limpio;
    }

    private EspecialidadDto toDto(Especialidad e) {
        return new EspecialidadDto(
                e.getCodigo(),
                e.getCodigo(),
                e.getNombre(),
                Boolean.TRUE.equals(e.getActivo()));
    }
}
