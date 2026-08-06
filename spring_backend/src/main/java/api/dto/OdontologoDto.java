package api.dto;

public record OdontologoDto(
        String id,
        String code,
        String name,
        String specialty,
        String license,
        String consultorio,
        String turno,
        String status,
        int experience,
        int procedures) {
}
