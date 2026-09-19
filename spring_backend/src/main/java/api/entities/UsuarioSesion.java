package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Sesión activa de un usuario (tabla {@code usuario_sesion}). Una sola fila por
 * usuario: la KEY primaria es {@code usuario_codigo}. Guarda el {@code jti} del
 * JWT vigente emitido en el último login; al ingresar desde otra estación, la
 * fila se reemplaza y el token anterior deja de ser válido. {@code creadoEn}
 * permite mostrar al equipo reemplazado cuándo se inició la nueva sesión.
 */
@Entity
@Table(name = "usuario_sesion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioSesion {

    @Id
    @Column(name = "usuario_codigo", nullable = false, length = 12)
    private String usuarioCodigo;

    @Column(name = "jti", nullable = false, length = 64)
    private String jti;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "navegador", length = 255)
    private String navegador;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;
}