package api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Conversación de chat: mensaje directo (dm) o canal creado por el
 * administrador (canal). El historial vive en {@code chat_mensajes} y la
 * membresía en {@code chat_miembros}.
 */
@Entity
@Table(name = "chat_conversaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConversacion {

    public enum Tipo { dm, canal }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private Tipo tipo;

    @Column(name = "nombre", length = 80)
    private String nombre;

    @Column(name = "creador", length = 12)
    private String creador;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
