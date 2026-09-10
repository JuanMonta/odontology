package api.security;

import api.entities.Usuario;
import api.repositories.UsuarioRepository;
import api.services.UsuariosService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Valida el {@code Authorization: Bearer <jwt>} de cada petición y, si es
 * válido, deja el usuario cargado en el SecurityContext para que los
 * controllers de chat resuelvan quién firma cada transmisión.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final UsuariosService usuariosService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        String token = null;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        } else if (request.getRequestURI().startsWith("/ws")) {
            // SockJS handshake no permite headers: token via ?token= (ver WebSocketConfig:32)
            token = request.getParameter("token");
        }
        if (token != null && !token.isBlank()) {
            try {
                Map<String, Object> claims = jwtUtil.parse(token);
                String codigo = (String) claims.get("sub");
                Usuario usuario = usuarioRepository.findById(codigo).orElse(null);
                if (usuario != null && "activo".equals(usuario.getEstado())) {
                    // Authorities RBAC frescas desde la matriz (el JWT solo transporta
                    // identidad; los permisos se resuelven en servidor por petición).
                    java.util.List<String> perms;
                    try {
                        perms = usuariosService.permisosDeRol(usuario.getRol());
                        if (perms.contains("SUPER_ADMIN")) {
                            perms = usuariosService.listPermisos().stream()
                                    .map(api.dto.PermisoDto::codigo).toList();
                        }
                    } catch (Exception e) {
                        perms = java.util.List.of();
                    }
                    java.util.List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority(
                            "ROLE_" + usuario.getRol().toUpperCase().replace(' ', '_')));
                    for (String p : perms) {
                        authorities.add(new SimpleGrantedAuthority(p));
                    }
                    var auth = new UsernamePasswordAuthenticationToken(
                            usuario, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
