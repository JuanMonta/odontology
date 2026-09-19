package api.security;

import api.entities.Usuario;
import api.entities.UsuarioSesion;
import api.repositories.UsuarioRepository;
import api.services.SesionService;
import api.services.UsuariosService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Valida el {@code Authorization: Bearer <jwt>} de cada petición y, si es
 * válido, deja el usuario cargado en el SecurityContext. Además verifica la
 * sesión activa (tabla {@code usuario_sesion}): si el {@code jti} del token no
 * es el vigente (la cuenta se usó desde otra estación), responde
 * {@code 401 SESION_REEMPLAZADA} y el front del equipo reemplazado avisa al
 * operador. En el handshake WebSocket ({@code /ws/**}) no escribe el 401: deja
 * que el interceptor de handshake rechace la conexión.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final UsuariosService usuariosService;
    private final SesionService sesionService;
    private final ObjectMapper objectMapper;

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
                String jti = (String) claims.get("jti");
                Usuario usuario = usuarioRepository.findById(codigo).orElse(null);
                if (usuario != null && "activo".equals(usuario.getEstado())) {
                    boolean sesionOk = jti != null && !jti.isBlank()
                            && sesionService.esValida(codigo, jti);
                    if (!sesionOk) {
                        // La sesión vigente es otra: esta estación fue reemplazada.
                        UsuarioSesion activa = sesionService.activa(codigo).orElse(null);
                        if (!request.getRequestURI().startsWith("/ws")) {
                            escribirSesionReemplazada(response, activa);
                            return;
                        }
                        SecurityContextHolder.clearContext();
                    } else {
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
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private void escribirSesionReemplazada(HttpServletResponse response, UsuarioSesion activa)
            throws IOException {
        LocalDateTime reemplazada = activa == null ? LocalDateTime.now() : activa.getCreadoEn();
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("status", 401);
        cuerpo.put("error", "SESION_REEMPLAZADA");
        cuerpo.put("message", "TU SESIÓN SE CERRÓ PORQUE INICIASTE SESIÓN EN OTRO EQUIPO");
        cuerpo.put("reemplazadaEn", reemplazada != null ? reemplazada.toString() : null);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), cuerpo);
    }
}