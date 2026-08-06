package api.dto;

import java.math.BigDecimal;

public record AccountEntryDto(
        Long id,
        String date,
        String concept,
        BigDecimal amount,
        String type,
        String method) {
}
