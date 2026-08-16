package api.controllers;

import api.dto.AppointmentDraftDto;
import api.dto.AppointmentDto;
import api.dto.WaitingCheckInDto;
import api.dto.WaitingPatientDto;
import api.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/waiting")
    public WaitingPatientDto checkIn(@RequestBody WaitingCheckInDto body) {
        return dashboardService.checkIn(body);
    }

    @PostMapping("/call-waiting")
    public AppointmentDto callWaitingPatient(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return dashboardService.callWaitingPatient(fecha == null ? LocalDate.now() : fecha);
    }

    @PostMapping("/appointments")
    public AppointmentDto createAppointment(@RequestBody AppointmentDraftDto draft) {
        return dashboardService.createAppointment(draft);
    }

    @PatchMapping("/appointments/{id}/done")
    public AppointmentDto markDone(@PathVariable String id) {
        return dashboardService.markDone(id);
    }

    @PatchMapping("/appointments/{id}/cancel")
    public AppointmentDto markCancelled(@PathVariable String id) {
        return dashboardService.markCancelled(id);
    }

    @PatchMapping("/appointments/{id}/no-show")
    public AppointmentDto markNoShow(@PathVariable String id) {
        return dashboardService.markNoShow(id);
    }

    /** Cierre de día: auto-marca no-show todas las on-time restantes. */
    @PostMapping("/close-day")
    public int closeDay() {
        return dashboardService.closeDay(LocalDate.now());
    }
}
