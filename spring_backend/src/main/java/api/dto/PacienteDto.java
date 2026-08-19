package api.dto;

import java.math.BigDecimal;

public record PacienteDto(
        String id,
        String name,
        String cedula,
        String sexo,
        String birthDate,
        int age,
        String birthday,
        String phone,
        String email,
        String address,
        String allergies,
        String status,
        String treatment,
        String lastVisit,
        BigDecimal debt) {
}
