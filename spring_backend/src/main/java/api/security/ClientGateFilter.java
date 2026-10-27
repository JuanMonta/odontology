package api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Portero de clientes: la API solo atiende a la Aplicacion de Escritorio.
 *
 * <p>El launcher de estacion abre Edge/Chrome en modo {@code --app} con el
 * User-Agent {@code SaaSClinicaDesktop/1.x}; cualquier navegador comun (o un
 * script sin esa marca) recibe {@code 403} aunque tenga credenciales validas.
 * Es una defensa en profundidad junto al JWT: primero "eres una estacion",
 * despues "quien eres".
 *
 * <p>Quedan exentos {@code /api/v1/health} (lo consultan los launchers y la
 * pagina informativa del servidor) y los {@code OPTIONS} de preflight CORS.
 * Se desactiva con {@code app.client-gate.enabled=false} para pruebas.
 *
 * <p>Limitacion honesta: el User-Agent se puede falsificar con una herramienta
 * manual; esto impide el acceso accidental desde un navegador, no un ataque
 * dirigido. Para eso esta el JWT y, mas adelante, TLS mutuo.
 */
@Component
public class ClientGateFilter extends OncePerRequestFilter {

    static final String MARCA_ESCRITORIO = "SaaSClinicaDesktop/";

    private final ObjectMapper objectMapper;
    private final boolean habilitado;

    public ClientGateFilter(ObjectMapper objectMapper,
                            @Value("${app.client-gate.enabled:true}") boolean habilitado) {
        this.objectMapper = objectMapper;
        this.habilitado = habilitado;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!habilitado || !estaProtegida(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        if (esClienteEscritorio(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("status", HttpServletResponse.SC_FORBIDDEN);
        cuerpo.put("error", "Forbidden");
        cuerpo.put("message", "Solo la aplicacion de escritorio de la clinica puede usar este servicio");
        objectMapper.writeValue(response.getWriter(), cuerpo);
    }

    private boolean estaProtegida(HttpServletRequest request) {
        String ruta = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        if (!ruta.startsWith("/api/") && !ruta.startsWith("/ws")) {
            return false;
        }
        // Exentos: health (launchers/sondeos) y descubrimiento de servidor
        // (server/info, server/qr): permitAll por diseno y los usa la pagina
        // informativa desde un navegador comun para mostrar la direccion LAN.
        return !ruta.equals("/api/v1/health")
                && !ruta.startsWith("/api/v1/health/")
                && !ruta.equals("/api/v1/server/info")
                && !ruta.equals("/api/v1/server/qr");
    }

    private boolean esClienteEscritorio(HttpServletRequest request) {
        if ("1".equals(request.getHeader("X-SaaS-Desktop"))) {
            return true;
        }
        String agente = request.getHeader("User-Agent");
        return agente != null && agente.startsWith(MARCA_ESCRITORIO);
    }
}
