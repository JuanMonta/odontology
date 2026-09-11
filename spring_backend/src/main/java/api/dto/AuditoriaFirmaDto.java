package api.dto;

public record AuditoriaFirmaDto(
        Long id,
        String createdAt,
        String usuarioCodigo,
        String usuarioNombre,
        String odontologoCodigo,
        String firmadoNombre,
        String firmadoCodigo,
        String pacienteId,
        Integer hoja) {
}
