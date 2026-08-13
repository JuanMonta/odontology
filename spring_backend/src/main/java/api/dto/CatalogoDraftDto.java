package api.dto;

/**
 * Alta de un ítem de catálogo (rol o estado de usuario).
 * El nombre se normaliza a minúsculas; el código lo asigna codigo_seq.
 */
public record CatalogoDraftDto(
        String nombre) {
}
