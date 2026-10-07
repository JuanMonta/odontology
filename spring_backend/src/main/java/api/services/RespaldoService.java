package api.services;

import api.dto.RespaldoJobDto;
import api.dto.RespaldoResponseDto;
import api.entities.RespaldoLease;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Respaldo asíncrono — no bloquea el hilo HTTP ni la BD.
 *
 * Patrón visto en el video que compartiste (Facebook): el front llama
 * POST /respaldos → el backend responde 202 con jobId y delega el trabajo
 * pesado a un worker en background (--single-transaction no bloquea escrituras,
 * pero el dump de miles de millones de filas sí tarda). El front muestra
 * "cargando" y hace polling GET /respaldos/{jobId} hasta COMPLETADO/FALLADO.
 * Así se evita: (1) saturar la BD con múltiples dumps, (2) timeout del endpoint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RespaldoService {

    private static final DateTimeFormatter STAMP_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Value("${app.backup.username:saas_backup}")
    private String backupUsernameDefault;

    @Value("${app.backup.password:}")
    private String backupPasswordDefault;

    @Value("${app.backup.mysqldump-path:F:\\MariaDB10.11\\bin\\mariadb-dump.exe}")
    private String mysqldumpPath;

    @Value("${app.backup.output-dir:./backups}")
    private String outputDir;

    @Value("${spring.datasource.url:jdbc:mariadb://localhost:3306/saas_clinica_odontologica}")
    private String datasourceUrl;

    @Value("${DB_HOST:localhost}")
    private String dbHostFallback;

    @Value("${DB_PORT:3306}")
    private String dbPortFallback;

    @Value("${DB_NAME:saas_clinica_odontologica}")
    private String dbNameFallback;

    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "respaldo-worker");
        t.setDaemon(true);
        return t;
    });

    private final Map<String, RespaldoJobDto> jobs = new ConcurrentHashMap<>();
    private volatile String currentJobId = null;

    /**
     * Exclusión mutua entre backends. Sustituye al antiguo {@code synchronized}, que
     * solo protegía dentro de una JVM: con dos instancias cada una generaba su dump.
     */
    private final RespaldoLeaseService lease;

    /** Renueva el vencimiento del lease mientras el dump corre. */
    private final ScheduledExecutorService latido = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "respaldo-lease-latido");
        t.setDaemon(true);
        return t;
    });

    /** Cada cuánto se renueva el lease (la mitad de su TTL). */
    private static final long INTERVALO_LATIDO_SEGUNDOS = 45;

    // Sincrónico (usado internamente por el worker)
    private RespaldoResponseDto ejecutarSync(String usernameOverride, String passwordOverride) throws IOException, InterruptedException {
        String username = (usernameOverride != null && !usernameOverride.isBlank()) ? usernameOverride.trim() : backupUsernameDefault;
        String password = (passwordOverride != null && !passwordOverride.isBlank()) ? passwordOverride : backupPasswordDefault;

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Usuario de respaldo requerido (saas_backup)");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Clave de respaldo requerida. Colócala en application-local.yaml (app.backup.password) o ingrésala en la UI");
        }

        DbTarget target = parseTarget(datasourceUrl);

        Path outDir = Path.of(outputDir);
        if (!Files.exists(outDir)) {
            Files.createDirectories(outDir);
        }

        String stamp = LocalDateTime.now().format(STAMP_FMT);
        String fileName = target.dbName + "_" + stamp + ".sql";
        Path outFile = outDir.resolve(fileName);

        Path dumpBin = resolveDumpBin();
        log.info("[respaldo] dump {} con usuario '{}' -> {}", target.dbName, username, outFile);

        ProcessBuilder pb = new ProcessBuilder(
                dumpBin.toString(),
                "--single-transaction",
                "--routines",
                "--triggers",
                "-h", target.host,
                "-P", target.port,
                "-u", username,
                "-p" + password,
                target.dbName
        );
        pb.redirectErrorStream(false);
        Process proc = pb.start();

        String stderr;
        try (InputStream err = proc.getErrorStream();
             InputStream out = proc.getInputStream();
             OutputStream fileOut = Files.newOutputStream(outFile)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = out.read(buf)) != -1) {
                fileOut.write(buf, 0, n);
            }
            stderr = new String(err.readAllBytes());
        }

        int exit = proc.waitFor();
        if (exit != 0) {
            try { Files.deleteIfExists(outFile); } catch (IOException ignored) {}
            log.error("[respaldo] mysqldump fallo exit={} stderr={}", exit, stderr);
            throw new IllegalStateException("mysqldump falló (exit " + exit + "): " + stderr);
        }

        long bytes = Files.size(outFile);
        if (bytes == 0) {
            Files.deleteIfExists(outFile);
            throw new IllegalStateException("Respaldo vacío — revisa credenciales de saas_backup");
        }

        String bind = leerBindAddress();
        String advertencia = null;
        if (bind == null) {
            advertencia = "my.ini sin bind-address → escucha en 0.0.0.0 (abierta a LAN). Corrige a bind-address=127.0.0.1 y reinicia.";
        } else if (!"127.0.0.1".equals(bind)) {
            advertencia = "bind-address=" + bind + " (no es 127.0.0.1) → BD expuesta a red local.";
        }

        log.info("[respaldo] OK {} ({} bytes) bind={} advertencia={}", fileName, bytes, bind, advertencia);

        return new RespaldoResponseDto(
                true,
                "Respaldo generado correctamente",
                fileName,
                bytes,
                LocalDateTime.now(),
                bind,
                advertencia
        );
    }

    // ── API asíncrona ──────────────────────────────────────────────

    public RespaldoJobDto iniciarAsync(String username, String password) {
        String jobId = UUID.randomUUID().toString().substring(0, 8);

        // Exclusion mutua entre instancias. Reclamar es atomico: si otra instancia
        // tiene el lease vigente, reclamar() devuelve false y respondemos 409.
        // Si el dueno anterior murio, su lease caduca y el relevo es automatico.
        if (!lease.reclamar(jobId)) {
            RespaldoLease vigente = lease.leerVigente();
            String dueno = vigente != null ? vigente.getJobId() : "?";
            String donde = vigente != null ? vigente.getInstancia() : "?";
            throw new IllegalStateException("Ya hay un respaldo en curso (job " + dueno
                    + " en " + donde + "). Espera a que termine.");
        }

        RespaldoJobDto job = new RespaldoJobDto(
                jobId, "EN_PROGRESO", "Respaldo iniciado — generando dump (no bloquea la BD)…",
                null, null, null, LocalDateTime.now(),
                null, null, null, 10);
        jobs.put(jobId, job);
        currentJobId = jobId;
        log.info("[respaldo] job {} iniciado por usuario {} (lease tomado por {})",
                jobId, username != null ? username : backupUsernameDefault, lease.getInstancia());

        // Latido: mantiene vivo el lease mientras dure el dump. Si otra instancia lo
        // robo (este quedo huerfano), el log lo avisa.
        ScheduledFuture<?> latidoJob = latido.scheduleAtFixedRate(() -> {
            try {
                if (!lease.renovar(jobId)) {
                    log.warn("[respaldo] job {} perdio el lease: otra instancia lo tomo. "
                            + "Su resultado podria no ser confiable.", jobId);
                }
            } catch (Exception e) {
                log.warn("[respaldo] job {} no pudo renovar el lease: {}", jobId, e.getMessage());
            }
        }, INTERVALO_LATIDO_SEGUNDOS, INTERVALO_LATIDO_SEGUNDOS, TimeUnit.SECONDS);

        executor.submit(() -> {
            try {
                // progreso intermedio
                jobs.put(jobId, new RespaldoJobDto(jobId, "EN_PROGRESO", "Escribiendo dump a disco…", null, null, null, job.iniciadoEn(), null, null, null, 50));
                RespaldoResponseDto res = ejecutarSync(username, password);
                RespaldoJobDto done = new RespaldoJobDto(
                        jobId, "COMPLETADO", res.mensaje(),
                        res.archivo(), res.bytes(), res.generadoEn(), job.iniciadoEn(),
                        res.bindAddress(), res.advertencia(), null, 100);
                jobs.put(jobId, done);
                log.info("[respaldo] job {} COMPLETADO {}", jobId, res.archivo());
            } catch (Exception e) {
                log.error("[respaldo] job {} FALLADO: {}", jobId, e.getMessage(), e);
                RespaldoJobDto failed = new RespaldoJobDto(
                        jobId, "FALLADO", "Fallo al generar respaldo",
                        null, null, null, job.iniciadoEn(),
                        null, null, e.getMessage(), 100);
                jobs.put(jobId, failed);
            } finally {
                // Liberar el lease solo si sigue siendo nuestro: si ya expiró y otra
                // instancia lo tomó, liberar() no lo toca (filtra por job_id).
                latidoJob.cancel(false);
                lease.liberar(jobId);
            }
        });

        return jobs.get(jobId);
    }

    public RespaldoJobDto obtenerJob(String jobId) {
        RespaldoJobDto j = jobs.get(jobId);
        if (j == null) throw new IllegalArgumentException("Job no encontrado: " + jobId);
        return j;
    }

    public RespaldoJobDto ultimoJob() {
        if (currentJobId == null) return null;
        return jobs.get(currentJobId);
    }

    private Path resolveDumpBin() {
        Path p = Path.of(mysqldumpPath);
        if (Files.exists(p)) return p;
        Path alt = p.getParent() != null ? p.getParent().resolve("mysqldump.exe") : Path.of("mysqldump.exe");
        if (Files.exists(alt)) return alt;
        throw new IllegalStateException("No se encontró mariadb-dump en: " + mysqldumpPath);
    }

    private String leerBindAddress() {
        String[] candidatos = {
                "F:\\MariaDB10.11\\data\\my.ini",
                "F:\\MariaDB10.11\\my.ini",
                "C:\\ProgramData\\MariaDB\\MariaDB Server 10.11\\data\\my.ini"
        };
        for (String ruta : candidatos) {
            Path ini = Path.of(ruta);
            if (!Files.exists(ini)) continue;
            try {
                for (String line : Files.readAllLines(ini)) {
                    String t = line.trim();
                    if (t.toLowerCase().startsWith("bind-address")) {
                        String[] parts = t.split("=", 2);
                        if (parts.length == 2) return parts[1].trim();
                    }
                }
            } catch (IOException ignored) {}
        }
        return null;
    }

    public File resolveFile(String archivo) {
        return Path.of(outputDir).resolve(archivo).toFile();
    }

    private DbTarget parseTarget(String url) {
        String host = dbHostFallback;
        String port = dbPortFallback;
        String db = dbNameFallback;
        try {
            String noPrefix = url.replaceFirst("^jdbc:mariadb://", "");
            String hostPortDb = noPrefix.split("\\?")[0];
            String hostPort = hostPortDb.split("/")[0];
            db = hostPortDb.contains("/") ? hostPortDb.split("/", 2)[1] : db;
            if (hostPort.contains(":")) {
                String[] hp = hostPort.split(":", 2);
                host = hp[0];
                port = hp[1];
            } else if (!hostPort.isBlank()) {
                host = hostPort;
            }
        } catch (Exception e) {
            log.warn("[respaldo] no se pudo parsear datasourceUrl '{}', usando fallback {}:{}/{}", url, host, port, db);
        }
        return new DbTarget(host, port, db);
    }

    private record DbTarget(String host, String port, String dbName) {}
}
