package api.repositories;

import api.entities.RespaldoLease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

/**
 * Lease de exclusión mutua entre backends (tabla {@code respaldo_lease}).
 *
 * <p>{@link #reclamar} es la pieza clave: un solo {@code INSERT ... ON DUPLICATE
 * KEY UPDATE} condicional, de modo que el reclamo es atómico sin necesidad de
 * {@code SELECT ... FOR UPDATE} ni de mantener una transacción abierta durante el
 * job. Si N backends piden el respaldo a la vez, la fila se resuelve en una única
 * sentencia y solo uno ve su {@code job_id} como ganador.
 */
@RepositoryRestResource(exported = false)
public interface RespaldoLeaseRepository extends JpaRepository<RespaldoLease, String> {

    /**
     * Reclama el recurso para {@code jobId}, robando el lease solo si el del
     * dueño anterior ya venció. Es idempotente y atómico: si el recurso está
     * libre lo toma; si hay un lease vigente lo deja intacto.
     *
     * <p>El orden de las asignaciones es intencional: en {@code ON DUPLICATE KEY
     * UPDATE} se evalúan de izquierda a derecha, así que {@code caduca_en} debe
     * reescribirse {@code ÚLTIMO} para que todas las condiciones comparen contra
     * el valor original y no contra el ya sobrescrito.
     *
     * @return filas afectadas (1 = insert, 2 = takeover de lease vencido, 0 = ya había lease vigente)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO respaldo_lease (recurso, job_id, instancia, tomado_en, caduca_en)
            VALUES (:recurso, :jobId, :instancia, NOW(), TIMESTAMPADD(SECOND, :segundos, NOW()))
            ON DUPLICATE KEY UPDATE
              job_id    = IF(caduca_en <= NOW(), :jobId,    job_id),
              instancia = IF(caduca_en <= NOW(), :instancia, instancia),
              tomado_en = IF(caduca_en <= NOW(), NOW(),      tomado_en),
              caduca_en = IF(caduca_en <= NOW(), TIMESTAMPADD(SECOND, :segundos, NOW()), caduca_en)
            """, nativeQuery = true)
    int reclamar(@Param("recurso") String recurso,
                 @Param("jobId") String jobId,
                 @Param("instancia") String instancia,
                 @Param("segundos") int segundos);

    /**
     * Lee el lease del recurso para decidir si el reclamo fue propio.
     *
     * <p>Usa {@code FOR UPDATE} a propósito: es una lectura bloqueante, y a
     * diferencia de una lectura consistente siempre ve la última fila confirmada,
     * sin importar el snapshot que la transacción haya fijado antes. Así el
     * perdedor del reclamo observa con certeza la fila que acaba de escribir el
     * ganador. Debe invocarse dentro de la misma transacción del reclamo.
     */
    @Query(value = """
            SELECT * FROM respaldo_lease WHERE recurso = :recurso FOR UPDATE
            """, nativeQuery = true)
    Optional<RespaldoLease> leerParaReclamar(@Param("recurso") String recurso);

    /**
     * Lectura sin bloqueo del lease actual, solo para diagnóstico (mensajes de
     * error). No usar para decidir un reclamo: ahí hace falta {@link #leerParaReclamar}.
     */
    @Query("SELECT l FROM RespaldoLease l WHERE l.recurso = :recurso")
    Optional<RespaldoLease> leerActual(@Param("recurso") String recurso);

    /** Renueva el vencimiento mientras el job sigue corriendo (latido). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE respaldo_lease
               SET caduca_en = TIMESTAMPADD(SECOND, :segundos, NOW())
             WHERE recurso = :recurso AND job_id = :jobId
            """, nativeQuery = true)
    int renovar(@Param("recurso") String recurso,
                @Param("jobId") String jobId,
                @Param("segundos") int segundos);

    /** Libera el lease. Solo lo libera quien lo posee, nunca un tercero. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RespaldoLease l WHERE l.recurso = :recurso AND l.jobId = :jobId")
    int liberar(@Param("recurso") String recurso, @Param("jobId") String jobId);
}