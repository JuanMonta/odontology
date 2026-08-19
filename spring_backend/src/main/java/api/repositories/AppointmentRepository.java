package api.repositories;

import api.entities.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.time.LocalDate;
import java.util.List;

@RepositoryRestResource(exported = false)
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    List<Appointment> findByFechaOrderByHoraAsc(LocalDate fecha);

    List<Appointment> findByFechaBetweenOrderByFechaAscHoraAsc(LocalDate desde, LocalDate hasta);

    List<Appointment> findByEstado(Appointment.Estado estado);

    List<Appointment> findByFechaAndEstado(LocalDate fecha, Appointment.Estado estado);

    long countByEstado(Appointment.Estado estado);
}
