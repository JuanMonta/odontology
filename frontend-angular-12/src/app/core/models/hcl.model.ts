/**
 * Historia clínica odontológica — Formulario 033 (HCU-form.033/2008 MSP).
 * Espejo del DTO del backend (HclDto). La sección 6 (odontograma) se gestiona
 * aparte vía patient_teeth; aquí viven las secciones 1-5 y 7-12.
 */

export interface HclRegionExamen {
  region: number;
  descripcion: string;
  marcado: boolean;
}

/**
 * Índices CPO-ceo (Sección 8 del Formulario 033).
 * El formulario real solo tiene 2 filas:
 *   D (permanentes): C, P, O, Total
 *   d (deciduos):    c, e, o, Total
 */
export interface HclIndicesCpo {
  c_perma: number | null;
  p_perma: number | null;
  o_perma: number | null;
  total_perma: number | null;
  c_deci: number | null;
  e_deci: number | null;
  o_deci: number | null;
  total_deci: number | null;
}

export interface HclHigieneSextante {
  sextante: string;
  d1_evaluado: boolean;
  d2_evaluado: boolean;
  d3_evaluado: boolean;
  placa: number | null;
  calculo: number | null;
  gingivitis: number | null;
}

export interface HojaResumen {
  hoja: number;
  fechaApertura: string | null;
  fechaControl: string | null;
  actualizadaEn: string | null;
}

export interface HclDiagnosticoCie {
  codigo: string;
  presuntivo: string;
  definitivo: string;
}

export interface HclSesion {
  sesion: number;
  fecha: string;
  diagnosticos: string;
  procedimientos: string;
  prescripciones: string;
  proximaCita: string;
  codigo: string;
}

/** Hoja de evolución clínica: registro cronológico append-only del expediente. */
export interface Evolucion {
  id: number;
  pacienteId: string;
  fecha: string;
  hora: string | null;
  odontologo: string | null;
  odontologoCodigo: string | null;
  registradoPor: string | null;
  registradoPorNombre: string | null;
  motivo: string | null;
  evolucion: string | null;
  plan: string | null;
  proximaCita: string | null;
  createdAt: string | null;
}

/** Borrador para el alta de una hoja de evolución. */
export interface EvolucionDraft {
  fecha: string;
  hora: string | null;
  odontologoCodigo: string | null;
  motivo: string | null;
  evolucion: string | null;
  plan: string | null;
  proximaCita: string | null;
}

export function crearEvolucionVacia(): EvolucionDraft {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    fecha: hoy,
    hora: null,
    odontologoCodigo: null,
    motivo: null,
    evolucion: null,
    plan: null,
    proximaCita: null
  };
}

export interface Hcl {
  pacienteId: string;
  hoja: number;
  establecimiento: string | null;
  parentesco: string | null;
  sexo: string | null;
  programado: boolean;
  motivoConsulta: string | null;
  problemaActual: string | null;
  alergiaAntibiotico: boolean;
  alergiaAnestesia: boolean;
  hemorragias: boolean;
  vihSida: boolean;
  tuberculosis: boolean;
  asma: boolean;
  diabetes: boolean;
  hipertension: boolean;
  enfCardiaca: boolean;
  otroAntecedente: boolean;
  otroAntecedenteTexto: string | null;
  presionArterial: string | null;
  frecuenciaCardiaca: number | null;
  temperatura: string | null;
  frecuenciaRespiratoria: number | null;
  examenRegiones: HclRegionExamen[];
  higienePlaca: number | null;
  higieneCalculo: number | null;
  gingivitis: string | null;
  malOclusion: string | null;
  fluorosis: string | null;
  enfermedadPeriodontal: string | null;
  indicesCpo: HclIndicesCpo;
  higieneSextantes: HclHigieneSextante[];
  planBiometria: boolean;
  planRayosX: boolean;
  planQuimicaSanguinea: boolean;
  planOtros: boolean;
  planOtrosTexto: string | null;
  planTerapeutico: string | null;
  planEducacional: string | null;
  fechaApertura: string | null;
  fechaControl: string | null;
  numeroHoja: string | null;
  profesionalNombre: string | null;
  profesionalCodigo: string | null;
  profesionalFirma: string | null;
  diagnosticosCie: HclDiagnosticoCie[];
  sesiones: HclSesion[];
  actualizadaEn: string | null;
}

export const SEXTO_SECTANTES = [
  '16 17 55',
  '11 21 51',
  '26 27 65',
  '36 37 75',
  '31 41 71',
  '46 47 85'
] as const;

export const REGIONES_ESTOMATOGNATICAS = [
  { region: 1, label: 'LABIOS' },
  { region: 2, label: 'MEJILLAS' },
  { region: 3, label: 'MAXILAR SUPERIOR' },
  { region: 4, label: 'MAXILAR INFERIOR' },
  { region: 5, label: 'LENGUA' },
  { region: 6, label: 'PALADAR' },
  { region: 7, label: 'PISO' },
  { region: 8, label: 'CARRILLOS' },
  { region: 9, label: 'GLÁNDULAS SALIVALES' },
  { region: 10, label: 'OROFARINGE' },
  { region: 11, label: 'A.T.M.' },
  { region: 12, label: 'GANGLIOS' }
] as const;

export const ANTECEDENTES_033 = [
  { key: 'alergiaAntibiotico', label: 'ALERGIA ANTIBIÓTICO' },
  { key: 'alergiaAnestesia', label: 'ALERGIA ANESTESIA' },
  { key: 'hemorragias', label: 'HEMORRAGIAS' },
  { key: 'vihSida', label: 'VIH/SIDA' },
  { key: 'tuberculosis', label: 'TUBERCULOSIS' },
  { key: 'asma', label: 'ASMA' },
  { key: 'diabetes', label: 'DIABETES' },
  { key: 'hipertension', label: 'HIPERTENSIÓN' },
  { key: 'enfCardiaca', label: 'ENF. CARDÍACA' },
  { key: 'otroAntecedente', label: 'OTRO' }
] as const;

