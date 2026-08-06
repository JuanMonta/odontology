package api.repositories;

import api.entities.ClinicaSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface ClinicaSettingRepository extends JpaRepository<ClinicaSetting, Integer> {
}
