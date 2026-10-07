package api.services;

import api.entities.RespaldoLease;
import api.repositories.RespaldoLeaseRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;

/**
 * Exclusión mutua entre instancias del backend para los jobs de larga duración.
 *
 * <p>Sustituye al antiguo {@code synchronized} de {@link RespaldoService}, que era
 * un lock de la JVM: con varios backends cada uno creía ser el único y generaba su
 * propio dump. Este servicio coordina a través de la base de datos, que es lo único
 * que todas las instancias comparten.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RespaldoLeaseService {

    /** Vencimiento inicial: cubre el arranque del dump sin latido todavía. */
    private static final int TTL_SEGUNDOS_INICIAL = 120;

    private final RespaldoLeaseRepository repo;

    @Value("${server.port:0}")
    private int puerto;

    private String instancia;

    /**
     * Identifica la instancia y comprueba la tabla en un solo PostConstruct: el orden
     * entre varios PostConstruct no está garantizado, y el chequeo necesita la
     * instancia ya asignada.
     */
    @PostConstruct
    void inicializar() {
        String host;
        try {
            host = InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            host = "host-desconocido";
        }
        String pid;
        try {
            pid = ManagementFactory.getRuntimeMXBean().getName();
        } catch (Exception e) {
            pid = "pid?";
        }
        this.instancia = host + ":" + puerto + "/" + pid;
        verificarTabla();
    }

    /** Identifica qué backend tomó el lease (solo diagnóstico). */
    public String getInstancia() {
        return instancia;
    }

    /**
     * Intenta tomar el lease del recurso de respaldo.
     *
     * @return {@code true} si este job lo obtuvo; {@code false} si otro job lo tiene
     *         vigente, y entonces hay que responder 409.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean reclamar(String jobId) {
        repo.reclamar(RespaldoLease.RECURSO_BD, jobId, instancia, TTL_SEGUNDOS_INICIAL);
        // Lectura bloqueante: devuelve la fila tal como quedó tras el reclamo, sin
        // depender del snapshot que la transacción haya fijado antes.
        RespaldoLease actual = repo.leerParaReclamar(RespaldoLease.RECURSO_BD).orElse(null);
        if (actual == null) {
            // El INSERT no dejó fila: es un fallo del reclamo, no un éxito.
            log.error("[lease] no se pudo leer el lease tras reclamarlo (job {})", jobId);
            return false;
        }
        boolean mio = jobId.equals(actual.getJobId());
        if (!mio) {
            log.info("[lease] recurso {} tomado por el job {} (instancia {}); el job {} espera",
                    actual.getRecurso(), actual.getJobId(), actual.getInstancia(), jobId);
        }
        return mio;
    }

    /**
     * Latido: renueva el vencimiento mientras el dump sigue corriendo. Si el lease ya
     * no es de este job, otro backend lo tomó (este quedó huérfano) y el valor falso
     * avisa de que su resultado ya no es confiable.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean renovar(String jobId) {
        return repo.renovar(RespaldoLease.RECURSO_BD, jobId, TTL_SEGUNDOS_INICIAL) > 0;
    }

    /** Libera el lease al terminar el job. Solo lo libera quien lo posee. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void liberar(String jobId) {
        repo.liberar(RespaldoLease.RECURSO_BD, jobId);
    }

    /** Lease vigente del recurso, solo para diagnóstico. {@code null} si no hay. */
    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public RespaldoLease leerVigente() {
        return repo.leerActual(RespaldoLease.RECURSO_BD).orElse(null);
    }

    /**
     * Comprueba al arrancar que la tabla existe. Si falta, el respaldo por tabla de
     * lease no puede funcionar y conviene decirlo con claridad en el log, en vez de
     * fallar con un error de SQL a mitad de una operación.
     */
    private void verificarTabla() {
        try {
            boolean hayLease = repo.leerActual(RespaldoLease.RECURSO_BD).isPresent();
            log.info("[lease] tabla respaldo_lease disponible (instancia {}, lease activo: {})",
                    instancia, hayLease);
        } catch (DataAccessException e) {
            log.error("[lease] NO se encuentra la tabla respaldo_lease. Aplica la migracion "
                    + "database/migrations/2026-10-05_lease_respaldo.sql. Mientras tanto, con varias "
                    + "instancias del backend el respaldo puede duplicarse. Causa: {}",
                    e.getMostSpecificCause().getMessage());
        }
    }
}