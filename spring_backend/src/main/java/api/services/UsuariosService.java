package api.services;

import api.dto.UsuarioDto;
import api.dto.UsuarioDraftDto;
import api.entities.Usuario;
import api.repositories.UsuarioRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Cuentas del sistema (usuarios del backend).
 */
@Service
@RequiredArgsConstructor
public class UsuariosService {

    private final UsuarioRepository usuarioRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<UsuarioDto> list() {
        return usuarioRepository.findAll().stream()
                .sorted(Comparator.comparing(Usuario::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UsuarioDto add(UsuarioDraftDto draft) {
        String hash = hashPassword(draft.password());
        Usuario usuario = Usuario.builder()
                .codigo(codigoService.nextCodigo("USR", "USR-%03d"))
                .username(draft.username())
                .passwordHash(hash)
                .nombre(draft.name())
                .rol(Usuario.Rol.valueOf(draft.role()))
                .estado(Usuario.Estado.valueOf(draft.status()))
                .telefono("—")
                .build();
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto update(UsuarioDto dto) {
        Usuario usuario = usuarioRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + dto.code()));
        usuario.setUsername(dto.username());
        usuario.setNombre(dto.name());
        usuario.setRol(Usuario.Rol.valueOf(dto.role()));
        usuario.setEstado(Usuario.Estado.valueOf(dto.status()));
        usuario.setTelefono(dto.phone());
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto toggleStatus(String code) {
        Usuario usuario = usuarioRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + code));
        Usuario.Estado siguiente = switch (usuario.getEstado()) {
            case activo -> Usuario.Estado.suspendido;
            case suspendido, inactivo -> Usuario.Estado.activo;
        };
        usuario.setEstado(siguiente);
        return toDto(usuarioRepository.save(usuario));
    }

    public UsuarioDto toDto(Usuario u) {
        return new UsuarioDto(
                u.getCodigo(),
                u.getCodigo(),
                u.getUsername(),
                u.getNombre(),
                u.getRol().name(),
                u.getEstado().name(),
                FormatoUtil.fechaHora(u.getUltimoAcceso()),
                u.getTelefono());
    }

    private static String hashPassword(String password) {
        String plano = (password == null || password.isBlank()) ? "sas2026" : password;
        return BCrypt.hashpw(plano, BCrypt.gensalt(10));
    }
}
