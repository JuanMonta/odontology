package api.controllers;

import api.dto.CategoriaDraftDto;
import api.dto.CategoriaDto;
import api.services.CategoriasService;
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
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriasController {

    private final CategoriasService categoriasService;

    @GetMapping
    public List<CategoriaDto> list() {
        return categoriasService.list();
    }

    @GetMapping("/activas")
    public List<CategoriaDto> listActivas() {
        return categoriasService.listActivas();
    }

    @PostMapping
    public CategoriaDto add(@RequestBody CategoriaDraftDto draft) {
        return categoriasService.add(draft);
    }

    @PutMapping("/{code}")
    public CategoriaDto update(@PathVariable String code, @RequestBody CategoriaDto dto) {
        return categoriasService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public CategoriaDto toggleStatus(@PathVariable String code) {
        return categoriasService.toggleStatus(code);
    }
}
