package api.config;

import api.entities.Usuario;
import api.repositories.UsuarioRepository;
import api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * WebSocket STOMP sobre SockJS para el chat en tiempo real.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code GET /ws} — handshake (SockJS). El JWT viaja como query param
 *       {@code ?token=...} porque los navegadores no permiten headers en el
 *       primer salto SockJS.</li>
 *   <li>{@code /app/chat.enviar} — persistir y difundir una transmisión.</li>
 *   <li>{@code /app/chat.escribiendo} — indicador de escritura efímero.</li>
 *   <li>{@code /topic/chat/{id}} — transmisiones nuevas de una conversación.</li>
 *   <li>{@code /topic/chat/{id}/typing} — indicador de escritura.</li>
 *   <li>{@code /topic/presencia} — lista de tripulación conectada.</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200")
                .addInterceptors(handshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                if (accessor.getSessionAttributes() != null && accessor.getUser() == null
                        && accessor.getSessionAttributes().containsKey("usuario")) {
                    Usuario usuario = (Usuario) accessor.getSessionAttributes().get("usuario");
                    accessor.setUser(new UsuarioPrincipal(usuario));
                    return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
                }
                return message;
            }
        });
    }

    private HandshakeInterceptor handshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                           WebSocketHandler wsHandler, Map<String, Object> attributes) {
                String token = UriComponentsBuilder.fromUri(request.getURI())
                        .build().getQueryParams().getFirst("token");
                if (token == null || token.isBlank()) {
                    return false;
                }
                try {
                    String codigo = (String) jwtUtil.parse(token).get("sub");
                    Usuario usuario = usuarioRepository.findById(codigo).orElse(null);
                    if (usuario == null || !"activo".equals(usuario.getEstado())) {
                        return false;
                    }
                    attributes.put("usuario", usuario);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Exception exception) {
            }
        };
    }

    /** Principal STOMP con el Usuario completo para resolver remitente en @MessageMapping. */
    public record UsuarioPrincipal(Usuario usuario)
            implements java.security.Principal {
        @Override
        public String getName() {
            return usuario.getCodigo();
        }
    }

    public List<String> allowedOrigins() {
        return List.of("http://localhost:4200");
    }
}
