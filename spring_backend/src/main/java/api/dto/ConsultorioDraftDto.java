package api.dto;

import java.util.List;

public record ConsultorioDraftDto(
        String name,
        String unit,
        String dentist,
        String location,
        List<String> equipment,
        String status) {
}
