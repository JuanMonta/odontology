package api.repositories;

import api.entities.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /** Último código aún vigente (no usado) del usuario; solo el más reciente aplica. */
    Optional<PasswordResetToken> findFirstByUsuarioCodigoAndUsadoFalseOrderByCreadoEnDesc(String usuarioCodigo);

    /** Inutiliza todos los códigos pendientes del usuario (nuevo pedido o reset). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update PasswordResetToken t set t.usado = true where t.usuarioCodigo = :codigo and t.usado = false")
    int marcarUsados(@Param("codigo") String codigo);
}