package api.services;

import api.dto.ReporteCarteraDto;
import api.dto.ReporteCarteraItemDto;
import api.dto.ReporteCitaPerdidaDto;
import api.dto.ReporteCitasPerdidasDto;
import api.dto.ReporteFlujoDto;
import api.dto.ReporteFlujoItemDto;
import api.dto.ReporteOperacionDto;
import api.dto.ReporteOperacionItemDto;
import api.dto.ReportePacienteAtendidoDto;
import api.dto.ReportePacientesAtendidosDto;
import api.dto.ReporteProduccionDto;
import api.dto.ReporteProduccionItemDto;
import api.entities.AccountEntry;
import api.entities.Appointment;
import api.entities.Categoria;
import api.entities.Consultorio;
import api.entities.Odontologo;
import api.entities.Tratamiento;
import api.entities.VistaPaciente;
import api.repositories.AccountEntryRepository;
import api.repositories.AppointmentRepository;
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
 * Reportes financieros (Fase 1) y de operación clínica (Fase 2). Todos read-only:
 * el backend agrega y devuelve filas + totales ya calculados. El rango por defecto
 * es el mes en curso (lo aplica el controller cuando no se envía).
 */
@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final BigDecimal CIEN = new BigDecimal("100");

    private final AccountEntryRepository accountRepository;
    private final AppointmentRepository appointmentRepository;
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
    //  OPERACIÓN CLÍNICA (Fase 2) · citas por consultorio / odontólogo
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteOperacionDto citasPorConsultorio(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, Consultorio> consultorios = indexar(consultorioRepository.findAll(), Consultorio::getCodigo);

        List<Appointment> citas = appointmentRepository.findByFechaBetweenOrderByFechaAscHoraAsc(desde, hasta);
        Map<String, List<Appointment>> grupos = citas.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getConsultorioCodigo() == null ? "" : a.getConsultorioCodigo(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<ReporteOperacionItemDto> items = new ArrayList<>();
        for (Map.Entry<String, List<Appointment>> g : grupos.entrySet()) {
            String codigo = g.getKey().isBlank() ? null : g.getKey();
            Consultorio c = codigo == null ? null : consultorios.get(codigo);
            items.add(filaOperacion(codigo,
                    c != null ? c.getNombre() : "SIN CONSULTORIO",
                    "—",
                    g.getValue()));
        }
        return armarOperacion(items, desde, hasta);
    }

    @Transactional(readOnly = true)
    public ReporteOperacionDto citasPorOdontologo(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, Odontologo> odontologos = indexar(odontologoRepository.findAll(), Odontologo::getCodigo);

        List<Appointment> citas = appointmentRepository.findByFechaBetweenOrderByFechaAscHoraAsc(desde, hasta);
        Map<String, List<Appointment>> grupos = citas.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getOdontologoCodigo() == null ? "" : a.getOdontologoCodigo(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<ReporteOperacionItemDto> items = new ArrayList<>();
        for (Map.Entry<String, List<Appointment>> g : grupos.entrySet()) {
            String codigo = g.getKey().isBlank() ? null : g.getKey();
            Odontologo o = codigo == null ? null : odontologos.get(codigo);
            items.add(filaOperacion(codigo,
                    o != null ? o.getNombre() : "SIN ODONTÓLOGO",
                    o != null && o.getEspecialidad() != null ? o.getEspecialidad() : "—",
                    g.getValue()));
        }
        return armarOperacion(items, desde, hasta);
    }

    // ------------------------------------------------------------------
    //  OPERACIÓN CLÍNICA (Fase 2) · citas perdidas y pacientes atendidos
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ReporteCitasPerdidasDto citasPerdidas(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        List<Appointment> perdidas = appointmentRepository.findByFechaBetweenOrderByFechaAscHoraAsc(desde, hasta)
                .stream()
                .filter(a -> a.getEstado() == Appointment.Estado.NO_SHOW
                        || a.getEstado() == Appointment.Estado.CANCELLED)
                .toList();

        List<ReporteCitaPerdidaDto> items = perdidas.stream()
                .map(a -> new ReporteCitaPerdidaDto(
                        a.getId(),
                        a.getPacienteId(),
                        a.getPacienteNombre(),
                        a.getFecha(),
                        a.getHora(),
                        a.getTratamiento(),
                        a.getConsultorio(),
                        a.getOdontologo(),
                        a.getEstado() == Appointment.Estado.NO_SHOW ? "NO-SHOW" : "CANCELADA"))
                .toList();

        long noShow = items.stream().filter(i -> i.estado().equals("NO-SHOW")).count();
        long canceladas = items.size() - noShow;
        return new ReporteCitasPerdidasDto(items, noShow, canceladas, items.size(), desde, hasta);
    }

    @Transactional(readOnly = true)
    public ReportePacientesAtendidosDto pacientesAtendidos(LocalDate desde, LocalDate hasta) {
        validarRango(desde, hasta);
        Map<String, List<Appointment>> porPaciente = appointmentRepository
                .findByFechaBetweenOrderByFechaAscHoraAsc(desde, hasta)
                .stream()
                .filter(a -> a.getEstado() == Appointment.Estado.DONE)
                .collect(Collectors.groupingBy(
                        a -> a.getPacienteId() == null ? "__SN_" + a.getPacienteNombre() : a.getPacienteId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<ReportePacienteAtendidoDto> items = new ArrayList<>();
        for (Map.Entry<String, List<Appointment>> e : porPaciente.entrySet()) {
            List<Appointment> atenciones = e.getValue();
            Appointment ultima = atenciones.get(atenciones.size() - 1);
            items.add(new ReportePacienteAtendidoDto(
                    e.getKey().startsWith("__SN_") ? null : e.getKey(),
                    ultima.getPacienteNombre(),
                    atenciones.size(),
                    ultima.getFecha()));
        }
        items.sort(Comparator.comparing(ReportePacienteAtendidoDto::atenciones).reversed());
        long total = items.stream().mapToLong(ReportePacienteAtendidoDto::atenciones).sum();
        return new ReportePacientesAtendidosDto(items, items.size(), total, desde, hasta);
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

    private ReporteOperacionItemDto filaOperacion(String codigo, String nombre, String grupo, List<Appointment> citas) {
        long programadas = citas.size();
        long atendidas = citas.stream().filter(a -> a.getEstado() == Appointment.Estado.DONE).count();
        long noShow = citas.stream().filter(a -> a.getEstado() == Appointment.Estado.NO_SHOW).count();
        long canceladas = citas.stream().filter(a -> a.getEstado() == Appointment.Estado.CANCELLED).count();
        long enProceso = programadas - atendidas - noShow - canceladas;
        BigDecimal ocupacion = programadas == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(atendidas)
                        .multiply(CIEN)
                        .divide(BigDecimal.valueOf(programadas), 1, RoundingMode.HALF_UP);
        return new ReporteOperacionItemDto(codigo, nombre, grupo, programadas, atendidas,
                noShow, canceladas, enProceso, ocupacion);
    }

    private ReporteOperacionDto armarOperacion(List<ReporteOperacionItemDto> items, LocalDate desde, LocalDate hasta) {
        items.sort(Comparator.comparing(ReporteOperacionItemDto::programadas).reversed());
        long programadas = items.stream().mapToLong(ReporteOperacionItemDto::programadas).sum();
        long atendidas = items.stream().mapToLong(ReporteOperacionItemDto::atendidas).sum();
        long noShow = items.stream().mapToLong(ReporteOperacionItemDto::noShow).sum();
        long canceladas = items.stream().mapToLong(ReporteOperacionItemDto::canceladas).sum();
        long enProceso = items.stream().mapToLong(ReporteOperacionItemDto::enProceso).sum();
        BigDecimal ocupacion = programadas == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(atendidas)
                        .multiply(CIEN)
                        .divide(BigDecimal.valueOf(programadas), 1, RoundingMode.HALF_UP);
        return new ReporteOperacionDto(items, programadas, atendidas, noShow, canceladas,
                enProceso, ocupacion, desde, hasta);
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