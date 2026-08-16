package api.dto;

import java.math.BigDecimal;
import java.util.List;

public record TratamientoDto(
        String id,
        String code,
        String name,
        String category,
        int durationMin,
        BigDecimal price,
        boolean active,
        String description,
        int usage,
        List<String> consultorios) {
}
