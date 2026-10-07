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
 * Lease de exclusión mutua entre instancias del backend (tabla
 * {@code respaldo_lease}). Una sola fila por recurso: la KEY primaria es
 * {@code recurso} (p. ej. {@code BD} para el respaldo de la base de datos).
 *
 * <p>A diferencia de un lock de la JVM, este estado sobrevive a la request HTTP
 * y es compartido por todos los backends que apuntan a la misma base, que es lo
 * que necesita un job asíncrono largo como el dump de {@code mariadb-dump}.
 *
 * <p>Un lease no es eterno: {@link #caducaEn} acota su vida. Si el proceso que
 * lo tomó muere, el lease caduca solo y otra instancia puede tomar el relevo, de
 * modo que un backend caído no deja el recurso bloqueado para siempre.
 */
@Entity
@Table(name = "respaldo_lease")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespaldoLease {

    /** Recurso de la aplicación: {@code BD} para el respaldo de la base. */
    public static final String RECURSO_BD = "BD";

    @Id
    @Column(name = "recurso", nullable = false, length = 32)
    private String recurso;

    @Column(name = "job_id", nullable = false, length = 16)
    private String jobId;

    @Column(name = "instancia", length = 80)
    private String instancia;

    @Column(name = "tomado_en", nullable = false)
    private LocalDateTime tomadoEn;

    @Column(name = "caduca_en", nullable = false)
    private LocalDateTime caducaEn;
}