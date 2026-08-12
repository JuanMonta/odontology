package api.controllers;

import api.dto.ChatCanalDraftDto;
import api.dto.ChatConversacionDto;
import api.dto.ChatMensajeDto;
import api.dto.ChatParticipanteDto;
import api.dto.ChatPresenciaDto;
import api.entities.Usuario;
import api.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * API REST del chat (todas las rutas exigen JWT: las protege SecurityConfig).
 * Lo efímero (typing) y el push en vivo van por STOMP; lo durable va por aquí.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversaciones")
    public List<ChatConversacionDto> conversaciones(Authentication auth) {
        return chatService.listMisConversaciones(codigo(auth));
    }

    @GetMapping("/conversaciones/{id}/mensajes")
    public List<ChatMensajeDto> historial(Authentication auth, @PathVariable Long id) {
        try {
            return chatService.historial(id, codigo(auth));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PostMapping("/conversaciones/dm/{otroCodigo}")
    public ChatConversacionDto abrirDm(Authentication auth, @PathVariable String otroCodigo) {
        return chatService.getOrCreateDm(codigo(auth), otroCodigo);
    }

    @PostMapping("/conversaciones")
    public ChatConversacionDto crearCanal(Authentication auth, @RequestBody ChatCanalDraftDto draft) {
        try {
            return chatService.createCanal(codigo(auth), draft);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PostMapping("/conversaciones/{id}/miembros/{usuarioCodigo}")
    public ChatConversacionDto agregarMiembro(Authentication auth, @PathVariable Long id,
                                              @PathVariable String usuarioCodigo) {
        try {
            return chatService.addMiembro(codigo(auth), id, usuarioCodigo);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @DeleteMapping("/conversaciones/{id}/miembros/{usuarioCodigo}")
    public ChatConversacionDto quitarMiembro(Authentication auth, @PathVariable Long id,
                                             @PathVariable String usuarioCodigo) {
        try {
            return chatService.removeMiembro(codigo(auth), id, usuarioCodigo);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PatchMapping("/conversaciones/{id}/leer")
    public void marcarLeido(Authentication auth, @PathVariable Long id) {
        chatService.markRead(id, codigo(auth));
    }

    @GetMapping("/no-leidos")
    public long noLeidos(Authentication auth) {
        return chatService.unreadTotal(codigo(auth));
    }

    @GetMapping("/presencia")
    public List<ChatPresenciaDto> presencia(Authentication auth) {
        return chatService.presencia();
    }

    @GetMapping("/usuarios-activos")
    public List<ChatParticipanteDto> usuariosActivos(Authentication auth) {
        return chatService.usuariosActivos();
    }

    private String codigo(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Usuario u)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO AUTENTICADO");
        }
        return u.getCodigo();
    }
}
