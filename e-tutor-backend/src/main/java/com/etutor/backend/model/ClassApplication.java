package com.etutor.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "tutor_id", nullable = false)
    private Long tutorId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
