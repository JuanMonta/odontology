package api.dto;

import java.util.List;

public record ConsultorioDraftDto(
        String name,
        String unit,
        String location,
        List<String> equipment,
        List<String> tratamientos,
        String status) {
}
