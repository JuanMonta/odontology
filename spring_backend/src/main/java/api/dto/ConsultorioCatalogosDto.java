package api.dto;

import java.util.List;

/**
 * Catálogos para el formulario de consultorios: opciones de unidad,
 * ubicación y equipos. Son la única fuente de verdad para los selects.
 */
public record ConsultorioCatalogosDto(
        List<String> unidades,
        List<String> ubicaciones,
        List<String> equipos) {
}
