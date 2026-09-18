package api.services;

import api.dto.CambiarClaveDto;
import api.dto.CodigoRecuperacionDto;
import api.dto.PasswordTemporalDto;
import api.dto.RecuperarClaveDto;
import api.entities.PasswordResetToken;
import api.entities.Usuario;
import api.repositories.PasswordResetTokenRepository;
import api.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Recuperación de acceso sin tocar el buzón de la clínica.
 *
 * <p>Opción 2 (self-service): el admin emite un {@code password_reset_tokens}
 * de un solo uso (solo hash en base) y se lo entrega por el canal interno; el
 * usuario lo canjea en el login junto a su nueva clave. Opción 1 (admin): la
 * cuenta recibe una clave temporal y el flag {@code debe_cambiar_clave}, así el
 * próximo ingreso queda bloqueado hasta redefinir la contraseña.</p>
 */
@Service
@RequiredArgsConstructor
public class RecuperacionClaveService {

    private static final int LONGITUD_CODIGO = 6;
    private static final int LONGITUD_TEMPORAL = 10;
    private static final Duration VALIDEZ = Duration.ofMinutes(15);
    private static final int CLAVE_MINIMA = 8;
    private static final int MAX_INTENTOS = 5;
    /** Mensaje único: no revela si la cuenta o el código existen (anti-enumeración). */
    private static final String MENSAJE_CANJE = "USUARIO O CÓDIGO INCORRECTOS";
    private static final char[] ALFABETO_TEMPORAL =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789".toCharArray();

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final UsuariosService usuariosService;

    private final SecureRandom aleatorio = new SecureRandom();

    /** Emite un código de un solo uso; el texto claro vuelve solo al admin. */
    @Transactional
    public CodigoRecuperacionDto generarCodigo(String codigoUsuario) {
        Usuario usuario = usuarioRepository.findById(codigoUsuario)
                .orElseThrow(() -> new IllegalArgumentException("USUARIO NO ENCONTRADO: " + codigoUsuario));
        validarObjetivoAjeno(usuario, "NO PUEDES GENERAR UN CÓDIGO DE RECUPERACIÓN PARA TU PROPIA CUENTA");
        if (!"activo".equals(usuario.getEstado())) {
            throw new IllegalArgumentException("CUENTA SUSPENDIDA: " + codigoUsuario);
        }
        tokenRepository.marcarUsados(usuario.getCodigo());
        String codigo = codigoNumerico(LONGITUD_CODIGO);
        tokenRepository.save(PasswordResetToken.builder()
                .usuarioCodigo(usuario.getCodigo())
                .codigoHash(sha256(codigo))
                .expiraEn(LocalDateTime.now().plus(VALIDEZ))
                .usado(false)
                .intentos(0)
                .build());
        return new CodigoRecuperacionDto(codigo, (int) VALIDEZ.toMinutes());
    }

    /** Canjea el código (un solo uso) por una clave nueva. Sin sesión. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void reestablecer(RecuperarClaveDto dto) {
        Usuario usuario = usuarioRepository.findByUsername(normalizar(dto.username()))
                .orElseThrow(() -> new IllegalArgumentException(MENSAJE_CANJE));
        PasswordResetToken token = tokenRepository
                .findFirstByUsuarioCodigoAndUsadoFalseOrderByCreadoEnDesc(usuario.getCodigo())
                .orElseThrow(() -> new IllegalArgumentException(MENSAJE_CANJE));
        if (token.getExpiraEn().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(MENSAJE_CANJE);
        }
        String pedido = dto.codigo() == null ? "" : dto.codigo().trim();
        if (!hexIgual(sha256(pedido), token.getCodigoHash())) {
            // Agota el token tras 5 códigos incorrectos: la fuerza bruta sobre 6
            // dígitos deja de ser viable dentro de la ventana de 15 minutos.
            token.setIntentos(token.getIntentos() + 1);
            if (token.getIntentos() >= MAX_INTENTOS) {
                token.setUsado(true);
            }
            tokenRepository.save(token);
            throw new IllegalArgumentException(MENSAJE_CANJE);
        }
        validarNuevaClave(dto.nuevaClave());
        token.setUsado(true);
        tokenRepository.save(token);
        reemplazarClave(usuario, dto.nuevaClave());
    }

    /** Cambio con verificación de la clave actual (forzado o voluntario). */
    @Transactional
    public void cambiarClave(CambiarClaveDto dto) {
        Usuario usuario = usuarioRepository.findByUsername(normalizar(dto.username()))
                .orElseThrow(() -> new IllegalArgumentException("USUARIO O CONTRASEÑA INCORRECTOS"));
        String hash = usuario.getPasswordHash();
        String actual = dto.claveActual() == null ? "" : dto.claveActual();
        if (hash == null || hash.isEmpty() || !BCrypt.checkpw(actual, hash)) {
            throw new IllegalArgumentException("CONTRASEÑA ACTUAL INCORRECTA");
        }
        validarNuevaClave(dto.nuevaClave());
        if (BCrypt.checkpw(dto.nuevaClave(), hash)) {
            throw new IllegalArgumentException("LA NUEVA CLAVE DEBE SER DISTINTA A LA ACTUAL");
        }
        reemplazarClave(usuario, dto.nuevaClave());
    }

