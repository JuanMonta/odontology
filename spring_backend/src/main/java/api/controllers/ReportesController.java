package api.controllers;

import api.dto.ReporteCarteraDto;
import api.dto.ReporteCitasPerdidasDto;
import api.dto.ReporteFlujoDto;
import api.dto.ReporteOperacionDto;
import api.dto.ReportePacientesAtendidosDto;
import api.dto.ReporteProduccionDto;
import api.services.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Reportes financieros (Fase 1) y de operación clínica (Fase 2). Endpoints
 * read-only; sin {@code desde}/{@code hasta} el rango es el mes en curso.
 */
@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
public class ReportesController {

    private final ReporteService reporteService;

    @GetMapping("/produccion-tratamiento")
    public ReporteProduccionDto produccionTratamiento(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.produccionPorTratamiento(desde(desde), hasta(hasta));
    }

    @GetMapping("/produccion-odontologo")
    public ReporteProduccionDto produccionOdontologo(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.produccionPorOdontologo(desde(desde), hasta(hasta));
    }

    @GetMapping("/produccion-consultorio")
    public ReporteProduccionDto produccionConsultorio(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.produccionPorConsultorio(desde(desde), hasta(hasta));
    }

    @GetMapping("/flujo-caja")
    public ReporteFlujoDto flujoCaja(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.flujoCaja(desde(desde), hasta(hasta));
    }

    @GetMapping("/cartera")
    public ReporteCarteraDto cartera() {
        return reporteService.cartera();
    }

    @GetMapping("/citas-consultorio")
    public ReporteOperacionDto citasConsultorio(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.citasPorConsultorio(desde(desde), hasta(hasta));
    }

    @GetMapping("/citas-odontologo")
    public ReporteOperacionDto citasOdontologo(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.citasPorOdontologo(desde(desde), hasta(hasta));
    }

    @GetMapping("/citas-perdidas")
    public ReporteCitasPerdidasDto citasPerdidas(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.citasPerdidas(desde(desde), hasta(hasta));
    }

    @GetMapping("/pacientes-atendidos")
    public ReportePacientesAtendidosDto pacientesAtendidos(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.pacientesAtendidos(desde(desde), hasta(hasta));
    }

    private LocalDate desde(LocalDate d) {
        return d == null ? LocalDate.now().withDayOfMonth(1) : d;
    }

    private LocalDate hasta(LocalDate d) {
        return d == null ? LocalDate.now() : d;
    }
}