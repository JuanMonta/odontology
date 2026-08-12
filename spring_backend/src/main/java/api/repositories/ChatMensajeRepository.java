package api.repositories;

import api.entities.ChatMensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {

    List<ChatMensaje> findTop100ByConversacionIdOrderByIdDesc(Long conversacionId);

    long countByConversacionId(Long conversacionId);
}
