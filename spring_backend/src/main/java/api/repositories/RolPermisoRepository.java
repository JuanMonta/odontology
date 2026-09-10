package api.repositories;

import api.entities.RolPermiso;
import api.entities.RolPermisoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface RolPermisoRepository extends JpaRepository<RolPermiso, RolPermisoId> {

    List<RolPermiso> findByIdRolCodigo(String rolCodigo);

    void deleteByIdRolCodigo(String rolCodigo);

    @Query("select rp.id.permisoCodigo from RolPermiso rp where rp.id.rolCodigo = :rolCodigo")
    List<String> findPermisosByRol(String rolCodigo);

    @Query("select distinct r.nombre from UsuarioRol r join RolPermiso rp on rp.id.rolCodigo = r.codigo "
            + "where rp.id.permisoCodigo = 'SUPER_ADMIN'")
    List<String> findNombresRolesSuperAdmin();
}
