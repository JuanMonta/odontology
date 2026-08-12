package api.services;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro de usuarios con sesión WebSocket activa. Lo alimentan los eventos de
 * conexión/desconexión STOMP y lo consume el endpoint de presencia y el chat.
 */
@Service
public class PresenciaService {

    private final Set<String> online = ConcurrentHashMap.newKeySet();

    public void conectar(String usuarioCodigo) {
        if (usuarioCodigo != null && !usuarioCodigo.isBlank()) {
            online.add(usuarioCodigo);
        }
    }

    public void desconectar(String usuarioCodigo) {
        if (usuarioCodigo != null) {
            online.remove(usuarioCodigo);
        }
    }

    public Map<String, Boolean> online() {
        return Map.copyOf(online.stream()
                .collect(java.util.stream.Collectors.toMap(c -> c, c -> Boolean.TRUE)));
    }

    public boolean estaOnline(String usuarioCodigo) {
        return online.contains(usuarioCodigo);
    }
}
