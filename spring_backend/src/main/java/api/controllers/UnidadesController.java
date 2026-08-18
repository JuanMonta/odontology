package api.controllers;

import api.dto.UnidadDraftDto;
import api.dto.UnidadDto;
import api.services.UnidadesService;
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
@RequestMapping("/api/v1/unidades")
@RequiredArgsConstructor
public class UnidadesController {

    private final UnidadesService unidadesService;

    @GetMapping
    public List<UnidadDto> list() {
        return unidadesService.list();
    }

    @GetMapping("/activas")
    public List<UnidadDto> listActivas() {
        return unidadesService.listActivas();
    }

    @PostMapping
    public UnidadDto add(@RequestBody UnidadDraftDto draft) {
        return unidadesService.add(draft);
    }

    @PutMapping("/{code}")
    public UnidadDto update(@PathVariable String code, @RequestBody UnidadDto dto) {
        return unidadesService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public UnidadDto toggleStatus(@PathVariable String code) {
        return unidadesService.toggleStatus(code);
    }
}