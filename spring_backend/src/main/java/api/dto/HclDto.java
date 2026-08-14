package api.dto;

import java.util.List;

/**
 * Historia clínica odontológica Formulario 033. Los bloques estructurados del
 * papel (examen por región, índices CPO-ceo, diagnóstico CIE y sesiones de
 * tratamiento) se modelan como sub-documentos anidados.
 */
public record HclDto(
        String pacienteId,
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
        IndicesCpoDto indicesCpo,
        boolean planBiometria,
        boolean planRayosX,
        boolean planQuimicaSanguinea,
        boolean planOtros,
        String fechaApertura,
        String fechaControl,
        String numeroHoja,
        List<DiagnosticoCieDto> diagnosticosCie,
        List<SesionTratamientoDto> sesiones,
        String actualizadaEn
) {

    /** 5 · Región del sistema estomatognático examinada con su descripción. */
    public record RegionExamenDto(int region, String descripcion) {
    }

    /** 8 · Índice CPO (permanentes) por sextante: C = caries, P = perdido, O = obturado. */
    public record CpoItemDto(String sextante, Integer c, Integer p, Integer o) {
    }

    /** 8 · Índice ceo (deciduos) por sextante: c = caries, e = extraído, o = obturado. */
    public record CeoItemDto(String sextante, Integer c, Integer e, Integer o) {
    }

    /** 8 · Pares de listas: permanente (CPO) y deciduo (ceo). */
    public record IndicesCpoDto(List<CpoItemDto> permanente, List<CeoItemDto> deciduo) {
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
            String codigo
    ) {
    }
}