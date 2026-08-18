package api.controllers;

import api.dto.UbicacionDraftDto;
import api.dto.UbicacionDto;
import api.services.UbicacionesService;
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
@RequestMapping("/api/v1/ubicaciones")
@RequiredArgsConstructor
public class UbicacionesController {

    private final UbicacionesService ubicacionesService;

    @GetMapping
    public List<UbicacionDto> list() {
        return ubicacionesService.list();
    }

    @GetMapping("/activas")
    public List<UbicacionDto> listActivas() {
        return ubicacionesService.listActivas();
    }

    @PostMapping
    public UbicacionDto add(@RequestBody UbicacionDraftDto draft) {
        return ubicacionesService.add(draft);
    }

    @PutMapping("/{code}")
    public UbicacionDto update(@PathVariable String code, @RequestBody UbicacionDto dto) {
        return ubicacionesService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public UbicacionDto toggleStatus(@PathVariable String code) {
        return ubicacionesService.toggleStatus(code);
    }
}