/**
 * Historia clínica odontológica — Formulario 033 (HCU-form.033/2008 MSP).
 * Espejo del DTO del backend (HclDto). La sección 6 (odontograma) se gestiona
 * aparte vía patient_teeth; aquí viven las secciones 1-5 y 7-12.
 */

export interface HclRegionExamen {
  region: number;
  descripcion: string;
}

export interface HclCpoItem {
  sextante: string;
  c: number | null;
  p: number | null;
  o: number | null;
}

export interface HclCeoItem {
  sextante: string;
  c: number | null;
  e: number | null;
  o: number | null;
}

export interface HclIndicesCpo {
  permanente: HclCpoItem[];
  deciduo: HclCeoItem[];
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
  codigo: string;
}

export interface Hcl {
  pacienteId: string;
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
  indicesCpo: HclIndicesCpo;
  planBiometria: boolean;
  planRayosX: boolean;
  planQuimicaSanguinea: boolean;
  planOtros: boolean;
  fechaApertura: string | null;
  fechaControl: string | null;
  numeroHoja: string | null;
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

export function crearHclVacia(pacienteId: string): Hcl {
  return {
    pacienteId,
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
    presionArterial: null,
    frecuenciaCardiaca: null,
    temperatura: null,
    frecuenciaRespiratoria: null,
    examenRegiones: REGIONES_ESTOMATOGNATICAS.map(r => ({ region: r.region, descripcion: '' })),
    higienePlaca: null,
    higieneCalculo: null,
    gingivitis: null,
    malOclusion: null,
    fluorosis: null,
    indicesCpo: {
      permanente: SEXTO_SECTANTES.map(s => ({ sextante: s, c: null, p: null, o: null })),
      deciduo: SEXTO_SECTANTES.map(s => ({ sextante: s, c: null, e: null, o: null }))
    },
    planBiometria: false,
    planRayosX: false,
    planQuimicaSanguinea: false,
    planOtros: false,
    fechaApertura: null,
    fechaControl: null,
    numeroHoja: null,
    diagnosticosCie: [1, 2, 3, 4].map(() => ({ codigo: '', presuntivo: '', definitivo: '' })),
    sesiones: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
      sesion: n,
      fecha: '',
      diagnosticos: '',
      procedimientos: '',
      prescripciones: '',
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
    examenRegiones: (hc.examenRegiones && hc.examenRegiones.length
      ? hc.examenRegiones
      : base.examenRegiones
    ).map(r => ({ region: r.region, descripcion: r.descripcion ?? '' })),
    indicesCpo: {
      permanente: (hc.indicesCpo?.permanente?.length
        ? hc.indicesCpo.permanente
        : base.indicesCpo.permanente
      ).map(i => ({ sextante: i.sextante, c: i.c ?? null, p: i.p ?? null, o: i.o ?? null })),
      deciduo: (hc.indicesCpo?.deciduo?.length
        ? hc.indicesCpo.deciduo
        : base.indicesCpo.deciduo
      ).map(i => ({ sextante: i.sextante, c: i.c ?? null, e: i.e ?? null, o: i.o ?? null }))
    },
    diagnosticosCie: (hc.diagnosticosCie && hc.diagnosticosCie.length
      ? hc.diagnosticosCie
      : base.diagnosticosCie
    ).map(d => ({ codigo: d.codigo ?? '', presuntivo: d.presuntivo ?? '', definitivo: d.definitivo ?? '' })),
    sesiones: (hc.sesiones && hc.sesiones.length ? hc.sesiones : base.sesiones).map(s => ({
      sesion: s.sesion,
      fecha: s.fecha ?? '',
      diagnosticos: s.diagnosticos ?? '',
      procedimientos: s.procedimientos ?? '',
      prescripciones: s.prescripciones ?? '',
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