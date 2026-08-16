package api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Ítem del catálogo de equipos/instrumental: identidad de catálogo y
 * categoría para agrupar el selector de equipos del formulario.
 */
public record EquipoCatalogoDto(
        @JsonProperty("codigo") String codigo,
        @JsonProperty("nombre") String nombre,
        @JsonProperty("categoria") String categoria) {
}