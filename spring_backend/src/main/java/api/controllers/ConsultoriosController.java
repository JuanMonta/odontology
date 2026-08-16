package api.controllers;

import api.dto.ConsultorioCatalogosDto;
import api.dto.ConsultorioDto;
import api.dto.ConsultorioDraftDto;
import api.services.ConsultoriosService;
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
@RequestMapping("/api/v1/consultorios")
@RequiredArgsConstructor
public class ConsultoriosController {

    private final ConsultoriosService consultoriosService;

    @GetMapping
    public List<ConsultorioDto> list() {
        return consultoriosService.list();
    }

    @GetMapping("/catalogos")
    public ConsultorioCatalogosDto catalogos() {
        System.out.println("=== CONTROLLER: /catalogos endpoint hit ===");
        var result = consultoriosService.catalogos();
        System.out.println("=== CONTROLLER: tratamientos count = " + result.tratamientos().size());
        return result;
    }

    @PostMapping
    public ConsultorioDto add(@RequestBody ConsultorioDraftDto draft) {
        return consultoriosService.add(draft);
    }

    @PutMapping("/{code}")
    public ConsultorioDto update(@PathVariable String code, @RequestBody ConsultorioDto dto) {
        return consultoriosService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public ConsultorioDto toggleStatus(@PathVariable String code) {
        return consultoriosService.toggleStatus(code);
    }
}
