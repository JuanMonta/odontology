package api.dto;

import java.time.LocalDateTime;

/**
 * Entrada de histórico de un catálogo editable. Se consume en reportes y
 * auditoría para ver cómo evolucionó un registro a través del tiempo.
 */
public record CatalogSnapshotDto(
        Long id,
        String entidad,
        String codigo,
        String accion,
        String nombreAnterior,
        String nombreNuevo,
        String detalle,
        LocalDateTime createdAt) {
}