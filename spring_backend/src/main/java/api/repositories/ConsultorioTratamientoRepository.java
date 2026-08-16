package api.repositories;

import api.entities.ConsultorioTratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ConsultorioTratamientoRepository extends JpaRepository<ConsultorioTratamiento, Long> {
    List<ConsultorioTratamiento> findByConsultorioCodigo(String consultorioCodigo);

    List<ConsultorioTratamiento> findByTratamientoCodigo(String tratamientoCodigo);

    boolean existsByConsultorioCodigoAndTratamientoCodigo(String consultorioCodigo, String tratamientoCodigo);

    @Modifying
    @Transactional
    @Query("DELETE FROM ConsultorioTratamiento ct WHERE ct.consultorioCodigo = ?1")
    void deleteByConsultorioCodigo(String consultorioCodigo);

    @Modifying
    @Transactional
    @Query("DELETE FROM ConsultorioTratamiento ct WHERE ct.tratamientoCodigo = ?1")
    void deleteByTratamientoCodigo(String tratamientoCodigo);
}