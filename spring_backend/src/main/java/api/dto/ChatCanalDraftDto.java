package api.dto;

import java.util.List;

/**
 * Alta de un canal por el administrador: nombre + códigos de usuarios invitados.
 */
public record ChatCanalDraftDto(
        String nombre,
        List<String> miembros) {
}
