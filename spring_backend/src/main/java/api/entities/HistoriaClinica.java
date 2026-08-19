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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Historia clínica odontológica del Formulario 033 (HCU-form.033/2008 MSP).
 * Varias hojas por paciente: la clave es compuesta {@code (paciente_id, hoja)};
 * cada hoja es una continuación de la misma numeración de HC (regla 4 del manual).
 * La sección 6 (odontograma) vive en {@code patient_teeth}; los bloques
 * estructurados se persisten como JSON (LONGTEXT) y los serializa Jackson.
 */
@Entity
@Table(name = "historia_clinica_033")
@IdClass(HistoriaClinica.HojaId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriaClinica {

    @Id
    @Column(name = "paciente_id", length = 12)
    private String pacienteId;

    @Id
    @Column(name = "hoja")
    private Integer hoja;

    @Column(name = "establecimiento", length = 120)
    private String establecimiento;

    @Column(name = "sexo", length = 1)
    private String sexo;

    @Column(name = "programado")
    private boolean programado;

    @Column(name = "motivo_consulta", columnDefinition = "TEXT")
    private String motivoConsulta;

    @Column(name = "problema_actual", columnDefinition = "TEXT")
    private String problemaActual;

    @Column(name = "ant_alergia_antibiotico")
    private boolean antAlergiaAntibiotico;

    @Column(name = "ant_alergia_anestesia")
    private boolean antAlergiaAnestesia;

    @Column(name = "ant_hemorragias")
    private boolean antHemorragias;

    @Column(name = "ant_vih_sida")
    private boolean antVihSida;

    @Column(name = "ant_tuberculosis")
    private boolean antTuberculosis;

    @Column(name = "ant_asma")
    private boolean antAsma;

    @Column(name = "ant_diabetes")
    private boolean antDiabetes;

    @Column(name = "ant_hipertension")
    private boolean antHipertension;

    @Column(name = "ant_enf_cardiaca")
    private boolean antEnfCardiaca;

    @Column(name = "ant_otro")
    private boolean antOtro;

    @Column(name = "ant_otro_texto", columnDefinition = "TEXT")
    private String antOtroTexto;

    @Column(name = "parentesco", length = 120)
    private String parentesco;

    @Column(name = "presion_arterial", length = 16)
    private String presionArterial;

    @Column(name = "frecuencia_cardiaca")
    private Integer frecuenciaCardiaca;

    @Column(name = "temperatura", length = 10)
    private String temperatura;

    @Column(name = "frecuencia_respiratoria")
    private Integer frecuenciaRespiratoria;

    @Column(name = "examen_regiones", columnDefinition = "LONGTEXT")
    private String examenRegiones;

    @Column(name = "higiene_placa")
    private Integer higienePlaca;

    @Column(name = "higiene_calculo")
    private Integer higieneCalculo;

    @Column(name = "gingivitis", length = 16)
    private String gingivitis;

    @Column(name = "mal_oclusion", length = 16)
    private String malOclusion;

    @Column(name = "fluorosis", length = 16)
    private String fluorosis;

    @Column(name = "enfermedad_periodontal", length = 16)
    private String enfermedadPeriodontal;

    @Column(name = "higiene_sextantes", columnDefinition = "LONGTEXT")
    private String higieneSextantes;

    @Column(name = "indices_cpo", columnDefinition = "LONGTEXT")
    private String indicesCpo;

    @Column(name = "plan_biometria")
    private boolean planBiometria;

    @Column(name = "plan_rayosx")
    private boolean planRayosX;

    @Column(name = "plan_quimica_sanguinea")
    private boolean planQuimicaSanguinea;

    @Column(name = "plan_otros")
    private boolean planOtros;

    @Column(name = "plan_otros_texto", columnDefinition = "TEXT")
    private String planOtrosTexto;

    @Column(name = "plan_terapeutico", columnDefinition = "TEXT")
    private String planTerapeutico;

    @Column(name = "plan_educacional", columnDefinition = "TEXT")
    private String planEducacional;

    @Column(name = "fecha_apertura")
    private LocalDate fechaApertura;

    @Column(name = "fecha_control")
    private LocalDate fechaControl;

    @Column(name = "numero_hoja", length = 16)
    private String numeroHoja;

    @Column(name = "profesional_nombre", length = 120)
    private String profesionalNombre;

    @Column(name = "profesional_fecha")
    private LocalDate profesionalFecha;

    @Column(name = "profesional_firma", length = 120)
    private String profesionalFirma;

    @Column(name = "diagnosticos_cie", columnDefinition = "LONGTEXT")
    private String diagnosticosCie;

    @Column(name = "sesiones", columnDefinition = "LONGTEXT")
    private String sesiones;

    @Column(name = "actualizada_en")
    private LocalDateTime actualizadaEn;

    /** Clave compuesta del Formulario 033: paciente + número de hoja.
     *  Nombrada {@code HojaId} (no {@code Id}) para no eclipsar a
     *  {@code jakarta.persistence.Id} dentro de esta clase. */
    public static class HojaId implements Serializable {

        private String pacienteId;
        private Integer hoja;

        public HojaId() {
        }

        public HojaId(String pacienteId, Integer hoja) {
            this.pacienteId = pacienteId;
            this.hoja = hoja;
        }

        public String getPacienteId() {
            return pacienteId;
        }

        public void setPacienteId(String pacienteId) {
            this.pacienteId = pacienteId;
        }

        public Integer getHoja() {
            return hoja;
        }

        public void setHoja(Integer hoja) {
            this.hoja = hoja;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof HojaId id)) {
                return false;
            }
            return Objects.equals(pacienteId, id.pacienteId) && Objects.equals(hoja, id.hoja);
        }

        @Override
        public int hashCode() {
            return Objects.hash(pacienteId, hoja);
        }
    }
}