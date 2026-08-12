package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Membresía de un usuario en una conversación de chat (tabla {@code chat_miembros}).
 * {@code ultimaLectura} es el timestamp hasta donde ese usuario ha leído el hilo.
 */
@Entity
@Table(name = "chat_miembros")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMiembro {

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "conversacion_id")
        private Long conversacionId;
        @Column(name = "usuario_codigo", length = 12)
        private String usuarioCodigo;

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Id id)) {
                return false;
            }
            return Objects.equals(conversacionId, id.conversacionId)
                    && Objects.equals(usuarioCodigo, id.usuarioCodigo);
        }

        @Override
        public int hashCode() {
            return Objects.hash(conversacionId, usuarioCodigo);
        }
    }

    @EmbeddedId
    private Id id;

    @Column(name = "es_admin", nullable = false)
    private boolean esAdmin;

    @Column(name = "ultima_lectura")
    private LocalDateTime ultimaLectura;
}
