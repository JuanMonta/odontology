package api.controllers;

import api.services.SolapamientoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

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
