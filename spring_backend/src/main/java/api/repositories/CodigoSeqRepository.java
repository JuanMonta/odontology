package api.repositories;

import api.entities.CodigoSeq;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface CodigoSeqRepository extends JpaRepository<CodigoSeq, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from CodigoSeq s where s.prefix = :prefix")
    Optional<CodigoSeq> findByPrefixForUpdate(@Param("prefix") String prefix);
}
