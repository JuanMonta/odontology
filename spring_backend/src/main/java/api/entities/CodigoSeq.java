package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Contador atómico por prefijo (tabla {@code codigo_seq}). Reemplaza la
 * derivación del siguiente código a partir del máximo léxico del VARCHAR.
 */
@Entity
@Table(name = "codigo_seq")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodigoSeq {

    @Id
    @Column(name = "prefix", nullable = false, length = 8)
    private String prefix;

    @Column(name = "ultimo", nullable = false)
    private Long ultimo;
}
