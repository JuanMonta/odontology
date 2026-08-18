package api.services;

import api.dto.ConsultorioSimpleDto;
import api.dto.TratamientoDto;
import api.dto.TratamientoDraftDto;
import api.entities.Categoria;
import api.entities.Consultorio;
import api.entities.ConsultorioTratamiento;
import api.entities.Tratamiento;
import api.repositories.CategoriaRepository;
import api.repositories.ConsultorioRepository;
import api.repositories.ConsultorioTratamientoRepository;
import api.repositories.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Catálogo de tratamientos.
 */
@Service
@RequiredArgsConstructor
public class TratamientosService {

    private final TratamientoRepository tratamientoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ConsultorioRepository consultorioRepository;
    private final ConsultorioTratamientoRepository ctRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<TratamientoDto> list() {
        Map<String, String> categoriaNombres = categoriaNombres();
        return tratamientoRepository.findAll().stream()
                .sorted(Comparator.comparing(Tratamiento::getCodigo))
                .map(t -> toDto(t, categoriaNombres))
                .toList();
    }

    @Transactional
    public TratamientoDto add(TratamientoDraftDto draft) {
        validarCategoria(draft.categoryCode());
        Tratamiento tratamiento = Tratamiento.builder()
                .codigo(codigoService.nextCodigo("TRT", "TRT-%03d"))
                .nombre(draft.name())
                .categoriaCodigo(draft.categoryCode())
                .duracionMin(draft.durationMin())
                .precio(draft.price())
                .activo(draft.active())
                .descripcion(draft.description() == null ? "" : draft.description())
                .uso(0)
                .build();
        tratamiento = tratamientoRepository.save(tratamiento);
        guardarConsultorios(tratamiento.getCodigo(), draft.consultorios());
        return toDto(tratamiento, categoriaNombres());
    }

    @Transactional
    public TratamientoDto update(TratamientoDto dto) {
        validarCategoria(dto.categoryCode());
        Tratamiento tratamiento = tratamientoRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + dto.code()));
        tratamiento.setNombre(dto.name());
        tratamiento.setCategoriaCodigo(dto.categoryCode());
        tratamiento.setDuracionMin(dto.durationMin());
        tratamiento.setPrecio(dto.price());
        tratamiento.setActivo(dto.active());
        tratamiento.setDescripcion(dto.description());
        tratamiento.setUso(dto.usage());
        tratamiento = tratamientoRepository.save(tratamiento);
        guardarConsultorios(tratamiento.getCodigo(), dto.consultorios());
        return toDto(tratamiento, categoriaNombres());
    }

    @Transactional
    public TratamientoDto toggleActive(String code) {
        Tratamiento tratamiento = tratamientoRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Tratamiento no encontrado: " + code));
        tratamiento.setActivo(!tratamiento.getActivo());
        return toDto(tratamientoRepository.save(tratamiento), categoriaNombres());
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

    private void validarCategoria(String categoriaCodigo) {
        if (categoriaCodigo == null || categoriaCodigo.isBlank()) {
            throw new IllegalArgumentException("Debe indicar la categoría del tratamiento");
        }
        categoriaRepository.findById(categoriaCodigo.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada: " + categoriaCodigo));
    }

    private Map<String, String> categoriaNombres() {
        return categoriaRepository.findAll().stream()
                .collect(Collectors.toMap(Categoria::getCodigo, Categoria::getNombre));
    }

    private TratamientoDto toDto(Tratamiento t, Map<String, String> categoriaNombres) {
        List<String> consultorios = ctRepository.findByTratamientoCodigo(t.getCodigo())
                .stream()
                .map(ConsultorioTratamiento::getConsultorioCodigo)
                .toList();
        return new TratamientoDto(
                t.getCodigo(),
                t.getCodigo(),
                t.getNombre(),
                t.getCategoriaCodigo(),
                categoriaNombres.getOrDefault(t.getCategoriaCodigo(), t.getCategoriaCodigo()),
                t.getDuracionMin(),
                t.getPrecio(),
                t.getActivo(),
                t.getDescripcion(),
                t.getUso(),
                consultorios);
    }
}
