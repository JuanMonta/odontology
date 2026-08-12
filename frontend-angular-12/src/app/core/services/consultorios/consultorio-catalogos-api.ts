import { Observable } from 'rxjs';
import { ConsultorioCatalogos } from '../../models/consultorio-catalogos.model';

/** Fuente de catálogos (unidades, ubicaciones, equipos) para los formularios. */
export abstract class ConsultorioCatalogosApi {
  abstract catalogos$: Observable<ConsultorioCatalogos>;
  abstract refresh(): void;
}