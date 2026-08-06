package api.services;

import api.dto.OdontologoDto;
import api.dto.OdontologoDraftDto;
import api.entities.Odontologo;
import api.repositories.OdontologoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Odontólogos del staff.
 */
@Service
@RequiredArgsConstructor
public class OdontologosService {

    private final OdontologoRepository odontologoRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<OdontologoDto> list() {
        return odontologoRepository.findAll().stream()
                .sorted(Comparator.comparing(Odontologo::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OdontologoDto add(OdontologoDraftDto draft) {
        Odontologo odontologo = Odontologo.builder()
                .codigo(codigoService.nextCodigo("ODO", "ODO-%03d"))
                .nombre(draft.name())
                .especialidad(draft.specialty())
                .licencia(draft.license())
                .consultorioCodigo(draft.consultorio())
                .turno(Odontologo.Turno.valueOf(draft.turno()))
                .estado(Odontologo.Estado.valueOf(draft.status()))
                .experiencia(draft.experience() == null ? 0 : draft.experience())
                .procedimientos(0)
                .build();
        return toDto(odontologoRepository.save(odontologo));
    }

    @Transactional
    public OdontologoDto update(OdontologoDto dto) {
        Odontologo odontologo = odontologoRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Odontólogo no encontrado: " + dto.code()));
        odontologo.setNombre(dto.name());
        odontologo.setEspecialidad(dto.specialty());
        odontologo.setLicencia(dto.license());
        odontologo.setConsultorioCodigo(dto.consultorio());
        odontologo.setTurno(Odontologo.Turno.valueOf(dto.turno()));
        odontologo.setEstado(Odontologo.Estado.valueOf(dto.status()));
        odontologo.setExperiencia(dto.experience());
        odontologo.setProcedimientos(dto.procedures());
        return toDto(odontologoRepository.save(odontologo));
    }

    @Transactional
    public OdontologoDto toggleStatus(String code) {
        Odontologo odontologo = odontologoRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Odontólogo no encontrado: " + code));
        Odontologo.Estado siguiente = switch (odontologo.getEstado()) {
            case activo -> Odontologo.Estado.ausente;
            case ausente, inactivo -> Odontologo.Estado.activo;
        };
        odontologo.setEstado(siguiente);
        return toDto(odontologoRepository.save(odontologo));
    }

    private OdontologoDto toDto(Odontologo o) {
        return new OdontologoDto(
                o.getCodigo(),
                o.getCodigo(),
                o.getNombre(),
                o.getEspecialidad(),
                o.getLicencia(),
                o.getConsultorioCodigo() == null ? "—" : o.getConsultorioCodigo(),
                o.getTurno().name(),
                o.getEstado().name(),
                o.getExperiencia(),
                o.getProcedimientos());
    }
}
