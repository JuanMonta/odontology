package api.dto;

import java.time.LocalDate;

public record PacienteDraftDto(
        String name,
        String cedula,
        String sexo,
        Integer age,
        String birthday,
        String phone,
        String email,
        String address,
        String allergies,
        String status,
        String treatment,
        String lastVisit,
        LocalDate fechaNacimiento) {
}
