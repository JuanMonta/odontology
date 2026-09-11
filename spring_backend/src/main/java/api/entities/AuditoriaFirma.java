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
 * Rastro inmutable de firma divergente en HC033: la sesión tenía ficha
 * profesional vinculada pero la hoja declara otro profesional. Sin FKs para
 * que el rastro sobreviva a bajas de cuentas o fichas.
 */
@Entity
@Table(name = "auditoria_firmas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaFirma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "usuario_codigo", nullable = false, length = 12)
    private String usuarioCodigo;

    @Column(name = "usuario_nombre", nullable = false, length = 80)
    private String usuarioNombre;

    @Column(name = "odontologo_codigo", length = 12)
    private String odontologoCodigo;

    @Column(name = "firmado_nombre", nullable = false, length = 120)
    private String firmadoNombre;

    @Column(name = "firmado_codigo", length = 15)
    private String firmadoCodigo;

    @Column(name = "paciente_id", nullable = false, length = 12)
    private String pacienteId;

    @Column(name = "hoja", nullable = false)
    private Integer hoja;
}
