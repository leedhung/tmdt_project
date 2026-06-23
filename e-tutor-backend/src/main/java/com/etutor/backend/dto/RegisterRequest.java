package com.etutor.backend.dto;

import com.etutor.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private Role role;
    private String fullName;
    private String phone;

    // Các trường hồ sơ tùy chọn cho Gia sư
    private String qualifications;
    private String experience;
    private BigDecimal hourlyRate;
    private String subjects;
    private String citizenCard;

    // Các trường hồ sơ tùy chọn cho Học viên
    private String grade;
    private String learningGoals;
}
