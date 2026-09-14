package api.controllers;

import api.dto.ChatAdjuntoDto;
import api.entities.ChatAdjunto;
import api.services.ChatAdjuntoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Adjuntos del chat: subida multipart (requiere ser miembro de la conversación)
 * y descarga solo para miembros, con {@code Content-Disposition} según la
 * categoría verificada y {@code nosniff}. El MIME se sirve del metadato
 * validado por firma, nunca del Content-Type que envíe el cliente.
 */
@RestController
@RequestMapping("/api/v1/chat/adjuntos")
@RequiredArgsConstructor
public class ChatAdjuntosController {

    private final ChatAdjuntoService adjuntoService;

    @PostMapping
    public ChatAdjuntoDto subir(Authentication auth,
                                @RequestParam("conversacionId") Long conversacionId,
                                @RequestParam("file") MultipartFile file) {
        try {
            return adjuntoService.guardar(conversacionId, codigo(auth), file);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> descargar(Authentication auth, @PathVariable Long id) {
        ChatAdjunto adjunto;
        Path ruta;
        try {
            adjunto = adjuntoService.obtenerParaAcceso(id, codigo(auth));
            ruta = adjuntoService.rutaDe(adjunto);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
        try {
            String actitud = adjuntoService.esInline(adjunto) ? "inline" : "attachment";
            String nombre = adjuntoService.nombreSeguroDe(adjunto);
            String filename = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(adjunto.getTipo()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            actitud + "; filename*=UTF-8''" + filename)
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                    .contentLength(Files.size(ruta))
                    .body(new FileSystemResource(ruta));
        } catch (IOException | RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ARCHIVO NO DISPONIBLE");
        }
    }

    private String codigo(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof api.entities.Usuario u)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO AUTENTICADO");
        }
        return u.getCodigo();
    }
}