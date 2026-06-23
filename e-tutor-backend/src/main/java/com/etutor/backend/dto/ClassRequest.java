package com.etutor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequest {
    private String title;
    private String description;
    private String subject;
    private String gradeLevel;
    private String studentGender;
    private String studentDetails;
    private String tutorRequirements;
    private String learningMode;
    private String address;
    private BigDecimal hourlyRate;
    private Integer totalLessons;
    private String scheduleConfig; // Chuỗi JSON cấu hình slots
    private Long tutorId; // Tùy chọn (NULL nếu học viên đăng tuyển gia sư)
}
