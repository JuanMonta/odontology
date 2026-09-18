package api.services;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lockout de credenciales en memoria (anti fuerza bruta sobre {@code /auth/login}).
 *
 * <p>Tras {@link #MAX_FALLOS} intentos fallidos consecutivos, la cuenta queda
 * bloqueada {@link #VENTANA_BLOQUEO} minutos. El estado es por instancia (single
 * node), suficiente para el despliegue actual; un pool multi-instancia debería
 * mover el conteo a una caché compartida (Redis).</p>
 */
@Component
public class LoginThrottleService {

    private static final int MAX_FALLOS = 5;
    private static final Duration VENTANA_BLOQUEO = Duration.ofMinutes(5);

    private record Estado(int fallos, Instant bloqueoHasta) {
    }

    private final ConcurrentHashMap<String, Estado> estados = new ConcurrentHashMap<>();

    public boolean estaBloqueado(String username) {
        Estado estado = estados.get(username);
        if (estado == null) {
            return false;
        }
        Instant limite = estado.bloqueoHasta();
        if (limite != null) {
            if (limite.isAfter(Instant.now())) {
                return true;
            }
            estados.remove(username, estado);
        }
        return false;
    }

    public long segundosDeBloqueo(String username) {
        Estado estado = estados.get(username);
        if (estado == null || estado.bloqueoHasta() == null) {
            return 0;
        }
        return Math.max(0, Duration.between(Instant.now(), estado.bloqueoHasta()).toSeconds());
    }

    public void registrarFallo(String username) {
        estados.compute(username, (k, previo) -> {
            boolean ventanaLimpia = previo == null || (previo.bloqueoHasta() != null
                    && !previo.bloqueoHasta().isAfter(Instant.now()));
            int fallos = ventanaLimpia ? 1 : previo.fallos() + 1;
            Instant bloqueo = fallos >= MAX_FALLOS ? Instant.now().plus(VENTANA_BLOQUEO) : null;
            return new Estado(fallos, bloqueo);
        });
    }

    public void limpiar(String username) {
        estados.remove(username);
    }
}