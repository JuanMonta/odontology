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
    private final CatalogSnapshotService snapshots;

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
        EspecialidadDto creada = toDto(especialidadRepository.save(especialidad));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ESPECIALIDAD, creada.code(),
                CatalogSnapshotService.ACCION_CREAR, null, nombre, null);
        return creada;
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
        String anterior = especialidad.getNombre();
        especialidad.setNombre(nombre);
        EspecialidadDto actualizada = toDto(especialidadRepository.save(especialidad));
        if (!anterior.equals(nombre)) {
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_ESPECIALIDAD, especialidad.getCodigo(),
                    CatalogSnapshotService.ACCION_RENOMBRAR, anterior, nombre, null);
        }
        return actualizada;
    }

    @Transactional
    public EspecialidadDto toggleStatus(String code) {
        Especialidad especialidad = especialidadRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada: " + code));
        boolean ibaActiva = Boolean.TRUE.equals(especialidad.getActivo());
        especialidad.setActivo(!especialidad.getActivo());
        EspecialidadDto actualizada = toDto(especialidadRepository.save(especialidad));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ESPECIALIDAD, especialidad.getCodigo(),
                ibaActiva ? CatalogSnapshotService.ACCION_DESACTIVAR
                        : CatalogSnapshotService.ACCION_ACTIVAR,
                especialidad.getNombre(), especialidad.getNombre(), null);
        return actualizada;
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