    /** Reset por admin: clave temporal + flag obligatorio de cambio. */
    @Transactional
    public PasswordTemporalDto resetearClave(String codigoUsuario) {
        Usuario usuario = usuarioRepository.findById(codigoUsuario)
                .orElseThrow(() -> new IllegalArgumentException("USUARIO NO ENCONTRADO: " + codigoUsuario));
        validarObjetivoAjeno(usuario, "NO PUEDES RESETEAR LA CLAVE DE TU PROPIA CUENTA");
        String temporal = temporalAleatoria();
        reemplazarClave(usuario, temporal);
        usuario.setDebeCambiarClave(true);
        usuarioRepository.save(usuario);
        tokenRepository.marcarUsados(usuario.getCodigo());
        return new PasswordTemporalDto(temporal,
                "CLAVE TEMPORAL — SE OBLIGARÁ EL CAMBIO EN EL PRÓXIMO INGRESO");
    }

    // ────────────── helpers ──────────────

    private void reemplazarClave(Usuario usuario, String clave) {
        usuario.setPasswordHash(BCrypt.hashpw(clave, BCrypt.gensalt(10)));
        usuario.setDebeCambiarClave(false);
        usuarioRepository.save(usuario);
    }

    private void validarNuevaClave(String clave) {
        if (clave == null || clave.length() < CLAVE_MINIMA
                || clave.chars().noneMatch(Character::isUpperCase)
                || clave.chars().noneMatch(Character::isDigit)
                || clave.chars().allMatch(Character::isLetterOrDigit)) {
            throw new IllegalArgumentException("LA NUEVA CLAVE DEBE TENER MÍNIMO 8 CARACTERES, "
                    + "1 MAYÚSCULA, 1 NÚMERO Y 1 SÍMBOLO");
        }
    }

    private String codigoNumerico(int digitos) {
        StringBuilder sb = new StringBuilder(digitos);
        for (int i = 0; i < digitos; i++) {
            sb.append(aleatorio.nextInt(10));
        }
        return sb.toString();
    }

    private String temporalAleatoria() {
        StringBuilder sb = new StringBuilder(LONGITUD_TEMPORAL);
        for (int i = 0; i < LONGITUD_TEMPORAL; i++) {
            sb.append(ALFABETO_TEMPORAL[aleatorio.nextInt(ALFABETO_TEMPORAL.length)]);
        }
        return sb.toString();
    }

    private static String sha256(String texto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    (texto == null ? "" : texto).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo calcular el hash del código", e);
        }
    }

    /** Comparación de hashes hex a prueba de timing. */
    private static boolean hexIgual(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.US_ASCII),
                b.getBytes(StandardCharsets.US_ASCII));
    }

    /**
     * El admin actúa siempre sobre cuentas AJENAS: nada de auto-códigos ni
     * auto-resets. Además, las cuentas super-admin solo las toca un super-admin.
     */
    private void validarObjetivoAjeno(Usuario objetivo, String mensajePropio) {
        if (usuariosService.esCuentaPropia(objetivo.getCodigo())) {
            throw new IllegalArgumentException(mensajePropio);
        }
        if (usuariosService.esCuentaSuperAdmin(objetivo.getCodigo())
                && !usuariosService.llamanteEsSuperAdmin()) {
            throw new IllegalArgumentException(
                    "SOLO UN SUPER-ADMINISTRADOR PUEDE GESTIONAR CUENTAS SUPER-ADMIN");
        }
    }

    private static String normalizar(String username) {
        String limpio = username == null ? "" : username.trim().toLowerCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("USUARIO O CONTRASEÑA INCORRECTOS");
        }
        return limpio;
    }
}