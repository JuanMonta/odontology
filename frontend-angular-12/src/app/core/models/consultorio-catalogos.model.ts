export interface ConsultorioEquipoCatalogo {
  codigo: string;
  nombre: string;
  categoria: string;
}

export interface ConsultorioCatalogos {
  unidades: string[];
  ubicaciones: string[];
  equipos: ConsultorioEquipoCatalogo[];
}

export const EQUIPO_CATEGORIAS = ['MOBILIARIO', 'DIAGNÓSTICO', 'INSTRUMENTAL', 'CONSUMIBLES'] as const;

export interface ConsultorioCategoriaConteo {
  nombre: string;
  count: number;
}

export function categorias(equipos: ConsultorioEquipoCatalogo[]): ConsultorioCategoriaConteo[] {
  const presentes = new Map<string, number>();
  for (const e of equipos) {
    presentes.set(e.categoria, (presentes.get(e.categoria) ?? 0) + 1);
  }
  return EQUIPO_CATEGORIAS
    .filter(c => presentes.has(c))
    .map(c => ({ nombre: c, count: presentes.get(c) ?? 0 }));
}

export function filtrarEquipos(
  equipos: ConsultorioEquipoCatalogo[],
  query: string,
  categoria: string | null
): ConsultorioEquipoCatalogo[] {
  const q = query.trim().toUpperCase();
  return equipos.filter(e => {
    const matchesCategoria = !categoria || e.categoria === categoria;
    const matchesBusqueda = !q || e.nombre.toUpperCase().includes(q);
    return matchesCategoria && matchesBusqueda;
  });
}