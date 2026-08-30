package api.repositories;

import api.entities.Procedimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ProcedimientoRepository extends JpaRepository<Procedimiento, String> {

    List<Procedimiento> findByCodigoIn(java.util.Collection<String> codigos);

    List<Procedimiento> findAllByOrderByCodigoAsc();
}
