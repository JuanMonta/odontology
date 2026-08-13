package api.controllers;

import api.dto.EspecialidadDraftDto;
import api.dto.EspecialidadDto;
import api.services.EspecialidadesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/especialidades")
@RequiredArgsConstructor
public class EspecialidadesController {

    private final EspecialidadesService especialidadesService;

    @GetMapping
    public List<EspecialidadDto> list() {
        return especialidadesService.list();
    }

    @GetMapping("/activas")
    public List<EspecialidadDto> listActivas() {
        return especialidadesService.listActivas();
    }

    @PostMapping
    public EspecialidadDto add(@RequestBody EspecialidadDraftDto draft) {
        return especialidadesService.add(draft);
    }

    @PutMapping("/{code}")
    public EspecialidadDto update(@PathVariable String code, @RequestBody EspecialidadDto dto) {
        return especialidadesService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public EspecialidadDto toggleStatus(@PathVariable String code) {
        return especialidadesService.toggleStatus(code);
    }
}
