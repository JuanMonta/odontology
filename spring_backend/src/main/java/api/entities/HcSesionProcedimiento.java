package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

/**
 * Relación (FK) entre una sesión del Formulario 033 (sección 12) y los
 * procedimientos odontológicos ejecutados en esa cita/sesión del paciente.
 * La clave es compuesta {@code (paciente_id, hoja, sesion, procedimiento_codigo)}.
 */
@Entity
@Table(name = "hc_sesion_procedimientos")
@IdClass(HcSesionProcedimiento.SesionProcId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HcSesionProcedimiento {

    @Id
    @Column(name = "paciente_id", length = 12)
    private String pacienteId;

    @Id
    @Column(name = "hoja")
    private Integer hoja;

    @Id
    @Column(name = "sesion")
    private Integer sesion;

    @Id
    @Column(name = "procedimiento_codigo", length = 10)
    private String procedimientoCodigo;

    @SuppressWarnings("serial")
    public static class SesionProcId implements Serializable {
        public String pacienteId;
        public Integer hoja;
        public Integer sesion;
        public String procedimientoCodigo;

        public SesionProcId() {
        }

        public SesionProcId(String pacienteId, Integer hoja, Integer sesion, String procedimientoCodigo) {
            this.pacienteId = pacienteId;
            this.hoja = hoja;
            this.sesion = sesion;
            this.procedimientoCodigo = procedimientoCodigo;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SesionProcId)) return false;
            SesionProcId that = (SesionProcId) o;
            return Objects.equals(pacienteId, that.pacienteId)
                    && Objects.equals(hoja, that.hoja)
                    && Objects.equals(sesion, that.sesion)
                    && Objects.equals(procedimientoCodigo, that.procedimientoCodigo);
        }

        @Override
        public int hashCode() {
            return Objects.hash(pacienteId, hoja, sesion, procedimientoCodigo);
        }
    }
}
