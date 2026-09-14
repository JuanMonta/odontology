package api.controllers;

import api.config.WebSocketConfig;
import api.dto.ChatMensajeDto;
import api.entities.Usuario;
import api.services.ChatService;
import api.services.PresenciaService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

/**
 * Canal STOMP del chat: recibe transmisiones y eventos efímeros y los difunde
 * al topic de cada conversación. La persistencia la hace {@link ChatService}
 * para que el historial viva en MariaDB y no dependa de la sesión WS.
 */
@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final PresenciaService presenciaService;
    private final SimpMessagingTemplate messagingTemplate;

    /** Payload {@code {conversacionId, cuerpo, adjuntoId?}}. */
    @MessageMapping("/chat.enviar")
    public void enviar(Principal principal, Map<String, Object> payload) {
        if (principal == null || payload == null) {
            return;
        }
        Usuario remitente = usuarioDe(principal);
        if (remitente == null) {
            return;
        }
        Object conv = payload.get("conversacionId");
        if (!(conv instanceof Number)) {
            return;
        }
        long conversacionId = ((Number) conv).longValue();
        if (conversacionId <= 0) {
            return;
        }
        String cuerpo = payload.get("cuerpo") instanceof String s ? s : null;
        Long adjuntoId = payload.get("adjuntoId") instanceof Number an ? an.longValue() : null;
        try {
            ChatMensajeDto dto = chatService.send(conversacionId, remitente.getCodigo(), cuerpo, adjuntoId);
            messagingTemplate.convertAndSend("/topic/chat/" + conversacionId, (Object) dto);
            actualizarPresenciaTopic();
        } catch (IllegalArgumentException ex) {
            // Mensaje inválido (vacío, longitud, adjunto ajeno, no-miembro):
            // se descarta sin tumbar la sesión STOMP ni romper la difusión.
        }
    }

    /** Payload {@code {conversacionId, typing}}. */
    @MessageMapping("/chat.escribiendo")
    public void escribiendo(Principal principal, Map<String, Object> payload) {
        if (principal == null || payload == null
                || !(payload.get("conversacionId") instanceof Number)) {
            return;
        }
        long conversacionId = ((Number) payload.get("conversacionId")).longValue();
        boolean typing = Boolean.TRUE.equals(payload.get("typing"));
        Usuario usuario = usuarioDe(principal);
        if (usuario == null) {
            return;
        }
        messagingTemplate.convertAndSend("/topic/chat/" + conversacionId + "/typing",
                (Object) Map.of("codigo", usuario.getCodigo(), "nombre", usuario.getNombre(), "typing", typing));
    }

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null) {
            presenciaService.conectar(principal.getName());
            actualizarPresenciaTopic();
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null) {
            presenciaService.desconectar(principal.getName());
            actualizarPresenciaTopic();
        }
    }

    private void actualizarPresenciaTopic() {
        messagingTemplate.convertAndSend("/topic/presencia", (Object) chatService.presencia());
    }

    /** Usuario del principal STOMP (normalizado por {@link WebSocketConfig}). */
    private Usuario usuarioDe(Principal principal) {
        if (principal instanceof WebSocketConfig.UsuarioPrincipal up) {
            return up.usuario();
        }
        return null;
    }
}
