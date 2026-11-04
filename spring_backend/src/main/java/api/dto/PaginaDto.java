package api.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Envoltura de paginacion independiente de Spring Data: el JSON expuesto no
 * hereda los campos internos de {@code Page} y se puede versionar aparte.
 *
 * <p>Se usa solo cuando el cliente pide {@code size} o {@code page}; sin esos
 * parametros el endpoint sigue devolviendo el array plano de siempre.
 */
public record PaginaDto<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size) {

    public static <T> PaginaDto<T> of(Page<T> pagina) {
        return new PaginaDto<>(
                pagina.getContent(),
                pagina.getTotalElements(),
                pagina.getTotalPages(),
                pagina.getNumber(),
                pagina.getSize());
    }
}
