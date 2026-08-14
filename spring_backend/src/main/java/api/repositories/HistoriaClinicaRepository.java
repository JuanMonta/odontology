package api.repositories;

import api.entities.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, String> {
}