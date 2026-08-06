package api.services;

import api.dto.TratamientoDto;
import api.dto.TratamientoDraftDto;
import api.entities.Tratamiento;
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
                .categoria(Tratamiento.Categoria.valueOf(draft.category()))
                .duracionMin(draft.durationMin())
                .precio(draft.price())
                .activo(draft.active())
                .descripcion(draft.description() == null ? "" : draft.description())
                .uso(0)
                .build();
        return toDto(tratamientoRepository.save(tratamiento));
    }

    @Transactional
    public TratamientoDto update(TratamientoDto dto) {
        Tratamiento tratamiento = tratamientoRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + dto.code()));
        tratamiento.setNombre(dto.name());
        tratamiento.setCategoria(Tratamiento.Categoria.valueOf(dto.category()));
        tratamiento.setDuracionMin(dto.durationMin());
        tratamiento.setPrecio(dto.price());
        tratamiento.setActivo(dto.active());
        tratamiento.setDescripcion(dto.description());
        tratamiento.setUso(dto.usage());
        return toDto(tratamientoRepository.save(tratamiento));
    }

    @Transactional
    public TratamientoDto toggleActive(String code) {
        Tratamiento tratamiento = tratamientoRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + code));
        tratamiento.setActivo(!tratamiento.getActivo());
        return toDto(tratamientoRepository.save(tratamiento));
    }

    private TratamientoDto toDto(Tratamiento t) {
        return new TratamientoDto(
                t.getCodigo(),
                t.getCodigo(),
                t.getNombre(),
                t.getCategoria().name(),
                t.getDuracionMin(),
                t.getPrecio(),
                t.getActivo(),
                t.getDescripcion(),
                t.getUso());
    }
}
