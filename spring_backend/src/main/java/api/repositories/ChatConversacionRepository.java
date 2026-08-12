package api.repositories;

import api.entities.ChatConversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(exported = false)
public interface ChatConversacionRepository extends JpaRepository<ChatConversacion, Long> {

    @Query("""
            SELECT c FROM ChatConversacion c
            WHERE c.tipo = :tipo
              AND EXISTS (SELECT m FROM ChatMiembro m
                          WHERE m.id.conversacionId = c.id AND m.id.usuarioCodigo = :a)
              AND EXISTS (SELECT m FROM ChatMiembro m
                          WHERE m.id.conversacionId = c.id AND m.id.usuarioCodigo = :b)
              AND (SELECT COUNT(m) FROM ChatMiembro m
                   WHERE m.id.conversacionId = c.id) = 2
            """)
    List<ChatConversacion> findDmEntre(@Param("a") String a, @Param("b") String b, @Param("tipo") ChatConversacion.Tipo tipo);
}
