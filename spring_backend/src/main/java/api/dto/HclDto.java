package api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.List;

/**
 * Historia clínica odontológica Formulario 033. Una hoja por instancia: la clave
 * compuesta (paciente, número de hoja) soporta las continuaciones del mismo
 * documento. Los bloques estructurados del papel (examen por región, índices
 * CPO-ceo, diagnóstico CIE y sesiones de tratamiento) se modelan como
 * sub-documentos anidados.
 */
public record HclDto(
        String pacienteId,
        int hoja,
        String establecimiento,
        String sexo,
        boolean programado,
        String motivoConsulta,
        String problemaActual,
        boolean alergiaAntibiotico,
        boolean alergiaAnestesia,
        boolean hemorragias,
        boolean vihSida,
        boolean tuberculosis,
        boolean asma,
        boolean diabetes,
        boolean hipertension,
        boolean enfCardiaca,
        boolean otroAntecedente,
        String otroAntecedenteTexto,
        String parentesco,
        String presionArterial,
        Integer frecuenciaCardiaca,
        String temperatura,
        Integer frecuenciaRespiratoria,
        List<RegionExamenDto> examenRegiones,
        Integer higienePlaca,
        Integer higieneCalculo,
        String gingivitis,
        String malOclusion,
        String fluorosis,
        String enfermedadPeriodontal,
        IndicesCpoDto indicesCpo,
        List<HigieneSextanteDto> higieneSextantes,
        boolean planBiometria,
        boolean planRayosX,
        boolean planQuimicaSanguinea,
        boolean planOtros,
        String planOtrosTexto,
        String planTerapeutico,
        String planEducacional,
        LocalDate fechaApertura,
        LocalDate fechaControl,
        String numeroHoja,
        String profesionalNombre,
        LocalDate profesionalFecha,
        String profesionalFirma,        List<DiagnosticoCieDto> diagnosticosCie,
        List<SesionTratamientoDto> sesiones,
        String actualizadaEn
) {

    /** 5 · Región del sistema estomatognático examinada: casilla marcada + descripción. */
    public record RegionExamenDto(
            int region,
            String descripcion,
            @JsonProperty(defaultValue = "false") Boolean marcado
    ) {
        public RegionExamenDto { if (marcado == null) marcado = false; }
    }

    /** 8 · Índices CPO-ceo (Formulario 033): 2 filas × 4 columnas. */
    public record IndicesCpoDto(
            Integer cPerma, Integer pPerma, Integer oPerma, Integer totalPerma,
            Integer cDeci, Integer eDeci, Integer oDeci, Integer totalDeci
    ) {
    }

    /** 7 · Indicadores de higiene oral simplificada por sextante (IHOS) + piezas dentales. */
    public record HigieneSextanteDto(
            String sextante,
            boolean d1Evaluado, boolean d2Evaluado, boolean d3Evaluado,
            Integer placa, Integer calculo, Integer gingivitis
    ) {
    }

    /** Encabezado: resumen de cada hoja (continuación) de la misma historia clínica. */
    public record HojaResumenDto(int hoja, LocalDate fechaApertura, LocalDate fechaControl, String actualizadaEn) {
    }

    /** 11 · Diagnóstico CIE: código, presuntivo (PRE) y definitivo (DEF). */
    public record DiagnosticoCieDto(String codigo, String presuntivo, String definitivo) {
    }

    /** 12 · Sesión de tratamiento: diagnóstico/complicaciones, procedimientos, prescripción y firma. */
    public record SesionTratamientoDto(
            int sesion,
            String fecha,
            String diagnosticos,
            String procedimientos,
            String prescripciones,
            String proximaCita,
            String codigo
    ) {
    }
}