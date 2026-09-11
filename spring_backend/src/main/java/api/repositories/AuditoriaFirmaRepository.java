package api.repositories;

import api.entities.AuditoriaFirma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface AuditoriaFirmaRepository extends JpaRepository<AuditoriaFirma, Long> {

    List<AuditoriaFirma> findByPacienteIdOrderByCreatedAtDesc(String pacienteId);
}
