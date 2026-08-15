package api.repositories;

import api.entities.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, HistoriaClinica.HojaId> {

    /** Todas las hojas del Formulario 033 de un paciente, en orden de numeración. */
    List<HistoriaClinica> findAllByPacienteIdOrderByHojaAsc(String pacienteId);
}
