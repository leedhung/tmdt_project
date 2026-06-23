package com.etutor.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;
import java.math.BigDecimal;

@Entity
@Table(name = "tutor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorProfile implements Persistable<Long> {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(name = "hourly_rate")
    @Builder.Default
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(length = 255)
    private String subjects;

    @Column(name = "citizen_card", length = 50)
    private String citizenCard;

    @Column(length = 200)
    private String university;

    @Column(length = 50)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String certificates;

    @Column(length = 50)
    @Builder.Default
    private String status = "NOT_SUBMITTED";

    @Column(name = "reject_reason", length = 255)
    private String rejectReason;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Long getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }
}
