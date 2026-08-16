package api.services;

/**
 * Conflicto de negocio del tablero (p. ej. solapamiento de horario al agendar
 * una cita). Se traduce a HTTP 409 CONFLICT con mensaje legible para el usuario.
 */
public class SolapamientoException extends RuntimeException {

    public SolapamientoException(String message) {
        super(message);
    }
}
