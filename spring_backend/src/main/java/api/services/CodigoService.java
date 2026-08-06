package api.services;

import api.entities.CodigoSeq;
import api.repositories.CodigoSeqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generación atómica de códigos secuenciales por prefijo.
 *
 * <p>El siguiente número se obtiene bloqueando la fila de {@code codigo_seq}
 * ({@code SELECT ... FOR UPDATE}) y se libera al hacer commit de la transacción
 * que ejecuta el alta. Dos altas concurrentes del mismo prefijo se serializan en
 * la fila, por lo que el código nunca se duplica, sin depender del orden
 * lexicográfico del VARCHAR ni de reutilizar el máximo actual.</p>
 */
@Service
@RequiredArgsConstructor
public class CodigoService {

    private final CodigoSeqRepository codigoSeqRepository;

    @Transactional
    public String nextCodigo(String prefix, String format) {
        CodigoSeq seq = codigoSeqRepository.findByPrefixForUpdate(prefix)
                .orElseThrow(() -> new IllegalStateException(
                        "Secuencia no inicializada para el prefijo: " + prefix));
        long siguiente = seq.getUltimo() + 1;
        seq.setUltimo(siguiente);
        return String.format(format, siguiente);
    }
}
