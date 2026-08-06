package api.controllers;

import api.dto.UsuarioDto;
import api.dto.UsuarioDraftDto;
import api.services.UsuariosService;
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
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuariosController {

    private final UsuariosService usuariosService;

    @GetMapping
    public List<UsuarioDto> list() {
        return usuariosService.list();
    }

    @PostMapping
    public UsuarioDto add(@RequestBody UsuarioDraftDto draft) {
        return usuariosService.add(draft);
    }

    @PutMapping("/{code}")
    public UsuarioDto update(@PathVariable String code, @RequestBody UsuarioDto dto) {
        return usuariosService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public UsuarioDto toggleStatus(@PathVariable String code) {
        return usuariosService.toggleStatus(code);
    }
}
