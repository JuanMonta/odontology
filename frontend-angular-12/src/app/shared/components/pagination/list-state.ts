/**
 * Persistencia ligera de estado de listas/directorios en sessionStorage.
 * Convención de clave: `saas.<feature>.listState`.
 * Sin DI para poder usarse desde el padre abstracto PaginatedListComponent
 * sin reescribir los constructores de cada subclase.
 */

export interface ListState {
  page: number;
  pageSize: number;
  scrollTop: number;
  query?: string;
  filter?: string;
}

export function readListState(key: string): ListState | null {
  try {
    const raw = sessionStorage.getItem('saas.' + key + '.listState');
    if (!raw) { return null; }
    const parsed = JSON.parse(raw);
    return {
      page: typeof parsed.page === 'number' ? parsed.page : 1,
      pageSize: typeof parsed.pageSize === 'number' ? parsed.pageSize : 10,
      scrollTop: typeof parsed.scrollTop === 'number' ? parsed.scrollTop : 0,
      query: typeof parsed.query === 'string' ? parsed.query : undefined,
      filter: typeof parsed.filter === 'string' ? parsed.filter : undefined
    };
  } catch {
    return null;
  }
}

export function saveListState(key: string, state: ListState): void {
  try {
    sessionStorage.setItem('saas.' + key + '.listState', JSON.stringify(state));
  } catch {}
}

export function clearListState(key: string): void {
  try {
    sessionStorage.removeItem('saas.' + key + '.listState');
  } catch {}
}