package api.repositories;

import api.entities.ChatMiembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ChatMiembroRepository extends JpaRepository<ChatMiembro, ChatMiembro.Id> {

    List<ChatMiembro> findById_ConversacionId(Long conversacionId);

    List<ChatMiembro> findById_UsuarioCodigo(String usuarioCodigo);

    boolean existsById_ConversacionIdAndId_UsuarioCodigo(Long conversacionId, String usuarioCodigo);

    long countById_ConversacionId(Long conversacionId);
}
