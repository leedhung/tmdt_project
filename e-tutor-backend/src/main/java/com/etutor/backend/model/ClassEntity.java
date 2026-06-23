package com.etutor.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "tutor_id")
    private Long tutorId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "grade_level", length = 50)
    private String gradeLevel;

    @Column(name = "student_gender", length = 20)
    private String studentGender;

    @Column(name = "student_details", columnDefinition = "TEXT")
    private String studentDetails;

    @Column(name = "tutor_requirements", columnDefinition = "TEXT")
    private String tutorRequirements;

    @Column(name = "learning_mode", length = 50)
    private String learningMode = "ONLINE";

    @Column(name = "address")
    private String address;

    @Column(name = "hourly_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "total_lessons", nullable = false)
    private Integer totalLessons;

    @Column(name = "schedule_config", nullable = false, columnDefinition = "TEXT")
    private String scheduleConfig; // Lưu chuỗi JSON cấu hình slots: [{"dayOfWeek": 2, "startTime": "19:00", "endTime": "21:00"}, ...]

    @Column(nullable = false, length = 50)
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, REJECTED, FINDING_TUTOR, WAITING_PAYMENT, ACTIVATED, COMPLETED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING_APPROVAL";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
