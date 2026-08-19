package api.services;

import api.dto.UbicacionDraftDto;
import api.dto.UbicacionDto;
import api.entities.Consultorio;
import api.entities.Ubicacion;
import api.repositories.ConsultorioRepository;
import api.repositories.UbicacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Catálogo de ubicaciones (tabla {@code ubicaciones}) usado por el
 * formulario de consultorios. El consultorio guarda la ubicación como
 * texto, por lo que al renombrar se propaga el cambio a las salas que la
 * usan. La baja respeta la regla "vacía primero": una ubicación en uso por
 * salas activas no se puede desactivar.
 */
@Service
@RequiredArgsConstructor
public class UbicacionesService {

    private final UbicacionRepository ubicacionRepository;
    private final ConsultorioRepository consultorioRepository;
    private final CodigoService codigoService;
    private final CatalogSnapshotService snapshots;

    @Transactional(readOnly = true)
    public List<UbicacionDto> list() {
        return ubicacionRepository.findAll().stream()
                .sorted(Comparator.comparing(Ubicacion::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UbicacionDto> listActivas() {
        return ubicacionRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UbicacionDto add(UbicacionDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (ubicacionRepository.findByNombre(nombre).isPresent()) {
            throw conflicto("LA UBICACIÓN YA EXISTE: " + nombre);
        }
        Ubicacion ubicacion = Ubicacion.builder()
                .codigo(codigoService.nextCodigo("UBI", "UBI-%03d"))
                .nombre(nombre)
                .activo(true)
                .build();
        UbicacionDto creada = toDto(ubicacionRepository.save(ubicacion));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_UBICACION, creada.code(),
                CatalogSnapshotService.ACCION_CREAR, null, nombre, null);
        return creada;
    }

    /**
     * Renombra una ubicación y (opcionalmente) la desactiva. Al cambiar el
     * nombre se propaga el nuevo texto a las salas que guardaban el valor
     * anterior. La baja respeta la regla "vacía primero": una ubicación en
     * uso por salas no inactivas no se puede desactivar.
     */
    @Transactional
    public UbicacionDto update(UbicacionDto dto) {
        Ubicacion ubicacion = find(dto.code());
        String nombre = normalizar(dto.nombre());
        ubicacionRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(ubicacion.getCodigo()))
                .ifPresent(existente -> {
                    throw conflicto("LA UBICACIÓN YA EXISTE: " + nombre);
                });
        if (Boolean.FALSE.equals(dto.activo()) && Boolean.TRUE.equals(ubicacion.getActivo())) {
            validarVacia(ubicacion);
        }
        String anterior = ubicacion.getNombre();
        ubicacion.setNombre(nombre);
        ubicacion.setActivo(dto.activo());
        ubicacionRepository.save(ubicacion);
        if (!anterior.equals(nombre)) {
            List<Consultorio> afectados = consultorioRepository.findByUbicacion(anterior);
            afectados.forEach(c -> c.setUbicacion(nombre));
            consultorioRepository.saveAll(afectados);
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_UBICACION, ubicacion.getCodigo(),
                    CatalogSnapshotService.ACCION_RENOMBRAR, anterior, nombre,
                    "SALAS ACTUALIZADAS: " + afectados.size());
        }
        if (!Boolean.TRUE.equals(ubicacion.getActivo())) {
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_UBICACION, ubicacion.getCodigo(),
                    CatalogSnapshotService.ACCION_DESACTIVAR, anterior, nombre, null);
        }
        return toDto(ubicacion);
    }

    @Transactional
    public UbicacionDto toggleStatus(String code) {
        Ubicacion ubicacion = find(code);
        if (Boolean.TRUE.equals(ubicacion.getActivo())) {
            validarVacia(ubicacion);
        }
        boolean ibaActiva = Boolean.TRUE.equals(ubicacion.getActivo());
        ubicacion.setActivo(!ubicacion.getActivo());
        UbicacionDto actualizada = toDto(ubicacionRepository.save(ubicacion));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_UBICACION, ubicacion.getCodigo(),
                ibaActiva ? CatalogSnapshotService.ACCION_DESACTIVAR
                        : CatalogSnapshotService.ACCION_ACTIVAR,
                ubicacion.getNombre(), ubicacion.getNombre(), null);
        return actualizada;
    }

    private Ubicacion find(String code) {
        return ubicacionRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "UBICACIÓN NO ENCONTRADA: " + code));
    }

    private void validarVacia(Ubicacion ubicacion) {
        long activas = consultorioRepository.countByUbicacionAndEstadoNot(
                ubicacion.getNombre(), Consultorio.Estado.inactivo);
        if (activas > 0) {
            throw conflicto(
                    "NO SE PUEDE DESACTIVAR: LA UBICACIÓN ESTÁ ASIGNADA A " + activas
                            + " SALA(S) ACTIVA(S). REASIGNA PRIMERO LOS CONSULTORIOS");
        }
    }

    private static String normalizar(String valor) {
        String limpio = valor == null ? "" : valor.trim().toUpperCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("EL NOMBRE DE LA UBICACIÓN ES OBLIGATORIO");
        }
        return limpio;
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private UbicacionDto toDto(Ubicacion u) {
        return new UbicacionDto(
                u.getCodigo(),
                u.getCodigo(),
                u.getNombre(),
                Boolean.TRUE.equals(u.getActivo()));
    }
}