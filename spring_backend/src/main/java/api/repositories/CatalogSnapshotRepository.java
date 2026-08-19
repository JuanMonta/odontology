package api.repositories;

import api.entities.CatalogSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface CatalogSnapshotRepository extends JpaRepository<CatalogSnapshot, Long> {

    List<CatalogSnapshot> findByEntidadOrderByCreatedAtDesc(String entidad);

    List<CatalogSnapshot> findByEntidadAndCodigoOrderByCreatedAtDesc(String entidad, String codigo);

    List<CatalogSnapshot> findAllByOrderByCreatedAtDesc();
}