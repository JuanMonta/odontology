package api.controllers;

import api.dto.AuthLoginDto;
import api.dto.AuthResponseDto;
import api.dto.CambiarClaveDto;
import api.dto.RecuperarClaveDto;
import api.dto.UsuarioDto;
import api.entities.Usuario;
import api.services.AuthService;
import api.services.RecuperacionClaveService;
import api.services.UsuariosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuariosService usuariosService;
    private final RecuperacionClaveService recuperacionClaveService;

    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody AuthLoginDto login) {
        try {
            return authService.login(login);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @GetMapping("/me")
    public UsuarioDto me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario u)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO AUTENTICADO");
        }
        return usuariosService.toDto(u);
    }

    /** Canje self-service del código de un solo uso (sin sesión). */
    @PostMapping("/reestablecer-clave")
    public void reestablecerClave(@RequestBody RecuperarClaveDto dto) {
        try {
            recuperacionClaveService.reestablecer(dto);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /** Cambio de clave verificando la actual (cambio forzado / voluntario). */
    @PostMapping("/cambiar-clave")
    public void cambiarClave(@RequestBody CambiarClaveDto dto) {
        try {
            recuperacionClaveService.cambiarClave(dto);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
