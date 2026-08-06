package api.services;

import api.dto.ClinicaSettingsDto;
import api.entities.ClinicaSetting;
import api.repositories.ClinicaSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Configuración de la clínica (fila única id = 1).
 */
@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private final ClinicaSettingRepository settingsRepository;

    @Transactional(readOnly = true)
    public ClinicaSettingsDto get() {
        return toDto(settingsRepository.findById(1)
                .orElseThrow(() -> new IllegalStateException("No existe la configuración de la clínica")));
    }

    @Transactional
    public ClinicaSettingsDto save(ClinicaSettingsDto dto) {
        ClinicaSetting setting = settingsRepository.findById(1)
                .orElseGet(() -> ClinicaSetting.builder().id(1).build());
        setting.setNombre(dto.nombre());
        setting.setRuc(dto.ruc());
        setting.setDireccion(dto.direccion());
        setting.setTelefono(dto.telefono());
        setting.setEmail(dto.email());
        setting.setHorarioInicio(dto.horarioInicio());
        setting.setHorarioFin(dto.horarioFin());
        setting.setDuracionCita(dto.duracionCita());
        setting.setToleranciaRetraso(dto.toleranciaRetraso());
        setting.setDiasAtencion(dto.diasAtencion());
        setting.setMoneda(dto.moneda());
        setting.setFormatoFecha(dto.formatoFecha());
        setting.setRecordatorioCitas(dto.recordatorioCitas());
        setting.setNotificacionUrgente(dto.notificacionUrgente());
        setting.setAvisoVencimiento(dto.avisoVencimiento());
        return toDto(settingsRepository.save(setting));
    }

    private ClinicaSettingsDto toDto(ClinicaSetting s) {
        return new ClinicaSettingsDto(
                s.getNombre(),
                s.getRuc(),
                s.getDireccion(),
                s.getTelefono(),
                s.getEmail(),
                s.getHorarioInicio(),
                s.getHorarioFin(),
                s.getDuracionCita(),
                s.getToleranciaRetraso(),
                s.getDiasAtencion(),
                s.getMoneda(),
                s.getFormatoFecha(),
                s.getRecordatorioCitas(),
                s.getNotificacionUrgente(),
                s.getAvisoVencimiento());
    }
}
