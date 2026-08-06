package api.repositories;

import api.entities.Odontologo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface OdontologoRepository extends JpaRepository<Odontologo, String> {

    List<Odontologo> findByEspecialidad(String especialidad);

    List<Odontologo> findByEstado(Odontologo.Estado estado);

    List<Odontologo> findByTurno(Odontologo.Turno turno);

    List<Odontologo> findByConsultorioCodigo(String consultorioCodigo);

    Optional<Odontologo> findFirstByOrderByCodigoDesc();
}
