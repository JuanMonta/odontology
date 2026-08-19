package api.services;

import api.dto.CatalogSnapshotDto;
import api.entities.CatalogSnapshot;
import api.repositories.CatalogSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Histórico de los catálogos editables. Cada mutación de unidades,
 * ubicaciones, roles, categorías o especialidades escribe una entrada en
 * {@code catalog_snapshots} con el valor anterior y el nuevo, de modo que los
 * reportes reconstruyen cómo se llamaba un registro en un instante del tiempo.
 */
@Service
@RequiredArgsConstructor
public class CatalogSnapshotService {

    public static final String ENTIDAD_UNIDAD = "UNIDAD";
    public static final String ENTIDAD_UBICACION = "UBICACION";
    public static final String ENTIDAD_ROL = "ROL";
    public static final String ENTIDAD_CATEGORIA = "CATEGORIA";
    public static final String ENTIDAD_ESPECIALIDAD = "ESPECIALIDAD";

    public static final String ACCION_CREAR = "CREAR";
    public static final String ACCION_RENOMBRAR = "RENOMBRAR";
    public static final String ACCION_DESACTIVAR = "DESACTIVAR";
    public static final String ACCION_ACTIVAR = "ACTIVAR";
    public static final String ACCION_FUSIONAR = "FUSIONAR";

    private final CatalogSnapshotRepository snapshotRepository;

    @Transactional
    public void registrar(String entidad, String codigo, String accion,
                          String nombreAnterior, String nombreNuevo, String detalle) {
        snapshotRepository.save(CatalogSnapshot.builder()
                .entidad(entidad)
                .codigo(codigo)
                .accion(accion)
                .nombreAnterior(nombreAnterior)
                .nombreNuevo(nombreNuevo)
                .detalle(detalle)
                .build());
    }

    @Transactional(readOnly = true)
    public List<CatalogSnapshotDto> list(String entidad, String codigo) {
        List<CatalogSnapshot> filas;
        if (entidad != null && codigo != null) {
            filas = snapshotRepository.findByEntidadAndCodigoOrderByCreatedAtDesc(entidad, codigo);
        } else if (entidad != null) {
            filas = snapshotRepository.findByEntidadOrderByCreatedAtDesc(entidad);
        } else {
            filas = snapshotRepository.findAllByOrderByCreatedAtDesc();
        }
        return filas.stream().map(this::toDto).toList();
    }

    private CatalogSnapshotDto toDto(CatalogSnapshot s) {
        return new CatalogSnapshotDto(
                s.getId(),
                s.getEntidad(),
                s.getCodigo(),
                s.getAccion(),
                s.getNombreAnterior(),
                s.getNombreNuevo(),
                s.getDetalle(),
                s.getCreatedAt());
    }
}