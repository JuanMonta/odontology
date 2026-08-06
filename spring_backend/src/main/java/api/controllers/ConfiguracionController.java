package api.controllers;

import api.dto.ClinicaSettingsDto;
import api.services.ConfiguracionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    @GetMapping
    public ClinicaSettingsDto get() {
        return configuracionService.get();
    }

    @PutMapping
    public ClinicaSettingsDto save(@RequestBody ClinicaSettingsDto dto) {
        return configuracionService.save(dto);
    }
}
