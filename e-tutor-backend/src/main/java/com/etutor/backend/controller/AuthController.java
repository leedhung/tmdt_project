package com.etutor.backend.controller;

import com.etutor.backend.dto.*;
import com.etutor.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.etutor.backend.model.User;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        try {
            String message = authService.registerUser(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = authService.authenticateUser(request);
            return ResponseEntity.ok(authResponse);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(@RequestBody TokenRefreshRequest request) {
        try {
            String newAccessToken = authService.refreshAccessToken(request.getRefreshToken());
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal Long userId,
            @RequestBody ChangePasswordRequest request) {
        try {
            if (userId == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Yêu cầu đăng nhập để thực hiện tác vụ này!");
                return ResponseEntity.status(401).body(errorResponse);
            }
            authService.changePassword(userId, request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đổi mật khẩu thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            String message = authService.sendOtpForgotPassword(request.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            String message = authService.resetPassword(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal Long userId) {
        try {
            if (userId == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Yêu cầu đăng nhập!");
                return ResponseEntity.status(401).body(errorResponse);
            }
            ProfileDto profile = authService.getProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/debug-auth")
    public ResponseEntity<?> debugAuth(org.springframework.security.core.Authentication auth) {
        Map<String, Object> debugInfo = new java.util.HashMap<>();
        if (auth == null) {
            debugInfo.put("message", "Authentication is null");
        } else {
            debugInfo.put("principal", auth.getPrincipal());
            debugInfo.put("authorities", auth.getAuthorities().stream().map(a -> a.getAuthority()).toList());
            debugInfo.put("name", auth.getName());
        }
        return ResponseEntity.ok(debugInfo);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody ProfileDto request) {
        try {
            if (userId == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Yêu cầu đăng nhập!");
                return ResponseEntity.status(401).body(errorResponse);
            }
            ProfileDto updated = authService.updateProfile(userId, request);
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Lấy danh sách tất cả tài khoản người dùng (Chỉ dành cho Admin)
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = authService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Phê duyệt hoặc khóa tài khoản thành viên (Chỉ dành cho Admin)
    @PostMapping("/users/{userId}/toggle-verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleVerifyUser(@PathVariable Long userId) {
        try {
            User updatedUser = authService.toggleVerifyUser(userId);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Lấy thông tin hồ sơ của bất kỳ người dùng nào (Chỉ dành cho Admin)
    @GetMapping("/users/{userId}/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserProfileForAdmin(@PathVariable Long userId) {
        try {
            ProfileDto profile = authService.getProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Gia sư gửi yêu cầu duyệt hồ sơ chuyên môn
    @PostMapping("/tutor/submit-review")
    public ResponseEntity<?> submitReview(@AuthenticationPrincipal Long userId) {
        try {
            if (userId == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Yêu cầu đăng nhập để thực hiện tác vụ này!");
                return ResponseEntity.status(401).body(errorResponse);
            }
            String message = authService.submitReview(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Lấy danh sách gia sư đang chờ duyệt chuyên môn (Chỉ dành cho Admin)
    @GetMapping("/admin/tutors/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingTutors() {
        try {
            List<com.etutor.backend.model.TutorProfile> pendingTutors = authService.getPendingTutors();
            return ResponseEntity.ok(pendingTutors);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Phê duyệt hồ sơ gia sư (Chỉ dành cho Admin)
    @PostMapping("/admin/tutor/{targetUserId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveTutorProfile(@PathVariable Long targetUserId) {
        try {
            authService.approveTutorProfile(targetUserId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã phê duyệt kích hoạt tài khoản gia sư thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Từ chối hồ sơ gia sư (Chỉ dành cho Admin)
    @PostMapping("/admin/tutor/{targetUserId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectTutorProfile(@PathVariable Long targetUserId, @RequestBody Map<String, String> body) {
        try {
            String reason = body.get("reason");
            authService.rejectTutorProfile(targetUserId, reason);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã từ chối hồ sơ gia sư và gửi phản hồi thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Lấy danh sách gia sư đã phê duyệt công khai kèm profile đầy đủ (Không yêu cầu đăng nhập)
    @GetMapping("/tutors/active")
    public ResponseEntity<?> getActiveTutors() {
        try {
            List<ProfileDto> tutors = authService.getActiveTutors();
            return ResponseEntity.ok(tutors);
        } catch (Exception ex) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
