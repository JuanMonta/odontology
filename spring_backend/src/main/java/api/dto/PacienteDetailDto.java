package api.dto;

import java.util.List;

public record PacienteDetailDto(
        List<PatientAppointmentDto> appointments,
        List<AccountEntryDto> account,
        List<ToothDto> teeth) {
}
