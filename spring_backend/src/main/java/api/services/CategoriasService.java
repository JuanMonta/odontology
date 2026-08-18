package api.services;

import api.dto.CategoriaDraftDto;
import api.dto.CategoriaDto;
import api.entities.Categoria;
import api.repositories.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Catálogo de categorías de tratamiento (tabla {@code categorias}).
 * El nombre se almacena en mayúsculas; los tratamientos referencian
 * este catálogo por nombre en la columna {@code categoria}.
 */
@Service
@RequiredArgsConstructor
public class CategoriasService {

    private final CategoriaRepository categoriaRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<CategoriaDto> list() {
        return categoriaRepository.findAll().stream()
                .sorted(Comparator.comparing(Categoria::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoriaDto> listActivas() {
        return categoriaRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CategoriaDto add(CategoriaDraftDto draft) {
        String nombre = normalizar(draft.nombre());
        if (categoriaRepository.findByNombre(nombre).isPresent()) {
            throw new IllegalArgumentException("LA CATEGORÍA YA EXISTE: " + nombre);
        }
        Categoria categoria = Categoria.builder()
                .codigo(codigoService.nextCodigo("CAT", "CAT-%03d"))
                .nombre(nombre)
                .activo(true)
                .build();
        return toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaDto update(CategoriaDto dto) {
        Categoria categoria = categoriaRepository.findById(dto.code())
                .orElseThrow(() -> new IllegalArgumentException("CATEGORÍA NO ENCONTRADA: " + dto.code()));
        categoria.setNombre(normalizar(dto.nombre()));
        categoria.setActivo(dto.activo());
        return toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaDto toggleStatus(String code) {
        Categoria categoria = categoriaRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("CATEGORÍA NO ENCONTRADA: " + code));
        categoria.setActivo(!categoria.getActivo());
        return toDto(categoriaRepository.save(categoria));
    }

    private String normalizar(String nombre) {
        return nombre.trim().toUpperCase();
    }

    private CategoriaDto toDto(Categoria c) {
        return new CategoriaDto(c.getCodigo(), c.getCodigo(), c.getNombre(), c.getActivo());
    }
}
