package api.controllers;

import api.dto.AbonoDto;
import api.dto.AccountEntryDto;
import api.dto.EvolucionDto;
import api.dto.HclDto;
import api.dto.PacienteDetailDto;
import api.dto.PacienteDto;
import api.dto.PacienteDraftDto;
import api.dto.PatientAlertDto;
import api.dto.ToothDto;
import api.services.PacientesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacientesController {

    private final PacientesService pacientesService;

    @GetMapping
    public List<PacienteDto> list() {
        return pacientesService.list();
    }

    @GetMapping("/{id}")
    public PacienteDto find(@PathVariable String id) {
        return pacientesService.find(id);
    }

    @GetMapping("/{id}/detail")
    public PacienteDetailDto detail(@PathVariable String id) {
        return pacientesService.detail(id);
    }

    @PostMapping
    public PacienteDto add(@RequestBody PacienteDraftDto draft) {
        return pacientesService.add(draft);
    }

    @PutMapping("/{id}")
    public PacienteDto update(@PathVariable String id, @RequestBody PacienteDraftDto draft) {
        return pacientesService.update(id, draft);
    }

    @PostMapping("/{id}/abonos")
    public AccountEntryDto addAbono(@PathVariable String id, @RequestBody AbonoDto abono) {
        return pacientesService.addAbono(id, abono);
    }

    @GetMapping("/{id}/hclinica")
    public HclDto hclinica(@PathVariable String id) {
        return pacientesService.hclinica(id);
    }

    @GetMapping("/{id}/hclinica/hojas")
    public List<HclDto.HojaResumenDto> hojas(@PathVariable String id) {
        return pacientesService.listarHojas(id);
    }

    @GetMapping("/{id}/evolucion")
    public List<EvolucionDto> evolucion(@PathVariable String id) {
        return pacientesService.listarEvolucion(id);
    }

    @PostMapping("/{id}/evolucion")
    public EvolucionDto addEvolucion(@PathVariable String id,
                                     @RequestBody EvolucionDto.EvolucionDraftDto dto) {
        return pacientesService.guardarEvolucion(id, dto);
    }

    @GetMapping("/{id}/hclinica/{hoja}")
    public HclDto hclinicaHoja(@PathVariable String id, @PathVariable int hoja) {
        return pacientesService.hclinica(id, hoja);
    }

    @PutMapping("/{id}/hclinica")
    public HclDto saveHclinica(@PathVariable String id, @RequestBody HclDto dto) {
        return pacientesService.guardarHclinica(id, 1, dto);
    }

    @PutMapping("/{id}/hclinica/{hoja}")
    public HclDto saveHclinicaHoja(@PathVariable String id,
                                   @PathVariable int hoja,
                                   @RequestBody HclDto dto) {
        return pacientesService.guardarHclinica(id, hoja, dto);
    }

    @PutMapping("/{id}/teeth/{number}")
    public ToothDto updateTooth(@PathVariable String id,
                                @PathVariable int number,
                                @RequestBody ToothDto tooth) {
        return pacientesService.updateTooth(id, tooth);
    }

    @GetMapping("/alerts")
    public List<PatientAlertDto> alerts() {
        return pacientesService.alerts();
    }

    @PatchMapping("/alerts/{alertId}/handled")
    public PatientAlertDto markAlertHandled(@PathVariable String alertId) {
        return pacientesService.markAlertHandled(alertId);
    }
}
