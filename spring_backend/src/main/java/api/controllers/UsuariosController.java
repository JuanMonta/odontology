package api.controllers;

import api.dto.CatalogoDto;
import api.dto.CatalogoDraftDto;
import api.dto.CodigoRecuperacionDto;
import api.dto.PasswordTemporalDto;
import api.dto.PermisoDto;
import api.dto.RolDto;
import api.dto.RolPermisosDto;
import api.dto.UsuarioDto;
import api.dto.UsuarioDraftDto;
import api.services.RecuperacionClaveService;
import api.services.UsuariosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuariosController {

    private final UsuariosService usuariosService;
    private final RecuperacionClaveService recuperacionClaveService;

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

    @GetMapping("/roles")
    public List<CatalogoDto> roles() {
        return usuariosService.listRoles();
    }

    @GetMapping("/roles/todos")
    public List<RolDto> rolesTodos() {
        return usuariosService.listRolesTodos();
    }

    @PostMapping("/roles")
    public RolDto crearRol(@RequestBody CatalogoDraftDto draft) {
        return usuariosService.crearRol(draft);
    }

    @PutMapping("/roles/{code}")
    public RolDto updateRol(@PathVariable String code, @RequestBody RolDto dto) {
        return usuariosService.updateRol(dto);
    }

    @PatchMapping("/roles/{code}/toggle-status")
    public RolDto toggleRolStatus(@PathVariable String code) {
        return usuariosService.toggleRolStatus(code);
    }

    @DeleteMapping("/roles/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarRol(@PathVariable String code) {
        usuariosService.eliminarRol(code);
    }

    @GetMapping("/permisos")
    public List<PermisoDto> permisos() {
        return usuariosService.listPermisos();
    }

    @GetMapping("/roles/{code}/permisos")
    public RolPermisosDto rolPermisos(@PathVariable String code) {
        return usuariosService.getRolPermisos(code);
    }

    @PutMapping("/roles/{code}/permisos")
    public RolPermisosDto setRolPermisos(@PathVariable String code, @RequestBody RolPermisosDto dto) {
        return usuariosService.setRolPermisos(code, dto.permisos());
    }

    @GetMapping("/estados")
    public List<CatalogoDto> estados() {
        return usuariosService.listEstados();
    }

    @PostMapping("/estados")
    public CatalogoDto crearEstado(@RequestBody CatalogoDraftDto draft) {
        return usuariosService.crearEstado(draft);
    }

    /** Emite el código de un solo uso (Opción 2); el admin lo entrega al usuario. */
    @PostMapping("/{code}/generar-codigo-recuperacion")
    public CodigoRecuperacionDto generarCodigoRecuperacion(@PathVariable String code) {
        try {
            return recuperacionClaveService.generarCodigo(code);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /** Reset por admin (Opción 1): clave temporal + cambio obligatorio al ingresar. */
    @PostMapping("/{code}/resetear-clave")
    public PasswordTemporalDto resetearClave(@PathVariable String code) {
        try {
            return recuperacionClaveService.resetearClave(code);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
