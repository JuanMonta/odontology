package api.services;

import api.dto.CatalogoDraftDto;
import api.dto.CatalogoDto;
import api.dto.PermisoDto;
import api.dto.RolDto;
import api.dto.RolPermisosDto;
import api.dto.UsuarioDto;
import api.dto.UsuarioDraftDto;
import api.entities.Permiso;
import api.entities.RolPermiso;
import api.entities.RolPermisoId;
import api.entities.Usuario;
import api.entities.UsuarioEstado;
import api.entities.UsuarioRol;
import api.repositories.OdontologoRepository;
import api.repositories.PermisoRepository;
import api.repositories.RolPermisoRepository;
import api.repositories.UsuarioEstadoRepository;
import api.repositories.UsuarioRepository;
import api.repositories.UsuarioRolRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final OdontologoRepository odontologoRepository;
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
                .odontologoCodigo(validarOdontologo(draft.odontologoCodigo()))
                .build();
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto update(UsuarioDto dto) {
        Usuario usuario = usuarioRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + dto.code()));
        String rolNuevo = validarRol(dto.role());
        String estadoNuevo = validarEstado(dto.status());
        // Regla último super-admin: ni democión ni suspensión que deje cero.
        if ("activo".equals(usuario.getEstado()) && "activo".equals(estadoNuevo)
                && esSuperAdminPorNombre(usuario.getRol()) && !esSuperAdminPorNombre(rolNuevo)
                && contarSuperAdminsActivos() <= 1) {
            throw conflicto("NO SE PUEDE DEMOVER: ES EL ÚLTIMO SUPER-ADMINISTRADOR ACTIVO");
        }
        if ("activo".equals(usuario.getEstado()) && !"activo".equals(estadoNuevo)
                && esSuperAdminPorNombre(usuario.getRol()) && contarSuperAdminsActivos() <= 1) {
            throw conflicto("NO SE PUEDE SUSPENDER: ES EL ÚLTIMO SUPER-ADMINISTRADOR ACTIVO");
        }
        usuario.setUsername(dto.username());
        usuario.setNombre(dto.name());
        usuario.setRol(rolNuevo);
        usuario.setEstado(estadoNuevo);
        usuario.setTelefono(dto.phone());
        usuario.setOdontologoCodigo(validarOdontologo(dto.odontologoCodigo()));
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto toggleStatus(String code) {
        Usuario usuario = usuarioRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + code));
        String siguiente = "activo".equals(usuario.getEstado()) ? "suspendido" : "activo";
        if ("activo".equals(usuario.getEstado()) && esSuperAdminPorNombre(usuario.getRol())
                && contarSuperAdminsActivos() <= 1) {
            throw conflicto("NO SE PUEDE SUSPENDER: ES EL ÚLTIMO SUPER-ADMINISTRADOR ACTIVO");
        }
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
        if (Boolean.TRUE.equals(rol.getSistema())) {
            throw conflicto("ROL PROTEGIDO POR SISTEMA: NO SE PUEDE RENOMBRAR NI DESACTIVAR");
        }
        String nombre = normalizar(dto.nombre());
        rolRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(rol.getCodigo()))
                .ifPresent(existente -> {
                    throw conflicto("EL ROL YA EXISTE: " + nombre.toUpperCase());
                });
        if (Boolean.FALSE.equals(dto.activo()) && Boolean.TRUE.equals(rol.getActivo())) {
            validarVacio(rol);
            validarCoberturaSuperAdmin(rol);
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
        if (Boolean.TRUE.equals(rol.getSistema())) {
            throw conflicto("ROL PROTEGIDO POR SISTEMA: NO SE PUEDE DESACTIVAR");
        }
        if (Boolean.TRUE.equals(rol.getActivo())) {
            validarVacio(rol);
            validarCoberturaSuperAdmin(rol);
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

    // ────────────── RBAC · catálogo y matriz de permisos ──────────────

    @Transactional(readOnly = true)
    public List<PermisoDto> listPermisos() {
        return permisoRepository.findAllByOrderByCategoriaAscCodigoAsc().stream()
                .map(p -> new PermisoDto(p.getCodigo(), p.getCategoria(), p.getAccion(), p.getDescripcion()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RolPermisosDto getRolPermisos(String code) {
        findRol(code);
        return new RolPermisosDto(code, rolPermisoRepository.findPermisosByRol(code));
    }

    /**
     * Reemplaza la matriz de un rol (toggles del editor). Reglas:
     * - el rol sistema no pierde SUPER_ADMIN;
     * - solo super-admin concede SUPER_ADMIN;
     * - revocar el último SUPER_ADMIN efectivo se rechaza con 409.
     */
    @Transactional
    public RolPermisosDto setRolPermisos(String code, List<String> permisos) {
        UsuarioRol rol = findRol(code);
        Set<String> pedido = new LinkedHashSet<>(permisos == null ? List.of() : permisos);
        // Códigos inexistentes se rechazan (nada silencioso).
        for (String p : pedido) {
            if (!permisoRepository.existsById(p)) {
                throw new IllegalArgumentException("PERMISO NO VÁLIDO: " + p);
            }
        }
        if (Boolean.TRUE.equals(rol.getSistema()) && !pedido.contains("SUPER_ADMIN")) {
            throw conflicto("ROL PROTEGIDO POR SISTEMA: NO SE PUEDE REVOCAR SUPER_ADMIN");
        }
        if (pedido.contains("SUPER_ADMIN") && !rolTieneSuperAdmin(code) && !callerEsSuperAdmin()) {
            throw conflicto("SOLO UN SUPER-ADMINISTRADOR PUEDE CONCEDER SUPER_ADMIN");
        }
        boolean pierdeSuper = rolTieneSuperAdmin(code) && !pedido.contains("SUPER_ADMIN");
        if (pierdeSuper && coberturaSuperAdminSin(code) <= 0) {
            throw conflicto("NO SE PUEDE REVOCAR: ES EL ÚLTIMO SUPER-ADMINISTRADOR EFECTIVO");
        }
        rolPermisoRepository.deleteByIdRolCodigo(code);
        for (String p : pedido) {
            rolPermisoRepository.save(RolPermiso.builder()
                    .id(new RolPermisoId(code, p)).build());
        }
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                CatalogSnapshotService.ACCION_EDITAR, rol.getNombre(), rol.getNombre(),
                "PERMISOS: " + pedido.size());
        return new RolPermisosDto(code, rolPermisoRepository.findPermisosByRol(code));
    }

    /** Permisos efectivos del rol por nombre (para JWT y filtros). */
    @Transactional(readOnly = true)
    public List<String> permisosDeRol(String nombreRol) {
        return rolRepository.findByNombre(normalizar(nombreRol))
                .map(r -> rolPermisoRepository.findPermisosByRol(r.getCodigo()))
                .orElse(List.of());
    }

    // ────────────── Guards último super-admin ──────────────

    private boolean rolTieneSuperAdmin(String rolCodigo) {
        return rolPermisoRepository.findPermisosByRol(rolCodigo).contains("SUPER_ADMIN");
    }

    private boolean esSuperAdminPorNombre(String nombreRol) {
        if (nombreRol == null) {
            return false;
        }
        return rolRepository.findByNombre(nombreRol).map(r ->
                rolPermisoRepository.findPermisosByRol(r.getCodigo()).contains("SUPER_ADMIN"))
                .orElse(false);
    }

    /** Cuentas activas cuyo rol concede SUPER_ADMIN. */
    private long contarSuperAdminsActivos() {
        List<String> roles = rolPermisoRepository.findNombresRolesSuperAdmin();
        if (roles.isEmpty()) {
            return 0;
        }
        return usuarioRepository.countByRolInAndEstado(roles, "activo");
    }

    /** Super-admins activos que NO dependen del rol indicado. */
    private long coberturaSuperAdminSin(String rolCodigo) {
        UsuarioRol rol = findRol(rolCodigo);
        List<String> roles = rolPermisoRepository.findNombresRolesSuperAdmin().stream()
                .filter(n -> !n.equals(rol.getNombre())).toList();
        if (roles.isEmpty()) {
            return 0;
        }
        return usuarioRepository.countByRolInAndEstado(roles, "activo");
    }

    /** Desactivar un rol con SUPER_ADMIN no deja cero cobertura efectiva. */
    private void validarCoberturaSuperAdmin(UsuarioRol rol) {
        if (rolTieneSuperAdmin(rol.getCodigo()) && coberturaSuperAdminSin(rol.getCodigo()) <= 0
                && usuarioRepository.countByRolAndEstado(rol.getNombre(), "activo") > 0) {
            throw conflicto("NO SE PUEDE DESACTIVAR: DEJARÍA SIN SUPER-ADMINISTRADOR AL SISTEMA");
        }
    }

    private boolean callerEsSuperAdmin() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                    ? null
                    : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof Usuario u) {
                return esSuperAdminPorNombre(u.getRol());
            }
        } catch (Exception ignored) {
            // Sin contexto (tests, seed): se niega por defecto.
        }
        return false;
    }

    /**
     * Eliminación física de un rol. Reglas: nunca un rol de sistema, nunca un
     * rol con cuentas asignadas (cualquier estado). La matriz se va en cascada.
     */
    @Transactional
    public void eliminarRol(String code) {
        UsuarioRol rol = findRol(code);
        if (Boolean.TRUE.equals(rol.getSistema())) {
            throw conflicto("ROL PROTEGIDO POR SISTEMA: NO SE PUEDE ELIMINAR");
        }
        long cuentas = usuarioRepository.findByRol(rol.getNombre()).size();
        if (cuentas > 0) {
            throw conflicto("NO SE PUEDE ELIMINAR: EL ROL TIENE " + cuentas + " CUENTA(S) ASIGNADA(S). "
                    + "REASIGNA PRIMERO LOS USUARIOS");
        }
        rolPermisoRepository.deleteByIdRolCodigo(code);
        rolRepository.delete(rol);
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_ROL, rol.getCodigo(),
                CatalogSnapshotService.ACCION_ELIMINAR, rol.getNombre(), null, null);
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
        return new RolDto(rol.getCodigo(), rol.getCodigo(), rol.getNombre(), rol.getActivo(),
                Boolean.TRUE.equals(rol.getSistema()));
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
                u.getTelefono(),
                u.getOdontologoCodigo());
    }

    /** Ficha profesional vinculada (opcional): debe existir en el roster. */
    private String validarOdontologo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        String limpio = codigo.trim().toUpperCase();
        if (odontologoRepository.findById(limpio).isEmpty()) {
            throw new IllegalArgumentException("ODONTÓLOGO NO REGISTRADO: " + limpio);
        }
        return limpio;
    }

    private static String hashPassword(String password) {
        String plano = (password == null || password.isBlank()) ? "sas2026" : password;
        return BCrypt.hashpw(plano, BCrypt.gensalt(10));
    }
}
