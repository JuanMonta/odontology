package api.dto;

/**
 * Ítem del catálogo de roles o estados de usuario.
 * El listado se expone como {@code [{ codigo, nombre }]} y el alta
 * solo envía el nombre; el código se asigna desde {@code codigo_seq}.
 */
public record CatalogoDto(
        String codigo,
        String nombre) {
}