export const DIENTES_IHOS = [16, 11, 26, 36, 31, 46] as const;

export const DIENTES_POR_SEXTANTE: ReadonlyArray<readonly [number, number, number]> = [
  [16, 17, 55],
  [11, 21, 51],
  [26, 27, 65],
  [36, 37, 75],
  [31, 41, 71],
  [46, 47, 85],
] as const;

export function crearHclVacia(pacienteId: string, hoja = 1): Hcl {
  return {
    pacienteId,
    hoja,
    establecimiento: null,
    parentesco: null,
    sexo: null,
    programado: true,
    motivoConsulta: null,
    problemaActual: null,
    alergiaAntibiotico: false,
    alergiaAnestesia: false,
    hemorragias: false,
    vihSida: false,
    tuberculosis: false,
    asma: false,
    diabetes: false,
    hipertension: false,
    enfCardiaca: false,
    otroAntecedente: false,
    otroAntecedenteTexto: null,
    presionArterial: null,
    frecuenciaCardiaca: null,
    temperatura: null,
    frecuenciaRespiratoria: null,
    examenRegiones: REGIONES_ESTOMATOGNATICAS.map(r => ({ region: r.region, descripcion: '', marcado: false })),
    higienePlaca: null,
    higieneCalculo: null,
    gingivitis: null,
    malOclusion: null,
    fluorosis: null,
    enfermedadPeriodontal: null,
    indicesCpo: {
      c_perma: null, p_perma: null, o_perma: null, total_perma: null,
      c_deci: null, e_deci: null, o_deci: null, total_deci: null
    },
    higieneSextantes: SEXTO_SECTANTES.map(s => ({ sextante: s, d1_evaluado: false, d2_evaluado: false, d3_evaluado: false, placa: null, calculo: null, gingivitis: null })),
    planBiometria: false,
    planRayosX: false,
    planQuimicaSanguinea: false,
    planOtros: false,
    planOtrosTexto: null,
    planTerapeutico: null,
    planEducacional: null,
    fechaApertura: null,
    fechaControl: null,
    numeroHoja: null,
    profesionalNombre: null,
    profesionalCodigo: null,
    profesionalFirma: null,
    diagnosticosCie: [1, 2, 3, 4].map(() => ({ codigo: '', presuntivo: '', definitivo: '' })),
    sesiones: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
      sesion: n,
      fecha: '',
      diagnosticos: '',
      procedimientos: '',
      prescripciones: '',
      proximaCita: '',
      codigo: ''
    })),
    actualizadaEn: null
  };
}

/** Completa los sub-documentos que el backend puede devolver vacíos. */
export function hclCompleta(pacienteId: string, hc: Partial<Hcl> | null): Hcl {
  const base = crearHclVacia(pacienteId);
  if (!hc) {
    return base;
  }
  return {
    ...base,
    ...hc,
    hoja: hc.hoja ?? 1,
    examenRegiones: (hc.examenRegiones && hc.examenRegiones.length
      ? hc.examenRegiones
      : base.examenRegiones
    ).map(r => ({ region: r.region, descripcion: r.descripcion ?? '', marcado: r.marcado ?? false })),
    indicesCpo: {
      c_perma: hc.indicesCpo?.c_perma ?? null,
      p_perma: hc.indicesCpo?.p_perma ?? null,
      o_perma: hc.indicesCpo?.o_perma ?? null,
      total_perma: hc.indicesCpo?.total_perma ?? null,
      c_deci: hc.indicesCpo?.c_deci ?? null,
      e_deci: hc.indicesCpo?.e_deci ?? null,
      o_deci: hc.indicesCpo?.o_deci ?? null,
      total_deci: hc.indicesCpo?.total_deci ?? null,
    },
    diagnosticosCie: (hc.diagnosticosCie && hc.diagnosticosCie.length
      ? hc.diagnosticosCie
      : base.diagnosticosCie
    ).map(d => ({ codigo: d.codigo ?? '', presuntivo: d.presuntivo ?? '', definitivo: d.definitivo ?? '' })),
    higieneSextantes: (hc.higieneSextantes && hc.higieneSextantes.length
      ? hc.higieneSextantes
      : base.higieneSextantes
    ).map(h => ({
      sextante: h.sextante,
      d1_evaluado: h.d1_evaluado ?? false,
      d2_evaluado: h.d2_evaluado ?? false,
      d3_evaluado: h.d3_evaluado ?? false,
      placa: h.placa ?? null,
      calculo: h.calculo ?? null,
      gingivitis: h.gingivitis ?? null
    })),
    sesiones: (hc.sesiones && hc.sesiones.length ? hc.sesiones : base.sesiones).map(s => ({
      sesion: s.sesion,
      fecha: s.fecha ?? '',
      diagnosticos: s.diagnosticos ?? '',
      procedimientos: s.procedimientos ?? '',
      prescripciones: s.prescripciones ?? '',
      proximaCita: s.proximaCita ?? '',
      codigo: s.codigo ?? ''
    }))
  };
}

export function grupoEtario(edad: number): string {
  if (edad < 1) {
    return 'MENOR DE 1 AÑO';
  }
  if (edad <= 4) {
    return '1 - 4 AÑOS';
  }
  if (edad <= 9) {
    return '5 - 9 AÑOS';
  }
  if (edad <= 14) {
    return '10 - 14 AÑOS';
  }
  if (edad <= 19) {
    return '15 - 19 AÑOS';
  }
  return 'MAYOR DE 20 AÑOS';
}