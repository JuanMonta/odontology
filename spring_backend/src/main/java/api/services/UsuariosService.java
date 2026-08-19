package api.services;

import api.dto.CatalogoDraftDto;
import api.dto.CatalogoDto;
import api.dto.RolDto;
import api.dto.UsuarioDto;
import api.dto.UsuarioDraftDto;
import api.entities.Usuario;
import api.entities.UsuarioEstado;
import api.entities.UsuarioRol;
import api.repositories.UsuarioEstadoRepository;
import api.repositories.UsuarioRepository;
import api.repositories.UsuarioRolRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Cuentas del sistema (usuarios del backend) y sus catálogos de rol/estado.
 * El rol y el estado de una cuenta deben existir en los catálogos
 * {@code usuario_roles} / {@code usuario_estados}.
 */
@Service
@RequiredArgsConstructor
public class UsuariosService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolRepository rolRepository;
    private final UsuarioEstadoRepository estadoRepository;
    private final CodigoService codigoService;
    private final CatalogSnapshotService snapshots;

    @Transactional(readOnly = true)
    public List<UsuarioDto> list() {
        return usuarioRepository.findAll().stream()
                .sorted(Comparator.comparing(Usuario::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UsuarioDto add(UsuarioDraftDto draft) {
        String rol = validarRol(draft.role());
        String estado = validarEstado(draft.status());
        String hash = hashPassword(draft.password());
        Usuario usuario = Usuario.builder()
                .codigo(codigoService.nextCodigo("USR", "USR-%03d"))
                .username(draft.username())
                .passwordHash(hash)
                .nombre(draft.name())
                .rol(rol)
                .estado(estado)
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
        usuario.setRol(validarRol(dto.role()));
        usuario.setEstado(validarEstado(dto.status()));
        usuario.setTelefono(dto.phone());
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto toggleStatus(String code) {
        Usuario usuario = usuarioRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + code));
        String siguiente = "activo".equals(usuario.getEstado()) ? "suspendido" : "activo";
        usuario.setEstado(validarEstado(siguiente));
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public List<CatalogoDto> listRoles() {
        return rolRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(r -> new CatalogoDto(r.getCodigo(), r.getNombre()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RolDto> listRolesTodos() {
        return rolRepository.findAll().stream()
                .sorted(Comparator.comparing(UsuarioRol::getCodigo))
                .map(this::toRolDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogoDto> listEstados() {
        return estadoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(e -> new CatalogoDto(e.getCodigo(), e.getNombre()))
                .toList();
    }

    @Transactional
    public RolDto crearRol(CatalogoDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (rolRepository.findByNombre(nombre).isPresent()) {
            throw new IllegalArgumentException("EL ROL YA EXISTE: " + nombre.toUpperCase());
        }
        UsuarioRol rol = UsuarioRol.builder()
                .codigo(codigoService.nextCodigo("ROL", "ROL-%03d"))
                .nombre(nombre)
                .activo(true)
                .build();
        rolRepository.save(rol);
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                CatalogSnapshotService.ACCION_CREAR, null, rol.getNombre(), null);
        return toRolDto(rol);
    }

    /**
     * Renombra un rol y (opcionalmente) lo desactiva. Al renombrar se
     * propaga el cambio a las cuentas que lo tienen asignado para no dejar
     * referencias huérfanas. La baja respeta la regla "vacía primero":
     * un rol en uso por cuentas activas no se puede desactivar.
     */
    @Transactional
    public RolDto updateRol(RolDto dto) {
        UsuarioRol rol = findRol(dto.code());
        String nombre = normalizar(dto.nombre());
        rolRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(rol.getCodigo()))
                .ifPresent(existente -> {
                    throw conflicto("EL ROL YA EXISTE: " + nombre.toUpperCase());
                });
        if (Boolean.FALSE.equals(dto.activo()) && Boolean.TRUE.equals(rol.getActivo())) {
            validarVacio(rol);
        }
        String nombreAnterior = rol.getNombre();
        rol.setNombre(nombre);
        rol.setActivo(dto.activo());
        rolRepository.save(rol);
        if (!nombreAnterior.equals(nombre)) {
            List<Usuario> afectados = usuarioRepository.findByRol(nombreAnterior);
            afectados.forEach(u -> u.setRol(nombre));
            usuarioRepository.saveAll(afectados);
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                    CatalogSnapshotService.ACCION_RENOMBRAR, nombreAnterior, nombre,
                    "CUENTAS ACTUALIZADAS: " + afectados.size());
        }
        if (!Boolean.TRUE.equals(rol.getActivo())) {
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                    CatalogSnapshotService.ACCION_DESACTIVAR, nombreAnterior, nombre, null);
        }
        return toRolDto(rol);
    }

    @Transactional
    public RolDto toggleRolStatus(String code) {
        UsuarioRol rol = findRol(code);
        if (Boolean.TRUE.equals(rol.getActivo())) {
            validarVacio(rol);
        }
        boolean ibaActivo = Boolean.TRUE.equals(rol.getActivo());
        rol.setActivo(!rol.getActivo());
        rolRepository.save(rol);
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                ibaActivo ? CatalogSnapshotService.ACCION_DESACTIVAR
                        : CatalogSnapshotService.ACCION_ACTIVAR,
                rol.getNombre(), rol.getNombre(), null);
        return toRolDto(rol);
    }

    @Transactional
    public CatalogoDto crearEstado(CatalogoDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (estadoRepository.findByNombre(nombre).isPresent()) {
            throw new IllegalArgumentException("EL ESTADO YA EXISTE: " + nombre.toUpperCase());
        }
        UsuarioEstado estado = UsuarioEstado.builder()
                .codigo(codigoService.nextCodigo("EST", "EST-%03d"))
                .nombre(nombre)
                .activo(true)
                .build();
        estadoRepository.save(estado);
        return new CatalogoDto(estado.getCodigo(), estado.getNombre());
    }

    private String validarRol(String rol) {
        String nombre = normalizar(rol);
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            throw new IllegalArgumentException("ROL NO VÁLIDO: " + nombre.toUpperCase());
        }
        return nombre;
    }

    private String validarEstado(String estado) {
        String nombre = normalizar(estado);
        if (estadoRepository.findByNombre(nombre).isEmpty()) {
            throw new IllegalArgumentException("ESTADO NO VÁLIDO: " + nombre.toUpperCase());
        }
        return nombre;
    }

    private static String normalizar(String valor) {
        String limpio = valor == null ? "" : valor.trim().toLowerCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("EL VALOR ES OBLIGATORIO");
        }
        return limpio;
    }

    private UsuarioRol findRol(String code) {
        return rolRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "ROL NO ENCONTRADO: " + code));
    }

    private void validarVacio(UsuarioRol rol) {
        long activos = usuarioRepository.countByRolAndEstado(rol.getNombre(), "activo");
        if (activos > 0) {
            throw conflicto(
                    "NO SE PUEDE DESACTIVAR: EL ROL TIENE " + activos + " CUENTA(S) ACTIVA(S). "
                            + "REASIGNA PRIMERO LOS USUARIOS");
        }
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private RolDto toRolDto(UsuarioRol rol) {
        return new RolDto(rol.getCodigo(), rol.getCodigo(), rol.getNombre(), rol.getActivo());
    }

    public UsuarioDto toDto(Usuario u) {
        return new UsuarioDto(
                u.getCodigo(),
                u.getCodigo(),
                u.getUsername(),
                u.getNombre(),
                u.getRol(),
                u.getEstado(),
                FormatoUtil.fechaHora(u.getUltimoAcceso()),
                u.getTelefono());
    }

    private static String hashPassword(String password) {
        String plano = (password == null || password.isBlank()) ? "sas2026" : password;
        return BCrypt.hashpw(plano, BCrypt.gensalt(10));
    }
}
