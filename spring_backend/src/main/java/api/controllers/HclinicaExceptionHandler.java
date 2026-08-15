package api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Expone el mensaje del sello del Formulario 033 (409 CONFLICT) en el body JSON,
 * para que el frontend pueda mostrarlo. Los demás errores conservan el manejo
 * por defecto de Spring.
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
}
