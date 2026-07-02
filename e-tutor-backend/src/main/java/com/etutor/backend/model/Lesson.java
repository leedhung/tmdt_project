package com.etutor.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "lesson_number", nullable = false)
    private Integer lessonNumber;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false, length = 50)
    private String status = "UPCOMING"; // UPCOMING, ONGOING, PENDING_CONFIRM, COMPLETED, DISPUTED

    @Column(name = "meeting_link", length = 255)
    private String meetingLink;

    @Column(name = "recording_link", length = 255)
    private String recordingLink;

    @Column(name = "dispute_reason", columnDefinition = "TEXT")
    private String disputeReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "UPCOMING";
        }
    }
}
