package com.etutor.backend.service;

import com.etutor.backend.dto.ReviewRequest;
import com.etutor.backend.model.ClassEntity;
import com.etutor.backend.model.Review;
import com.etutor.backend.model.User;
import com.etutor.backend.repository.ClassRepository;
import com.etutor.backend.repository.ReviewRepository;
import com.etutor.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ClassRepository classRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }

    // Tạo đánh giá mới (Học viên đánh giá lớp học)
    @Transactional
    public Review createReview(Long studentId, ReviewRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Điểm đánh giá (sao) phải từ 1 đến 5!");
        }

        ClassEntity classEntity = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Lớp học không tồn tại!"));

        if (classEntity.getStudentId() == null || !classEntity.getStudentId().equals(studentId)) {
            throw new RuntimeException("Bạn không phải học viên của lớp học này nên không có quyền đánh giá!");
        }

        if (!"COMPLETED".equals(classEntity.getStatus())) {
            throw new RuntimeException("Lớp học phải ở trạng thái HOÀN THÀNH (COMPLETED) mới có thể thực hiện đánh giá!");
        }

        if (reviewRepository.findByClassId(request.getClassId()).isPresent()) {
            throw new RuntimeException("Lớp học này đã được bạn gửi đánh giá trước đó rồi!");
        }

        Review review = Review.builder()
                .classId(classEntity.getId())
                .studentId(studentId)
                .tutorId(classEntity.getTutorId())
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : "")
                .build();

        return reviewRepository.save(review);
    }

    // Lấy danh sách đánh giá của Gia sư kèm thông tin học viên đánh giá
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTutorReviews(Long tutorId) {
        List<Review> reviews = reviewRepository.findByTutorIdOrderByCreatedAtDesc(tutorId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Review rv : reviews) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", rv.getId());
            map.put("classId", rv.getClassId());
            map.put("studentId", rv.getStudentId());
            map.put("tutorId", rv.getTutorId());
            map.put("rating", rv.getRating());
            map.put("comment", rv.getComment());
            map.put("createdAt", rv.getCreatedAt());

            userRepository.findById(rv.getStudentId()).ifPresent(user -> {
                map.put("studentFullName", user.getFullName());
                map.put("studentEmail", user.getEmail());
                map.put("studentAvatar", user.getAvatar());
            });

            // Map thêm thông tin tên lớp học để biết đánh giá cho lớp nào
            classRepository.findById(rv.getClassId()).ifPresent(cls -> {
                map.put("classTitle", cls.getTitle());
            });

            result.add(map);
        }

        return result;
    }

    // Lấy điểm trung bình và tổng số lượt đánh giá của Gia sư
    @Transactional(readOnly = true)
    public Map<String, Object> getTutorStats(Long tutorId) {
        Double averageRating = reviewRepository.getAverageRatingByTutorId(tutorId);
        Long totalReviews = reviewRepository.countByTutorId(tutorId);

        // Làm tròn 1 chữ số thập phân
        double roundedRating = Math.round(averageRating * 10.0) / 10.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", roundedRating);
        stats.put("totalReviews", totalReviews);
        return stats;
    }
    
    // Kiểm tra nhanh xem lớp học đã được đánh giá chưa
    @Transactional(readOnly = true)
    public Map<String, Object> checkClassReviewed(Long classId) {
        boolean reviewed = reviewRepository.findByClassId(classId).isPresent();
        Map<String, Object> result = new HashMap<>();
        result.put("reviewed", reviewed);
        if (reviewed) {
            Review rv = reviewRepository.findByClassId(classId).get();
            result.put("rating", rv.getRating());
            result.put("comment", rv.getComment());
        }
        return result;
    }
}
