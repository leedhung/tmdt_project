package com.etutor.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "student_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile implements Persistable<Long> {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(length = 50)
    private String grade;

    @Column(length = 200)
    private String school;

    @Column(columnDefinition = "TEXT")
    private String learningGoals;

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
