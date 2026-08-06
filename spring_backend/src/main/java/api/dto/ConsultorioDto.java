package api.dto;

import java.util.List;

public record ConsultorioDto(
        String id,
        String code,
        String name,
        String unit,
        String dentist,
        String location,
        List<String> equipment,
        String status,
        String lastUse,
        int procedures) {
}
