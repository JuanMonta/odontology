package api.controllers;

import api.dto.TratamientoDto;
import api.dto.TratamientoDraftDto;
import api.services.TratamientosService;
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
@RequestMapping("/api/v1/tratamientos")
@RequiredArgsConstructor
public class TratamientosController {

    private final TratamientosService tratamientosService;

    @GetMapping
    public List<TratamientoDto> list() {
        return tratamientosService.list();
    }

    @PostMapping
    public TratamientoDto add(@RequestBody TratamientoDraftDto draft) {
        return tratamientosService.add(draft);
    }

    @PutMapping("/{code}")
    public TratamientoDto update(@PathVariable String code, @RequestBody TratamientoDto dto) {
        return tratamientosService.update(dto);
    }

    @PatchMapping("/{code}/toggle-active")
    public TratamientoDto toggleActive(@PathVariable String code) {
        return tratamientosService.toggleActive(code);
    }
}
