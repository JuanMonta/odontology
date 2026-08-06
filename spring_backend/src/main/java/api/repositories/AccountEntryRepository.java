package api.repositories;

import api.entities.AccountEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.math.BigDecimal;
import java.util.List;

@RepositoryRestResource(exported = false)
public interface AccountEntryRepository extends JpaRepository<AccountEntry, Long> {

    List<AccountEntry> findByPacienteIdOrderByFechaDesc(String pacienteId);

    @Query("select coalesce(sum(e.monto), 0) from AccountEntry e "
            + "where e.pacienteId = :pacienteId and e.tipo = :tipo")
    BigDecimal sumByPacienteIdAndTipo(@Param("pacienteId") String pacienteId,
                                      @Param("tipo") AccountEntry.Tipo tipo);

    void deleteByPacienteId(String pacienteId);
}
