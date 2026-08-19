package api.repositories;

import api.entities.EvolucionClinica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Hoja de evolución clínica: lectura cronológica (más reciente primero). */
public interface EvolucionClinicaRepository extends JpaRepository<EvolucionClinica, Long> {

    List<EvolucionClinica> findByPacienteIdOrderByFechaDescIdDesc(String pacienteId);
}
