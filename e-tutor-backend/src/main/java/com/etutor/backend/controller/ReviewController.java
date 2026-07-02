package com.etutor.backend.controller;

import com.etutor.backend.dto.ReviewRequest;
import com.etutor.backend.model.Review;
import com.etutor.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // 1. Học viên gửi đánh giá cho lớp học
    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal Long studentId,
            @RequestBody ReviewRequest request) {
        try {
            if (studentId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Yêu cầu đăng nhập học viên để thực hiện đánh giá!");
                return ResponseEntity.status(401).body(error);
            }
            Review review = reviewService.createReview(studentId, request);
            return ResponseEntity.ok(review);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 2. Lấy danh sách đánh giá của Gia sư (Công khai)
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<?> getTutorReviews(@PathVariable Long tutorId) {
        try {
            List<Map<String, Object>> reviews = reviewService.getTutorReviews(tutorId);
            return ResponseEntity.ok(reviews);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 3. Lấy thông số đánh giá trung bình & lượt đánh giá của Gia sư
    @GetMapping("/tutor/{tutorId}/average")
    public ResponseEntity<?> getTutorAverage(@PathVariable Long tutorId) {
        try {
            Map<String, Object> stats = reviewService.getTutorStats(tutorId);
            return ResponseEntity.ok(stats);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 4. Kiểm tra xem lớp học đã được đánh giá chưa
    @GetMapping("/class/{classId}/check")
    public ResponseEntity<?> checkClassReviewed(@PathVariable Long classId) {
        try {
            Map<String, Object> result = reviewService.checkClassReviewed(classId);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
