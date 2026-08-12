package api.dto;

import java.util.List;

/**
 * Conversación de chat tal como la consume la UI. Para un DM el nombre visible
 * lo arma el frontend a partir de {@code participantes}; {@code noLeidos} y
 * {@code ultimoMensaje} alimentan la lista de estaciones.
 */
public record ChatConversacionDto(
        Long id,
        String tipo,
        String nombre,
        String ultimoMensaje,
        String ultimoMensajeHora,
        long noLeidos,
        boolean esAdmin,
        List<ChatParticipanteDto> participantes) {
}
