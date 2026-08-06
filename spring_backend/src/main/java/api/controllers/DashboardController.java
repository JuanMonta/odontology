package api.controllers;

import api.dto.AppointmentDto;
import api.dto.BoardTotalsDto;
import api.dto.WaitingPatientDto;
import api.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/appointments")
    public List<AppointmentDto> appointments(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return dashboardService.appointments(fecha == null ? LocalDate.now() : fecha);
    }

    @GetMapping("/waiting")
    public List<WaitingPatientDto> waiting() {
        return dashboardService.waiting();
    }

    @GetMapping("/totals")
    public BoardTotalsDto totals(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return dashboardService.totals(fecha == null ? LocalDate.now() : fecha);
    }

    @PostMapping("/call-waiting")
    public AppointmentDto callWaitingPatient(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return dashboardService.callWaitingPatient(fecha == null ? LocalDate.now() : fecha);
    }

    @PatchMapping("/appointments/{id}/done")
    public AppointmentDto markDone(@PathVariable String id) {
        return dashboardService.markDone(id);
    }
}
