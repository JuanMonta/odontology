package api.repositories;

import api.entities.PatientAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface PatientAppointmentRepository extends JpaRepository<PatientAppointment, Long> {

    List<PatientAppointment> findByPacienteIdOrderByFechaDescHoraDesc(String pacienteId);

    boolean existsByAppointmentId(String appointmentId);
}
