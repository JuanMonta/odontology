package api.repositories;

import api.entities.WaitingQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;
import java.util.Optional;

@RepositoryRestResource(exported = false)
public interface WaitingQueueRepository extends JpaRepository<WaitingQueue, Long> {

    List<WaitingQueue> findByAtendidoFalseOrderByLlegadaAsc();

    Optional<WaitingQueue> findFirstByOrderByTicketDesc();
}
