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
 * Historia clínica odontológica del Formulario 033 (HCU-form.033/2008 MSP).
 * Una fila por paciente. La sección 6 (odontograma) vive en {@code patient_teeth};
 * los bloques estructurados se persisten como JSON (LONGTEXT) y los serializa
 * Jackson a través de la capa de servicio.
 */
@Entity
@Table(name = "historia_clinica_033")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriaClinica {

    @Id
    @Column(name = "paciente_id", length = 12)
    private String pacienteId;

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

    @Column(name = "fecha_apertura", length = 10)
    private String fechaApertura;

    @Column(name = "fecha_control", length = 10)
    private String fechaControl;

    @Column(name = "numero_hoja", length = 16)
    private String numeroHoja;

    @Column(name = "diagnosticos_cie", columnDefinition = "LONGTEXT")
    private String diagnosticosCie;

    @Column(name = "sesiones", columnDefinition = "LONGTEXT")
    private String sesiones;

    @Column(name = "actualizada_en")
    private LocalDateTime actualizadaEn;
}