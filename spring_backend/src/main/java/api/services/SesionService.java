package api.services;

import api.entities.UsuarioSesion;
import api.repositories.UsuarioSesionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Semáforo de una sola sesión activa por usuario. El login guarda (reemplaza)
 * la fila de sesión; la validación de cada JWT comprueba que su {@code jti}
 * sea el vigente. Así, iniciar sesión desde otra estación invalida la anterior
 * y el equipo reemplazado recibe 401 {@code SESION_REEMPLAZADA}.
 */
@Service
@RequiredArgsConstructor
public class SesionService {

    private final UsuarioSesionRepository repository;

    /** Reemplaza la sesión activa del usuario por el {@code jti} recién emitido. */
    public void reemplazar(String usuarioCodigo, String jti, String ip, String navegador) {
        repository.save(UsuarioSesion.builder()
                .usuarioCodigo(usuarioCodigo)
                .jti(jti)
                .ip(ip)
                .navegador(navegador)
                .creadoEn(LocalDateTime.now())
                .build());
    }

    /** {@code true} si el {@code jti} todavía es la sesión vigente del usuario. */
    public boolean esValida(String usuarioCodigo, String jti) {
        return repository.findById(usuarioCodigo)
                .map(s -> s.getJti().equals(jti))
                .orElse(false);
    }

    /** Sesión activa actual del usuario (la última emitida). */
    public Optional<UsuarioSesion> activa(String usuarioCodigo) {
        return repository.findById(usuarioCodigo);
    }

    /** Momento en que se inició la sesión {@code jti} (para el aviso al equipo reemplazado). */
    public Optional<LocalDateTime> creadoEn(String usuarioCodigo, String jti) {
        return repository.findById(usuarioCodigo)
                .filter(s -> s.getJti().equals(jti))
                .map(UsuarioSesion::getCreadoEn);
    }

    /** Cierra la sesión (logout) solo si aún es la vigente. */
    public void cerrar(String usuarioCodigo, String jti) {
        repository.findById(usuarioCodigo)
                .filter(s -> s.getJti().equals(jti))
                .ifPresent(repository::delete);
    }
}