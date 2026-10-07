package api.dto;

import java.time.LocalDateTime;

/**
 * Respuesta del endpoint de respaldo cifrado.
 * El archivo .sql.gz.enc nunca queda en el webroot: se escribe en
 * {@code app.backup.output-dir} (propiedad del SO local).
 */
public record RespaldoResponseDto(
        boolean ok,
        String mensaje,
        String archivo,
        long bytes,
        LocalDateTime generadoEn,
        String bindAddress,
        String advertencia
) {}
