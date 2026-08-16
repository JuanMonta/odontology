package api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Catálogos para el formulario de consultorios: opciones de unidad,
 * ubicación, equipos y tratamientos. Son la única fuente de verdad para los selects.
 */
public record ConsultorioCatalogosDto(
        @JsonProperty("unidades") List<String> unidades,
        @JsonProperty("ubicaciones") List<String> ubicaciones,
        @JsonProperty("equipos") List<EquipoCatalogoDto> equipos,
        @JsonProperty("tratamientos") List<TratamientoSimpleDto> tratamientos) {
}
