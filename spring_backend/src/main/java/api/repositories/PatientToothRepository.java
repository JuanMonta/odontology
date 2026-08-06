package api.repositories;

import api.entities.PatientTooth;
import api.entities.PatientToothId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PatientToothRepository extends JpaRepository<PatientTooth, PatientToothId> {

    List<PatientTooth> findByPacienteId(String pacienteId);
}
