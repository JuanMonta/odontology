package api.services;

import api.dto.ReporteCarteraDto;
import api.dto.ReporteCarteraItemDto;
import api.dto.ReporteFlujoDto;
import api.dto.ReporteFlujoItemDto;
import api.dto.ReporteProduccionDto;
import api.dto.ReporteProduccionItemDto;
import api.entities.AccountEntry;
import api.entities.Categoria;
import api.entities.Consultorio;
import api.entities.Odontologo;
import api.entities.Tratamiento;
import api.entities.VistaPaciente;
import api.repositories.AccountEntryRepository;
import api.repositories.CategoriaRepository;
import api.repositories.ConsultorioRepository;
import api.repositories.OdontologoRepository;
import api.repositories.PacienteRepository;
import api.repositories.TratamientoRepository;
import api.repositories.VistaPacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reportes financieros (Fase 1). Todos read-only: el backend agrega
 * {@code account_entries} y devuelve filas + totales ya calculados. El rango
 * por defecto es el mes en curso (lo aplica el controller cuando no se envía).
 */
@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final BigDecimal CIEN = new BigDecimal("100");

    private final AccountEntryRepository accountRepository;
    private final TratamientoRepository tratamientoRepository;
    private final CategoriaRepository categoriaRepository;
    private final OdontologoRepository odontologoRepository;
    private final ConsultorioRepository consultorioRepository;
    private final VistaPacienteRepository vistaPacienteRepository;

    // ------------------------------------------------------------------
    //  PRODUCCIÓN POR TRATAMIENTO
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteProduccionDto produccionPorTratamiento(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, Tratamiento> tratamientos = indexar(tratamientoRepository.findAll(), Tratamiento::getCodigo);
        Map<String, Categoria> categorias = indexar(categoriaRepository.findAll(), Categoria::getCodigo);

        Map<String, List<AccountEntry>> grupos = agruparCargos(desde, hasta, AccountEntry::getTratamientoCodigo);

        List<ReporteProduccionItemDto> items = new ArrayList<>();
        for (Map.Entry<String, List<AccountEntry>> g : grupos.entrySet()) {
            String codigo = g.getKey().isBlank() ? null : g.getKey();
            Tratamiento t = codigo == null ? null : tratamientos.get(codigo);
            String nombre = t != null ? t.getNombre() : "SIN TRATAMIENTO";
            String categoria = t != null && categorias.get(t.getCategoriaCodigo()) != null
                    ? categorias.get(t.getCategoriaCodigo()).getNombre()
                    : "—";
            items.add(fila(codigo, nombre, categoria, g.getValue()));
        }
        return armarProduccion(items, desde, hasta);
    }

    // ------------------------------------------------------------------
    //  PRODUCCIÓN POR ODONTÓLOGO
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteProduccionDto produccionPorOdontologo(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, Odontologo> odontologos = indexar(odontologoRepository.findAll(), Odontologo::getCodigo);

        Map<String, List<AccountEntry>> grupos = agruparCargos(desde, hasta, AccountEntry::getOdontologoCodigo);

        List<ReporteProduccionItemDto> items = new ArrayList<>();
        for (Map.Entry<String, List<AccountEntry>> g : grupos.entrySet()) {
            String codigo = g.getKey().isBlank() ? null : g.getKey();
            Odontologo o = codigo == null ? null : odontologos.get(codigo);
            String nombre = o != null ? o.getNombre() : "SIN ODONTÓLOGO";
            String especialidad = o != null && o.getEspecialidad() != null ? o.getEspecialidad() : "—";
            items.add(fila(codigo, nombre, especialidad, g.getValue()));
        }
        return armarProduccion(items, desde, hasta);
    }

    // ------------------------------------------------------------------
    //  PRODUCCIÓN POR CONSULTORIO
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteProduccionDto produccionPorConsultorio(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, Consultorio> consultorios = indexar(consultorioRepository.findAll(), Consultorio::getCodigo);

        Map<String, List<AccountEntry>> grupos = agruparCargos(desde, hasta, AccountEntry::getConsultorioCodigo);

        List<ReporteProduccionItemDto> items = new ArrayList<>();
        for (Map.Entry<String, List<AccountEntry>> g : grupos.entrySet()) {
            String codigo = g.getKey().isBlank() ? null : g.getKey();
            Consultorio c = codigo == null ? null : consultorios.get(codigo);
            String nombre = c != null ? c.getNombre() : "SIN CONSULTORIO";
            items.add(fila(codigo, nombre, "—", g.getValue()));
        }
        return armarProduccion(items, desde, hasta);
    }

    // ------------------------------------------------------------------
    //  FLUJO DE CAJA
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteFlujoDto flujoCaja(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        List<AccountEntry> movimientos = accountRepository.findByFechaBetweenOrderByFechaAsc(desde, hasta);

        Map<LocalDate, List<AccountEntry>> porDia = movimientos.stream()
                .collect(Collectors.groupingBy(AccountEntry::getFecha, TreeMap::new, Collectors.toList()));

        List<ReporteFlujoItemDto> filas = new ArrayList<>();
        BigDecimal totalCargos = BigDecimal.ZERO;
        BigDecimal totalPagos = BigDecimal.ZERO;
        BigDecimal pagosEfectivo = BigDecimal.ZERO;
        BigDecimal pagosTarjeta = BigDecimal.ZERO;

        for (Map.Entry<LocalDate, List<AccountEntry>> e : porDia.entrySet()) {
            BigDecimal cargos = sumarPorTipo(e.getValue(), AccountEntry.Tipo.charge);
            BigDecimal pagos = sumarPorTipo(e.getValue(), AccountEntry.Tipo.payment);
            totalCargos = totalCargos.add(cargos);
            totalPagos = totalPagos.add(pagos);
            pagosEfectivo = pagosEfectivo.add(sumarPorMetodo(e.getValue(), AccountEntry.Metodo.EFECTIVO));
            pagosTarjeta = pagosTarjeta.add(sumarPorMetodo(e.getValue(), AccountEntry.Metodo.TARJETA));
            filas.add(new ReporteFlujoItemDto(e.getKey(), cargos, pagos, cargos.subtract(pagos)));
        }

        return new ReporteFlujoDto(
                filas, totalCargos, totalPagos, totalCargos.subtract(totalPagos),
                pagosEfectivo, pagosTarjeta, desde, hasta);
    }

    // ------------------------------------------------------------------
    //  CARTERA (deudores y saldos vigentes)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteCarteraDto cartera() {
        List<VistaPaciente> pacientes = vistaPacienteRepository.findAll();
        Map<String, LocalDate> ultimoMovimiento = accountRepository.findAllByOrderByFechaAsc().stream()
                .collect(Collectors.toMap(
                        AccountEntry::getPacienteId,
                        AccountEntry::getFecha,
                        (a, b) -> b.isAfter(a) ? b : a,
                        LinkedHashMap::new));

        List<ReporteCarteraItemDto> deudores = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (VistaPaciente v : pacientes) {
            BigDecimal saldo = v.getSaldo() == null ? BigDecimal.ZERO : v.getSaldo();
            if (saldo.compareTo(BigDecimal.ZERO) > 0) {
                total = total.add(saldo);
                deudores.add(new ReporteCarteraItemDto(v.getId(), v.getNombre(), saldo, ultimoMovimiento.get(v.getId())));
            }
        }
        deudores.sort(Comparator.comparing(ReporteCarteraItemDto::saldo).reversed());
        return new ReporteCarteraDto(deudores, deudores.size(), total);
    }

    // ------------------------------------------------------------------
    //  HELPERS
    // ------------------------------------------------------------------

    private void validarRango(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new IllegalArgumentException("RANGO INVÁLIDO: DESDE NO PUEDE SER POSTERIOR A HASTA");
        }
    }

    private Map<String, List<AccountEntry>> agruparCargos(LocalDate desde, LocalDate hasta,
                                                          Function<AccountEntry, String> clave) {
        return accountRepository.findByFechaBetweenOrderByFechaAsc(desde, hasta).stream()
                .filter(e -> e.getTipo() == AccountEntry.Tipo.charge)
                .collect(Collectors.groupingBy(
                        e -> clave.apply(e) == null ? "" : clave.apply(e),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private ReporteProduccionItemDto fila(String codigo, String nombre, String grupo, List<AccountEntry> movs) {
        return new ReporteProduccionItemDto(codigo, nombre, grupo, movs.size(), sumar(movs), BigDecimal.ZERO);
    }

    private ReporteProduccionDto armarProduccion(List<ReporteProduccionItemDto> items, LocalDate desde, LocalDate hasta) {
        items.sort(Comparator.comparing(ReporteProduccionItemDto::total).reversed());
        BigDecimal global = items.stream()
                .map(ReporteProduccionItemDto::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long cantidad = items.stream().mapToLong(ReporteProduccionItemDto::cantidad).sum();
        List<ReporteProduccionItemDto> conPorcentaje = items.stream()
                .map(i -> new ReporteProduccionItemDto(
                        i.codigo(), i.nombre(), i.grupo(), i.cantidad(), i.total(),
                        global.signum() == 0 ? BigDecimal.ZERO
                                : i.total().multiply(CIEN).divide(global, 1, RoundingMode.HALF_UP)))
                .toList();
        return new ReporteProduccionDto(conPorcentaje, cantidad, global, desde, hasta);
    }

    private static BigDecimal sumar(List<AccountEntry> movs) {
        return movs.stream()
                .map(AccountEntry::getMonto)
                .filter(m -> m != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal sumarPorTipo(List<AccountEntry> movs, AccountEntry.Tipo tipo) {
        return movs.stream()
                .filter(e -> e.getTipo() == tipo)
                .map(AccountEntry::getMonto)
                .filter(m -> m != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal sumarPorMetodo(List<AccountEntry> movs, AccountEntry.Metodo metodo) {
        return movs.stream()
                .filter(e -> e.getMetodo() == metodo)
                .map(AccountEntry::getMonto)
                .filter(m -> m != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static <T, K> Map<K, T> indexar(List<T> lista, Function<T, K> clave) {
        return lista.stream().collect(Collectors.toMap(clave, Function.identity()));
    }
}