package api.config;

import api.dto.ApiErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduce excepciones de negocio no envueltas ({@link IllegalArgumentException})
 * a HTTP 400 con mensaje legible. Evita que un id inexistente o un argumento
 * inválido terminen en un 500 genérico (OWASP WSTG-ERRH-01).
 *
 * <p>No interfiere con {@code ResponseStatusException} (la maneja el framework y
 * el advice de expediente) ni con excepciones de dominio específicas.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorDto argumentoInvalido(IllegalArgumentException ex) {
        return new ApiErrorDto(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage());
    }
}