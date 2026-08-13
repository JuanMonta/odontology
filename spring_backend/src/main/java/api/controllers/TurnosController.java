package api.controllers;

import api.dto.TurnoDraftDto;
import api.dto.TurnoDto;
import api.services.TurnosService;
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
@RequestMapping("/api/v1/turnos")
@RequiredArgsConstructor
public class TurnosController {

    private final TurnosService turnosService;

    @GetMapping
    public List<TurnoDto> list() {
        return turnosService.list();
    }

    @GetMapping("/activos")
    public List<TurnoDto> listActivos() {
        return turnosService.listActivos();
    }

    @PostMapping
    public TurnoDto add(@RequestBody TurnoDraftDto draft) {
        return turnosService.add(draft);
    }

    @PutMapping("/{code}")
    public TurnoDto update(@PathVariable String code, @RequestBody TurnoDto dto) {
        return turnosService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public TurnoDto toggleStatus(@PathVariable String code) {
        return turnosService.toggleStatus(code);
    }
}
