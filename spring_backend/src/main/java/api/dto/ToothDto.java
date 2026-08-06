package api.dto;

import java.util.List;

public record ToothDto(
        int number,
        List<ToothConditionDto> conditions,
        List<ToothFaceDto> faces,
        String movilidad,
        String recesion) {
}
