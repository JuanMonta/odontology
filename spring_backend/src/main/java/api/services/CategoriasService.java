package api.services;

import api.dto.CategoriaDraftDto;
import api.dto.CategoriaDto;
import api.dto.CategoriaFusionResultDto;
import api.entities.Categoria;
import api.entities.Tratamiento;
import api.repositories.CategoriaRepository;
import api.repositories.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Catálogo de categorías de tratamiento (tabla {@code categorias_tratamientos}).
 * Los tratamientos referencian este catálogo por FK en la columna
 * {@code categoria_codigo}. Una categoría no se borra físicamente: se
 * desactiva solo cuando no tiene tratamientos activos (regla "vacía
 * primero") o se fusiona moviendo sus tratamientos a otra categoría.
 */
@Service
@RequiredArgsConstructor
public class CategoriasService {

    private final CategoriaRepository categoriaRepository;
    private final TratamientoRepository tratamientoRepository;
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
            throw conflicto("LA CATEGORÍA YA EXISTE: " + nombre);
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
        Categoria categoria = find(dto.code());
        String nombre = normalizar(dto.nombre());
        categoriaRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(categoria.getCodigo()))
                .ifPresent(existente -> {
                    throw conflicto("LA CATEGORÍA YA EXISTE: " + nombre);
                });
        if (Boolean.FALSE.equals(dto.activo()) && Boolean.TRUE.equals(categoria.getActivo())) {
            validarVacia(categoria);
        }
        categoria.setNombre(nombre);
        categoria.setActivo(dto.activo());
        return toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaDto toggleStatus(String code) {
        Categoria categoria = find(code);
        if (Boolean.TRUE.equals(categoria.getActivo())) {
            validarVacia(categoria);
        }
        categoria.setActivo(!categoria.getActivo());
        return toDto(categoriaRepository.save(categoria));
    }

    /**
     * Mueve todos los tratamientos de {@code from} a {@code to} y
     * desactiva la categoría origen. Operación de mantenimiento para
     * consolidar el catálogo sin perder tratamientos.
     */
    @Transactional
    public CategoriaFusionResultDto fusion(String from, String to) {
        if (from.equalsIgnoreCase(to)) {
            throw conflicto("NO SE PUEDE FUSIONAR UNA CATEGORÍA CONSIGO MISMA");
        }
        Categoria origen = find(from);
        Categoria destino = find(to);
        if (Boolean.FALSE.equals(destino.getActivo())) {
            throw conflicto("LA CATEGORÍA DESTINO ESTÁ INACTIVA: " + to);
        }
        List<Tratamiento> tratamientos = tratamientoRepository.findByCategoriaCodigo(from);
        tratamientos.forEach(t -> t.setCategoriaCodigo(to));
        tratamientoRepository.saveAll(tratamientos);
        origen.setActivo(false);
        categoriaRepository.save(origen);
        return new CategoriaFusionResultDto(origen.getCodigo(), origen.getNombre(), false, tratamientos.size());
    }

    private Categoria find(String code) {
        return categoriaRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "CATEGORÍA NO ENCONTRADA: " + code));
    }

    private void validarVacia(Categoria categoria) {
        long activos = tratamientoRepository.countByCategoriaCodigoAndActivoTrue(categoria.getCodigo());
        if (activos > 0) {
            throw conflicto(
                    "NO SE PUEDE DESACTIVAR: LA CATEGORÍA TIENE " + activos + " TRATAMIENTO(S) ACTIVO(S). "
                            + "INACTIVA PRIMERO LOS TRATAMIENTOS O FUSIONA LA CATEGORÍA");
        }
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private String normalizar(String nombre) {
        return nombre.trim().toUpperCase();
    }

    private CategoriaDto toDto(Categoria c) {
        return new CategoriaDto(c.getCodigo(), c.getCodigo(), c.getNombre(), c.getActivo());
    }
}
