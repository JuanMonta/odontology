package api.services;

import api.dto.ConsultorioCatalogosDto;
import api.dto.ConsultorioDto;
import api.dto.ConsultorioDraftDto;
import api.dto.EquipoCatalogoDto;
import api.entities.Consultorio;
import api.entities.ConsultorioEquipo;
import api.entities.Equipo;
import api.repositories.ConsultorioEquipoRepository;
import api.repositories.ConsultorioRepository;
import api.repositories.EquipoRepository;
import api.repositories.UbicacionRepository;
import api.repositories.UnidadRepository;
import api.util.FormatoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Consultorios y su equipamiento.
 */
@Service
@RequiredArgsConstructor
public class ConsultoriosService {

    private final ConsultorioRepository consultorioRepository;
    private final ConsultorioEquipoRepository equipoRepository;
    private final CodigoService codigoService;
    private final UnidadRepository unidadRepository;
    private final UbicacionRepository ubicacionRepository;
    private final EquipoRepository equipoCatalogoRepository;

    @Transactional(readOnly = true)
    public List<ConsultorioDto> list() {
        return consultorioRepository.findAll().stream()
                .sorted(Comparator.comparing(Consultorio::getCodigo))
                .map(this::toDto)
                .toList();
    }

    /** Catálogos (unidades, ubicaciones, equipos) → selects del formulario. */
    @Transactional(readOnly = true)
    public ConsultorioCatalogosDto catalogos() {
        return new ConsultorioCatalogosDto(
                unidadRepository.findByActivoTrueOrderByNombreAsc().stream()
                        .map(unidad -> unidad.getNombre() + " · " + unidad.getTipo())
                        .toList(),
                ubicacionRepository.findByActivoTrueOrderByNombreAsc().stream()
                        .map(ubicacion -> ubicacion.getNombre())
                        .toList(),
                equipoCatalogoRepository.findByActivoTrueOrderByNombreAsc().stream()
                        .map(equipo -> new EquipoCatalogoDto(
                                equipo.getCodigo(),
                                equipo.getNombre(),
                                equipo.getCategoria()))
                        .toList());
    }

    @Transactional
    public ConsultorioDto add(ConsultorioDraftDto draft) {
        Consultorio consultorio = Consultorio.builder()
                .codigo(codigoService.nextCodigo("CON", "CON-%03d"))
                .nombre(draft.name())
                .unidad(draft.unit())
                .ubicacion(draft.location())
                .estado(Consultorio.Estado.valueOf(draft.status()))
                .procedimientos(0)
                .build();
        consultorio = consultorioRepository.save(consultorio);
        guardarEquipos(consultorio.getCodigo(), draft.equipment());
        return toDto(consultorio);
    }

    @Transactional
    public ConsultorioDto update(ConsultorioDto dto) {
        Consultorio consultorio = consultorioRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Consultorio no encontrado: " + dto.code()));
        consultorio.setNombre(dto.name());
        consultorio.setUnidad(dto.unit());
        consultorio.setUbicacion(dto.location());
        consultorio.setEstado(Consultorio.Estado.valueOf(dto.status()));
        consultorio.setProcedimientos(dto.procedures());
        consultorio = consultorioRepository.save(consultorio);
        guardarEquipos(consultorio.getCodigo(), dto.equipment());
        return toDto(consultorio);
    }

    @Transactional
    public ConsultorioDto toggleStatus(String code) {
        Consultorio consultorio = consultorioRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Consultorio no encontrado: " + code));
        Consultorio.Estado siguiente = switch (consultorio.getEstado()) {
            case operativo -> Consultorio.Estado.mantenimiento;
            case mantenimiento, inactivo -> Consultorio.Estado.operativo;
        };
        consultorio.setEstado(siguiente);
        return toDto(consultorioRepository.save(consultorio));
    }

    private void guardarEquipos(String codigo, List<String> equipment) {
        equipoRepository.deleteByConsultorioCodigo(codigo);
        if (equipment != null) {
            equipment.forEach(item -> {
                String nombre = item.trim().toUpperCase();
                if (nombre.isEmpty()) {
                    return;
                }
                String equipoCodigo = equipoCatalogoRepository.findByNombre(nombre)
                        .map(Equipo::getCodigo)
                        .orElse(null);
                equipoRepository.save(ConsultorioEquipo.builder()
                        .consultorioCodigo(codigo)
                        .equipoCodigo(equipoCodigo)
                        .item(nombre)
                        .build());
            });
        }
    }

    private ConsultorioDto toDto(Consultorio c) {
        List<String> equipment = equipoRepository.findByConsultorioCodigoOrderByItemAsc(c.getCodigo())
                .stream()
                .map(ConsultorioEquipo::getItem)
                .toList();
        return new ConsultorioDto(
                c.getCodigo(),
                c.getCodigo(),
                c.getNombre(),
                c.getUnidad(),
                c.getUbicacion(),
                equipment,
                c.getEstado().name(),
                c.getUltimoUso() == null ? "—" : FormatoUtil.fecha(c.getUltimoUso()),
                c.getProcedimientos());
    }
}
