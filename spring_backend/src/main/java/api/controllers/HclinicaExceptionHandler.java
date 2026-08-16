package api.controllers;

import api.services.SolapamientoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Expone el mensaje de errores de negocio en el body JSON para que el frontend
 * pueda mostrarlo: el sello del Formulario 033 y los conflictos del tablero
 * (solapamiento de horario) como 409 CONFLICT.
 */
@RestControllerAdvice
public class HclinicaExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleConflicto(ResponseStatusException ex) {
        if (ex.getStatusCode().value() == HttpStatus.CONFLICT.value()
                && ex.getReason() != null && !ex.getReason().isBlank()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getReason()));
        }
        throw ex;
    }

    @ExceptionHandler(SolapamientoException.class)
    public ResponseEntity<Map<String, String>> handleSolapamiento(SolapamientoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", ex.getMessage()));
    }
}
