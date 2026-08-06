package api.repositories;

import api.entities.PatientToothCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PatientToothConditionRepository extends JpaRepository<PatientToothCondition, Long> {

    List<PatientToothCondition> findByPacienteId(String pacienteId);

    List<PatientToothCondition> findByPacienteIdAndDiente(String pacienteId, Integer diente);

    void deleteByPacienteIdAndDiente(String pacienteId, Integer diente);
}
