package api.controllers;

import api.dto.RespaldoJobDto;
import api.dto.RespaldoRequestDto;
import api.services.RespaldoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;

/**
 * Respaldo asíncrono — solo SUPER_ADMIN (ver SecurityConfig).
 * El dump pesado corre en un worker; el endpoint responde 202 de inmediato
 * para no hacer timeout ni bloquear el hilo HTTP.
 */
@RestController
@RequestMapping("/api/v1/respaldos")
@RequiredArgsConstructor
public class RespaldoController {

    private final RespaldoService respaldoService;

    @PostMapping
    public ResponseEntity<RespaldoJobDto> crear(@RequestBody(required = false) RespaldoRequestDto body) {
        try {
            String user = body != null ? body.username() : null;
            String pass = body != null ? body.password() : null;
            RespaldoJobDto job = respaldoService.iniciarAsync(user, pass);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(job);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (IllegalStateException e) {
            // 409 = ya hay un respaldo en curso
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo iniciar el respaldo: " + e.getMessage(), e);
        }
    }

    @GetMapping("/{jobId}")
    public RespaldoJobDto estado(@PathVariable String jobId) {
        try {
            return respaldoService.obtenerJob(jobId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    @GetMapping("/ultimo")
    public ResponseEntity<RespaldoJobDto> ultimo() {
        RespaldoJobDto j = respaldoService.ultimoJob();
        if (j == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aún no hay respaldos");
        return ResponseEntity.ok(j);
    }

    @GetMapping("/descargar/{archivo:.+}")
    public ResponseEntity<Resource> descargar(@PathVariable String archivo) {
        if (archivo.contains("..") || archivo.contains("/") || archivo.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo inválido");
        }
        File file = respaldoService.resolveFile(archivo);
        if (!file.exists() || !file.isFile()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Respaldo no encontrado");
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + archivo + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(file.length())
                .body(resource);
    }
}
