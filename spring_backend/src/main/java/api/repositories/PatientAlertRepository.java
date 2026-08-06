package api.repositories;

import api.entities.PatientAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PatientAlertRepository extends JpaRepository<PatientAlert, String> {

    List<PatientAlert> findByAtendidaFalse();

    List<PatientAlert> findByPacienteId(String pacienteId);
}
