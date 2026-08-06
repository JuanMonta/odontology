package api.dto;

import java.math.BigDecimal;

public record TratamientoDraftDto(
        String name,
        String category,
        int durationMin,
        BigDecimal price,
        boolean active,
        String description) {
}
