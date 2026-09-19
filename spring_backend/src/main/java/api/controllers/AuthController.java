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
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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
    public AuthResponseDto login(@RequestBody AuthLoginDto login, HttpServletRequest request) {
        try {
            return authService.login(login, request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    /** Cierra la sesión activa en el servidor (el token deja de ser válido). */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        authService.logout(request.getHeader("Authorization"));
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
