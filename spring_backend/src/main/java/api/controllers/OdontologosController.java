package api.controllers;

import api.dto.OdontologoConsultorioDto;
import api.dto.OdontologoDto;
import api.dto.OdontologoDraftDto;
import api.services.OdontologosService;
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
@RequestMapping("/api/v1/odontologos")
@RequiredArgsConstructor
public class OdontologosController {

    private final OdontologosService odontologosService;

    @GetMapping
    public List<OdontologoDto> list() {
        return odontologosService.list();
    }

    @PostMapping
    public OdontologoDto add(@RequestBody OdontologoDraftDto draft) {
        return odontologosService.add(draft);
    }

    @PutMapping("/{code}")
    public OdontologoDto update(@PathVariable String code, @RequestBody OdontologoDto dto) {
        return odontologosService.update(dto);
    }

    @PatchMapping("/{code}/toggle-status")
    public OdontologoDto toggleStatus(@PathVariable String code) {
        return odontologosService.toggleStatus(code);
    }

    @PatchMapping("/{code}/consultorio")
    public OdontologoDto assignConsultorio(
            @PathVariable String code,
            @RequestBody OdontologoConsultorioDto body) {
        return odontologosService.assignConsultorio(code, body.consultorio());
    }
}
