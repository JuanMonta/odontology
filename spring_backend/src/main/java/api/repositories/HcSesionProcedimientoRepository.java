package api.repositories;

import api.entities.HcSesionProcedimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface HcSesionProcedimientoRepository
        extends JpaRepository<HcSesionProcedimiento, HcSesionProcedimiento.SesionProcId> {

    List<HcSesionProcedimiento> findByPacienteIdAndHojaOrderBySesion(String pacienteId, Integer hoja);

    void deleteByPacienteIdAndHoja(String pacienteId, Integer hoja);
}
