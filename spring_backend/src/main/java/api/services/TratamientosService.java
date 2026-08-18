package api.services;

import api.dto.ConsultorioSimpleDto;
import api.dto.TratamientoDto;
import api.dto.TratamientoDraftDto;
import api.entities.Consultorio;
import api.entities.ConsultorioTratamiento;
import api.entities.Tratamiento;
import api.repositories.ConsultorioRepository;
import api.repositories.ConsultorioTratamientoRepository;
import api.repositories.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Catálogo de tratamientos.
 */
@Service
@RequiredArgsConstructor
public class TratamientosService {

    private final TratamientoRepository tratamientoRepository;
    private final ConsultorioRepository consultorioRepository;
    private final ConsultorioTratamientoRepository ctRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<TratamientoDto> list() {
        return tratamientoRepository.findAll().stream()
                .sorted(Comparator.comparing(Tratamiento::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TratamientoDto add(TratamientoDraftDto draft) {
        Tratamiento tratamiento = Tratamiento.builder()
                .codigo(codigoService.nextCodigo("TRT", "TRT-%03d"))
                .nombre(draft.name())
                .categoria(draft.category())
                .duracionMin(draft.durationMin())
                .precio(draft.price())
                .activo(draft.active())
                .descripcion(draft.description() == null ? "" : draft.description())
                .uso(0)
                .build();
        tratamiento = tratamientoRepository.save(tratamiento);
        guardarConsultorios(tratamiento.getCodigo(), draft.consultorios());
        return toDto(tratamiento);
    }

    @Transactional
    public TratamientoDto update(TratamientoDto dto) {
        Tratamiento tratamiento = tratamientoRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + dto.code()));
        tratamiento.setNombre(dto.name());
        tratamiento.setCategoria(dto.category());
        tratamiento.setDuracionMin(dto.durationMin());
        tratamiento.setPrecio(dto.price());
        tratamiento.setActivo(dto.active());
        tratamiento.setDescripcion(dto.description());
        tratamiento.setUso(dto.usage());
        tratamiento = tratamientoRepository.save(tratamiento);
        guardarConsultorios(tratamiento.getCodigo(), dto.consultorios());
        return toDto(tratamiento);
    }

    @Transactional
    public TratamientoDto toggleActive(String code) {
        Tratamiento tratamiento = tratamientoRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + code));
        tratamiento.setActivo(!tratamiento.getActivo());
        return toDto(tratamientoRepository.save(tratamiento));
    }

    private void guardarConsultorios(String tratamientoCodigo, List<String> consultorios) {
        ctRepository.deleteByTratamientoCodigo(tratamientoCodigo);
        if (consultorios != null) {
            consultorios.forEach(consCode -> {
                String code = consCode.trim().toUpperCase();
                if (code.isEmpty()) {
                    return;
                }
                if (ctRepository.existsByConsultorioCodigoAndTratamientoCodigo(code, tratamientoCodigo)) {
                    return;
                }
                ctRepository.save(ConsultorioTratamiento.builder()
                        .consultorioCodigo(code)
                        .tratamientoCodigo(tratamientoCodigo)
                        .build());
            });
        }
    }

    private TratamientoDto toDto(Tratamiento t) {
        List<String> consultorios = ctRepository.findByTratamientoCodigo(t.getCodigo())
                .stream()
                .map(ConsultorioTratamiento::getConsultorioCodigo)
                .toList();
        return new TratamientoDto(
                t.getCodigo(),
                t.getCodigo(),
                t.getNombre(),
                t.getCategoria(),
                t.getDuracionMin(),
                t.getPrecio(),
                t.getActivo(),
                t.getDescripcion(),
                t.getUso(),
                consultorios);
    }
}
