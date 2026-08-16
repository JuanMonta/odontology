package api.dto;

import java.util.List;

public record ConsultorioDto(
        String id,
        String code,
        String name,
        String unit,
        String location,
        List<String> equipment,
        List<String> tratamientos,
        String status,
        String lastUse,
        int procedures) {
}
