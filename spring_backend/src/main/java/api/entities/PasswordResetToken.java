package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Código de recuperación de clave de un solo uso (tabla
 * {@code password_reset_tokens}). Solo se guarda el hash SHA-256 del código;
 * el texto claro se entrega por el canal del admin (voz / interno). Un código
 * expirado o ya usado no reestablece nada.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_codigo", nullable = false, length = 12)
    private String usuarioCodigo;

    @Column(name = "codigo_hash", nullable = false, length = 64)
    private String codigoHash;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @Column(name = "usado", nullable = false)
    private Boolean usado = false;

    @Column(name = "intentos", nullable = false)
    private Integer intentos = 0;

    @CreationTimestamp
    @Column(name = "creado_en", updatable = false)
    private LocalDateTime creadoEn;
}