package api.services;

import api.dto.AuthLoginDto;
import api.dto.AuthResponseDto;
import api.entities.Usuario;
import api.repositories.UsuarioRepository;
import api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

/**
 * Autenticación por usuario y contraseña (tabla {@code usuarios}). Emite un JWT
 * HS256 firmado con el secreto de {@code application.yaml}; el token es lo que
 * autoriza los endpoints de chat y el handshake WebSocket.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final UsuariosService usuariosService;
    private final JwtUtil jwtUtil;

    public AuthResponseDto login(AuthLoginDto login) {
        Usuario usuario = usuarioRepository.findByUsername(login.username().trim())
                .orElseThrow(() -> new IllegalArgumentException("USUARIO O CONTRASEÑA INCORRECTOS"));
        if (!"activo".equals(usuario.getEstado())) {
            throw new IllegalArgumentException("CUENTA SUSPENDIDA");
        }
        String hash = usuario.getPasswordHash();
        if (hash == null || hash.isEmpty() || !BCrypt.checkpw(login.password(), hash)) {
            throw new IllegalArgumentException("USUARIO O CONTRASEÑA INCORRECTOS");
        }
        // Permisos efectivos RBAC: SUPER_ADMIN implica el catálogo completo.
        java.util.List<String> perms = usuariosService.permisosDeRol(usuario.getRol());
        if (perms.contains("SUPER_ADMIN")) {
            perms = usuariosService.listPermisos().stream().map(api.dto.PermisoDto::codigo).toList();
        }
        String token = jwtUtil.create(
                usuario.getCodigo(), usuario.getNombre(), usuario.getRol(),
                String.join(" ", perms), 86_400_000L);
        return new AuthResponseDto(
                token, usuario.getCodigo(), usuario.getUsername(), usuario.getNombre(),
                usuario.getRol());
    }
}
