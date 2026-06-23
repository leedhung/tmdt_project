package com.etutor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDto {
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private Boolean isVerified;
    private String dob; // Date of birth (NEW)
    
    // Student specific
    private String grade;
    private String learningGoals;
    private String school; // School/University (NEW)
    
    // Tutor specific
    private String qualifications;
    private String experience;
    private BigDecimal hourlyRate;
    private String subjects;
    private String citizenCard;
    private String university; // University (NEW)
    private String duration; // Lesson duration, e.g. "90 phút" (NEW)
    private String certificates; // Certificates JSON String (NEW)
    private String status; // Review status (NEW)
    private String rejectReason; // Reject reason (NEW)
}
