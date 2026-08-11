package api.repositories;

import api.entities.ConsultorioEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ConsultorioEquipoRepository extends JpaRepository<ConsultorioEquipo, Long> {

    List<ConsultorioEquipo> findByConsultorioCodigoOrderByItemAsc(String consultorioCodigo);

    @Modifying
    @Query("delete from ConsultorioEquipo e where e.consultorioCodigo = :codigo")
    void deleteByConsultorioCodigo(@Param("codigo") String consultorioCodigo);
}
