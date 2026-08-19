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
    private final CatalogSnapshotService snapshots;

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
        CategoriaDto creada = toDto(categoriaRepository.save(categoria));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_CATEGORIA, creada.code(),
                CatalogSnapshotService.ACCION_CREAR, null, nombre, null);
        return creada;
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
        String anterior = categoria.getNombre();
        categoria.setNombre(nombre);
        categoria.setActivo(dto.activo());
        CategoriaDto actualizada = toDto(categoriaRepository.save(categoria));
        if (!anterior.equals(nombre)) {
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_CATEGORIA, categoria.getCodigo(),
                    CatalogSnapshotService.ACCION_RENOMBRAR, anterior, nombre, null);
        }
        if (!Boolean.TRUE.equals(categoria.getActivo())) {
            snapshots.registrar(CatalogSnapshotService.ENTIDAD_CATEGORIA, categoria.getCodigo(),
                    CatalogSnapshotService.ACCION_DESACTIVAR, anterior, nombre, null);
        }
        return actualizada;
    }

    @Transactional
    public CategoriaDto toggleStatus(String code) {
        Categoria categoria = find(code);
        if (Boolean.TRUE.equals(categoria.getActivo())) {
            validarVacia(categoria);
        }
        boolean ibaActiva = Boolean.TRUE.equals(categoria.getActivo());
        categoria.setActivo(!categoria.getActivo());
        CategoriaDto actualizada = toDto(categoriaRepository.save(categoria));
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_CATEGORIA, categoria.getCodigo(),
                ibaActiva ? CatalogSnapshotService.ACCION_DESACTIVAR
                        : CatalogSnapshotService.ACCION_ACTIVAR,
                categoria.getNombre(), categoria.getNombre(), null);
        return actualizada;
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
        String nombreOrigen = origen.getNombre();
        origen.setActivo(false);
        categoriaRepository.save(origen);
        snapshots.registrar(CatalogSnapshotService.ENTIDAD_CATEGORIA, origen.getCodigo(),
                CatalogSnapshotService.ACCION_FUSIONAR, nombreOrigen, destino.getNombre(),
                "TRATAMIENTOS MOVIDOS: " + tratamientos.size() + " → " + to);
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
