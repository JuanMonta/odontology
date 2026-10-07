package api.dto;

import java.time.LocalDateTime;

public record RespaldoJobDto(
        String jobId,
        String estado, // EN_PROGRESO | COMPLETADO | FALLADO
        String mensaje,
        String archivo,
        Long bytes,
        LocalDateTime generadoEn,
        LocalDateTime iniciadoEn,
        String bindAddress,
        String advertencia,
        String error,
        int progreso // 0-100
) {}
