package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Adjunto de un mensaje de chat (tabla {@code chat_adjuntos}). Los bytes se
 * guardan fuera del webroot con nombre aleatorio UUID; aquí vive solo el
 * metadato (nombre original saneado, tipo MIME verificado por firma, tamaño).
 */
@Entity
@Table(name = "chat_adjuntos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatAdjunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "conversacion_id", nullable = false)
    private Long conversacionId;

    @Column(name = "subido_por", nullable = false, length = 12)
    private String subidoPor;

    @Column(name = "nombre_original", nullable = false, length = 120)
    private String nombreOriginal;

    @Column(name = "nombre_disco", nullable = false, unique = true, length = 96)
    private String nombreDisco;

    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo;

    @Column(name = "categoria", nullable = false, length = 20)
    private String categoria;

    @Column(name = "tamano", nullable = false)
    private Long tamano;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}