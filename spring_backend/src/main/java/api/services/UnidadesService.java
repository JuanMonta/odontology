package api.services;

import api.dto.UnidadDraftDto;
import api.dto.UnidadDto;
import api.entities.Consultorio;
import api.entities.Unidad;
import api.repositories.ConsultorioRepository;
import api.repositories.UnidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Catálogo de unidades/sillones (tabla {@code unidades}) usado por el
 * formulario de consultorios. El consultorio guarda la unidad como texto
 * ({@code nombre · tipo}), por lo que al renombrar se propaga el cambio a
 * las salas que la usan. La baja respeta la regla "vacía primero": una
 * unidad en uso por salas activas no se puede desactivar.
 */
@Service
@RequiredArgsConstructor
public class UnidadesService {

    public static final Set<String> TIPOS_VALIDOS = Set.of("SILLÓN", "MÓDULO");
    public static final Set<String> TIPOS_SIN_ACENTO = Set.of("SILLON", "MODULO");

    private final UnidadRepository unidadRepository;
    private final ConsultorioRepository consultorioRepository;
    private final CodigoService codigoService;

    @Transactional(readOnly = true)
    public List<UnidadDto> list() {
        return unidadRepository.findAll().stream()
                .sorted(Comparator.comparing(Unidad::getCodigo))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UnidadDto> listActivas() {
        return unidadRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UnidadDto add(UnidadDraftDto draft) {
        String nombre = normalizarNombre(draft.nombre());
        String tipo = normalizarTipo(draft.tipo());
        if (unidadRepository.findByNombre(nombre).isPresent()) {
            throw conflicto("LA UNIDAD YA EXISTE: " + nombre);
        }
        Unidad unidad = Unidad.builder()
                .codigo(codigoService.nextCodigo("UNI", "UNI-%03d"))
                .nombre(nombre)
                .tipo(tipo)
                .activo(true)
                .build();
        return toDto(unidadRepository.save(unidad));
    }

    /**
     * Renombra una unidad y (opcionalmente) la desactiva. Al cambiar el
     * nombre o el tipo se propaga el nuevo texto ({@code nombre · tipo}) a
     * las salas que guardaban el valor anterior. La baja respeta la regla
     * "vacía primero": una unidad en uso por salas no inactivas no se
     * puede desactivar.
     */
    @Transactional
    public UnidadDto update(UnidadDto dto) {
        Unidad unidad = find(dto.code());
        String nombre = normalizarNombre(dto.nombre());
        String tipo = normalizarTipo(dto.tipo());
        unidadRepository.findByNombre(nombre)
                .filter(existente -> !existente.getCodigo().equals(unidad.getCodigo()))
                .ifPresent(existente -> {
                    throw conflicto("LA UNIDAD YA EXISTE: " + nombre);
                });
        if (Boolean.FALSE.equals(dto.activo()) && Boolean.TRUE.equals(unidad.getActivo())) {
            validarVacia(unidad);
        }
        String textoAnterior = texto(unidad);
        unidad.setNombre(nombre);
        unidad.setTipo(tipo);
        unidad.setActivo(dto.activo());
        unidadRepository.save(unidad);
        String textoNuevo = texto(unidad);
        if (!textoAnterior.equals(textoNuevo)) {
            List<Consultorio> afectados = consultorioRepository.findByUnidadIn(List.of(
                    unidad.getNombre(), textoAnterior));
            afectados.forEach(c -> c.setUnidad(textoNuevo));
            consultorioRepository.saveAll(afectados);
        }
        return toDto(unidad);
    }

    @Transactional
    public UnidadDto toggleStatus(String code) {
        Unidad unidad = find(code);
        if (Boolean.TRUE.equals(unidad.getActivo())) {
            validarVacia(unidad);
        }
        unidad.setActivo(!unidad.getActivo());
        return toDto(unidadRepository.save(unidad));
    }

    private Unidad find(String code) {
        return unidadRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "UNIDAD NO ENCONTRADA: " + code));
    }

    private void validarVacia(Unidad unidad) {
        long activas = consultorioRepository.countByUnidadInAndEstadoNot(
                List.of(unidad.getNombre(), texto(unidad)),
                Consultorio.Estado.inactivo);
        if (activas > 0) {
            throw conflicto(
                    "NO SE PUEDE DESACTIVAR: LA UNIDAD ESTÁ ASIGNADA A " + activas
                            + " SALA(S) ACTIVA(S). REASIGNA PRIMERO LOS CONSULTORIOS");
        }
    }

    private static String normalizarNombre(String valor) {
        String limpio = valor == null ? "" : valor.trim().toUpperCase();
        if (limpio.isEmpty()) {
            throw new IllegalArgumentException("EL NOMBRE DE LA UNIDAD ES OBLIGATORIO");
        }
        return limpio;
    }

    private static String normalizarTipo(String valor) {
        String limpio = valor == null ? "" : valor.trim().toUpperCase();
        String sinAcento = limpio.replace('Ó', 'O');
        if (TIPOS_SIN_ACENTO.contains(sinAcento)) {
            return sinAcento.equals("MODULO") ? "MÓDULO" : "SILLÓN";
        }
        if (!TIPOS_VALIDOS.contains(limpio)) {
            throw new IllegalArgumentException("EL TIPO DE UNIDAD DEBE SER SILLÓN O MÓDULO");
        }
        return limpio;
    }

    private static String texto(Unidad unidad) {
        return unidad.getNombre() + " · " + unidad.getTipo();
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private UnidadDto toDto(Unidad u) {
        return new UnidadDto(
                u.getCodigo(),
                u.getCodigo(),
                u.getNombre(),
                u.getTipo(),
                Boolean.TRUE.equals(u.getActivo()));
    }
}