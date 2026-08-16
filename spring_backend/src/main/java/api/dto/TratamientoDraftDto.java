package api.dto;

import java.math.BigDecimal;
import java.util.List;

public record TratamientoDraftDto(
        String name,
        String category,
        int durationMin,
        BigDecimal price,
        boolean active,
        String description,
        List<String> consultorios) {
}
