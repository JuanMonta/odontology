package api.repositories;

import api.entities.ConsultorioEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ConsultorioEquipoRepository extends JpaRepository<ConsultorioEquipo, Long> {

    List<ConsultorioEquipo> findByConsultorioCodigoOrderByItemAsc(String consultorioCodigo);

    void deleteByConsultorioCodigo(String consultorioCodigo);
}
