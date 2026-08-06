package api.dto;

public record OdontologoDraftDto(
        String name,
        String specialty,
        String license,
        String consultorio,
        String turno,
        String status,
        Integer experience) {
}
