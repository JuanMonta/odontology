package api.repositories;

import api.entities.PatientToothFace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PatientToothFaceRepository extends JpaRepository<PatientToothFace, Long> {

    List<PatientToothFace> findByPacienteId(String pacienteId);

    List<PatientToothFace> findByPacienteIdAndDiente(String pacienteId, Integer diente);

    void deleteByPacienteIdAndDiente(String pacienteId, Integer diente);
}
