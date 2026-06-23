package com.etutor.backend.controller;

import com.etutor.backend.dto.ClassRequest;
import com.etutor.backend.model.*;
import com.etutor.backend.repository.*;
import com.etutor.backend.service.ScheduleService;
import com.etutor.backend.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/class")
public class ClassController {

    private final ClassRepository classRepository;
    private final WalletService walletService;
    private final ScheduleService scheduleService;
    private final LessonRepository lessonRepository;
    private final ClassApplicationRepository classApplicationRepository;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;

    public ClassController(ClassRepository classRepository,
                           WalletService walletService,
                           ScheduleService scheduleService,
                           LessonRepository lessonRepository,
                           ClassApplicationRepository classApplicationRepository,
                           UserRepository userRepository,
                           TutorProfileRepository tutorProfileRepository) {
        this.classRepository = classRepository;
        this.walletService = walletService;
        this.scheduleService = scheduleService;
        this.lessonRepository = lessonRepository;
        this.classApplicationRepository = classApplicationRepository;
        this.userRepository = userRepository;
        this.tutorProfileRepository = tutorProfileRepository;
    }

    // 1. Tạo mới Lớp học (Học viên tạo để tuyển gia sư, hoặc Gia sư tạo để tuyển học viên)
    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> createClass(@AuthenticationPrincipal Long userId, @RequestBody ClassRequest request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

            ClassEntity.ClassEntityBuilder builder = ClassEntity.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .subject(request.getSubject())
                    .gradeLevel(request.getGradeLevel())
                    .studentGender(request.getStudentGender())
                    .studentDetails(request.getStudentDetails())
                    .tutorRequirements(request.getTutorRequirements())
                    .learningMode(request.getLearningMode())
                    .address(request.getAddress())
                    .hourlyRate(request.getHourlyRate())
                    .totalLessons(request.getTotalLessons())
                    .scheduleConfig(request.getScheduleConfig())
                    .status("PENDING_APPROVAL");

            if (user.getRole() == Role.TUTOR) {
                if (user.getIsVerified() == null || !user.getIsVerified()) {
                    throw new RuntimeException("Tài khoản của bạn chưa được duyệt chuyên môn bởi Ban quản trị!");
                }
                builder.tutorId(userId);
                // studentId là null đối với lớp gia sư mở sẵn chờ học sinh đăng ký
            } else {
                builder.studentId(userId);
                if (request.getTutorId() != null) {
                    User tutor = userRepository.findById(request.getTutorId())
                            .orElseThrow(() -> new RuntimeException("Gia sư chỉ định không tồn tại!"));
                    if (tutor.getIsVerified() == null || !tutor.getIsVerified()) {
                        throw new RuntimeException("Gia sư được chỉ định chưa được duyệt chuyên môn bởi Ban quản trị!");
                    }
                }
                builder.tutorId(request.getTutorId());
            }

            ClassEntity savedClass = classRepository.save(builder.build());
            return ResponseEntity.ok(savedClass);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 2. Lấy danh sách lớp học của người dùng hiện tại
    @GetMapping
    public ResponseEntity<?> getMyClasses(@AuthenticationPrincipal Long userId) {
        // Trả về danh sách lớp học liên quan đến studentId hoặc tutorId
        List<ClassEntity> studentClasses = classRepository.findByStudentId(userId);
        if (!studentClasses.isEmpty()) {
            return ResponseEntity.ok(studentClasses);
        }
        List<ClassEntity> tutorClasses = classRepository.findByTutorId(userId);
        return ResponseEntity.ok(tutorClasses);
    }

    // 3. Admin duyệt Lớp học -> chuyển trạng thái tương ứng dựa trên vai trò
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveClass(@PathVariable Long id) {
        try {
            ClassEntity classEntity = classRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

            if (classEntity.getTutorId() != null && classEntity.getStudentId() != null) {
                classEntity.setStatus("WAITING_PAYMENT"); // Cả hai có sẵn, chờ thanh toán
            } else if (classEntity.getTutorId() != null && classEntity.getStudentId() == null) {
                classEntity.setStatus("FINDING_STUDENT"); // Gia sư tự mở lớp tìm học sinh
            } else {
                classEntity.setStatus("FINDING_TUTOR"); // Học viên đăng tuyển gia sư
            }

            ClassEntity updatedClass = classRepository.save(classEntity);
            return ResponseEntity.ok(updatedClass);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 4. Học viên thanh toán học phí chốt lớp học (Kích hoạt luồng Escrow đóng băng tiền & rải lịch)
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> payForClass(@AuthenticationPrincipal Long studentId, @PathVariable Long id) {
        try {
            ClassEntity classEntity = classRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

            if (!classEntity.getStudentId().equals(studentId)) {
                throw new RuntimeException("Bạn không có quyền thanh toán cho lớp học của học viên khác!");
            }

            if (!"WAITING_PAYMENT".equals(classEntity.getStatus())) {
                throw new RuntimeException("Trạng thái lớp học không hợp lệ để thực hiện thanh toán!");
            }

            if (classEntity.getTutorId() == null) {
                throw new RuntimeException("Lớp học chưa chốt gia sư giảng dạy!");
            }

            // Tính tổng tiền học phí: hourly_rate * 2 giờ (mặc định mỗi buổi học là 2 giờ) * tổng số buổi
            // Ở đây để đơn giản: totalCost = hourlyRate * totalLessons (coi học phí hourlyRate là học phí theo buổi)
            BigDecimal totalCost = classEntity.getHourlyRate().multiply(BigDecimal.valueOf(classEntity.getTotalLessons()));

            // A. Tiến hành ĐÓNG BĂNG TIỀN (Escrow) trong ví học viên
            walletService.freezeBalance(studentId, totalCost);

            // B. Cập nhật trạng thái lớp thành ACTIVATED
            classEntity.setStatus("ACTIVATED");
            ClassEntity updatedClass = classRepository.save(classEntity);

            // C. Tự động RẢI LỊCH các buổi học bắt đầu từ ngày mai
            List<Lesson> lessons = scheduleService.generateLessonsForClass(updatedClass, LocalDate.now().plusDays(1));

            Map<String, Object> response = new HashMap<>();
            response.put("class", updatedClass);
            response.put("totalPaid", totalCost);
            response.put("lessonsGenerated", lessons.size());
            response.put("lessons", lessons);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 5. Lấy danh sách các buổi học của một Lớp học
    @GetMapping("/{id}/lessons")
    public ResponseEntity<?> getClassLessons(@PathVariable Long id) {
        try {
            List<Lesson> lessons = lessonRepository.findByClassIdOrderByLessonNumberAsc(id);
            return ResponseEntity.ok(lessons);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 6. Admin lấy danh sách TẤT CẢ lớp học trên hệ thống
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllClasses() {
        try {
            List<ClassEntity> allClasses = classRepository.findAll();
            return ResponseEntity.ok(allClasses);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 7. Lấy danh sách Lớp học công khai (Public Marketplace: Lớp học viên tìm gia sư HOẶC lớp gia sư tìm học sinh)
    @GetMapping("/public")
    public ResponseEntity<?> getPublicClasses() {
        try {
            List<ClassEntity> all = classRepository.findAll();
            List<ClassEntity> publicClasses = all.stream()
                    .filter(c -> "FINDING_TUTOR".equals(c.getStatus()) || "FINDING_STUDENT".equals(c.getStatus()))
                    .toList();
            return ResponseEntity.ok(publicClasses);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 7.1. Học viên nhấn đăng ký học lớp do Gia sư mở sẵn
    @PostMapping("/{classId}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> registerForClass(@AuthenticationPrincipal Long studentId, @PathVariable Long classId) {
        try {
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

            if (!"FINDING_STUDENT".equals(classEntity.getStatus())) {
                throw new RuntimeException("Lớp học này hiện tại không tuyển học sinh đăng ký!");
            }

            if (classEntity.getStudentId() != null) {
                throw new RuntimeException("Lớp học này đã có học viên đăng ký!");
            }

            // Gán học viên và chuyển sang chờ thanh toán
            classEntity.setStudentId(studentId);
            classEntity.setStatus("WAITING_PAYMENT");

            ClassEntity updatedClass = classRepository.save(classEntity);
            return ResponseEntity.ok(updatedClass);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 8. Gia sư ứng tuyển lớp học
    @PostMapping("/{classId}/apply")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> applyForClass(@AuthenticationPrincipal Long tutorId, @PathVariable Long classId) {
        try {
            User tutor = userRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Gia sư không tồn tại!"));

            if (tutor.getIsVerified() == null || !tutor.getIsVerified()) {
                throw new RuntimeException("Tài khoản của bạn chưa được duyệt chuyên môn bởi Ban quản trị!");
            }

            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

            if (!"FINDING_TUTOR".equals(classEntity.getStatus())) {
                throw new RuntimeException("Lớp học này hiện tại không tìm gia sư!");
            }

            // Kiểm tra xem đã ứng tuyển chưa
            if (classApplicationRepository.findByClassIdAndTutorId(classId, tutorId).isPresent()) {
                throw new RuntimeException("Bạn đã ứng tuyển lớp học này trước đó rồi!");
            }

            ClassApplication application = ClassApplication.builder()
                    .classId(classId)
                    .tutorId(tutorId)
                    .status("PENDING")
                    .build();

            ClassApplication saved = classApplicationRepository.save(application);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 9. Học viên xem danh sách các Gia sư ứng tuyển lớp của mình
    @GetMapping("/{classId}/applications")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getClassApplications(@AuthenticationPrincipal Long studentId, @PathVariable Long classId) {
        try {
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

            if (!classEntity.getStudentId().equals(studentId)) {
                throw new RuntimeException("Bạn không phải chủ lớp học này!");
            }

            List<ClassApplication> apps = classApplicationRepository.findByClassId(classId);
            List<Map<String, Object>> result = new ArrayList<>();

            for (ClassApplication app : apps) {
                Map<String, Object> map = new HashMap<>();
                map.put("applicationId", app.getId());
                map.put("classId", app.getClassId());
                map.put("tutorId", app.getTutorId());
                map.put("status", app.getStatus());
                map.put("createdAt", app.getCreatedAt());

                userRepository.findById(app.getTutorId()).ifPresent(user -> {
                    map.put("fullName", user.getFullName());
                    map.put("phone", user.getPhone());
                    map.put("email", user.getEmail());
                });

                tutorProfileRepository.findById(app.getTutorId()).ifPresent(profile -> {
                    map.put("qualifications", profile.getQualifications());
                    map.put("experience", profile.getExperience());
                    map.put("hourlyRate", profile.getHourlyRate());
                    map.put("subjects", profile.getSubjects());
                    map.put("university", profile.getUniversity());
                });

                result.add(map);
            }

            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 10. Học viên chốt chọn Gia sư cho lớp học của mình
    @PostMapping("/applications/{applicationId}/accept")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> acceptTutor(@AuthenticationPrincipal Long studentId, @PathVariable Long applicationId) {
        try {
            ClassApplication application = classApplicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn ứng tuyển!"));

            ClassEntity classEntity = classRepository.findById(application.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!classEntity.getStudentId().equals(studentId)) {
                throw new RuntimeException("Bạn không phải chủ lớp học này!");
            }

            if (!"FINDING_TUTOR".equals(classEntity.getStatus())) {
                throw new RuntimeException("Trạng thái lớp không hợp lệ để chốt gia sư!");
            }

            // 1. Duyệt đơn được chọn
            application.setStatus("ACCEPTED");
            classApplicationRepository.save(application);

            // 2. Từ chối tất cả đơn khác của lớp học này
            List<ClassApplication> otherApps = classApplicationRepository.findByClassId(classEntity.getId());
            for (ClassApplication other : otherApps) {
                if (!other.getId().equals(applicationId)) {
                    other.setStatus("REJECTED");
                    classApplicationRepository.save(other);
                }
            }

            // 3. Gán gia sư và chuyển trạng thái lớp sang WAITING_PAYMENT
            classEntity.setTutorId(application.getTutorId());
            classEntity.setStatus("WAITING_PAYMENT");
            ClassEntity updatedClass = classRepository.save(classEntity);

            return ResponseEntity.ok(updatedClass);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ==================== NGƯỜI 3: PHẦN 2 & 3: VẬN HÀNH PHÒNG HỌC & ĐỐNG BĂNG/GIẢI NGÂN/KHIẾU NẠI ====================

    // A. Bắt đầu buổi học (Check-in)
    @PostMapping("/lessons/{lessonId}/start")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR')")
    public ResponseEntity<?> startLesson(@AuthenticationPrincipal Long userId, @PathVariable Long lessonId) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học!"));

            ClassEntity classEntity = classRepository.findById(lesson.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!userId.equals(classEntity.getStudentId()) && !userId.equals(classEntity.getTutorId())) {
                throw new RuntimeException("Bạn không có quyền check-in buổi học này!");
            }

            if ("UPCOMING".equals(lesson.getStatus())) {
                lesson.setStatus("ONGOING");
                // Đảm bảo link Jitsi tồn tại
                if (lesson.getMeetingLink() == null || lesson.getMeetingLink().isEmpty()) {
                    lesson.setMeetingLink(String.format("https://meet.jit.si/etutor-class-%d-session-%d", classEntity.getId(), lesson.getLessonNumber()));
                }
                lessonRepository.save(lesson);
            }

            return ResponseEntity.ok(lesson);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // B. Kết thúc buổi học (Check-out) - Chỉ Gia sư được bấm
    @PostMapping("/lessons/{lessonId}/end")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> endLesson(@AuthenticationPrincipal Long userId, @PathVariable Long lessonId) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học!"));

            ClassEntity classEntity = classRepository.findById(lesson.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!userId.equals(classEntity.getTutorId())) {
                throw new RuntimeException("Chỉ Gia sư của lớp mới được quyền bấm kết thúc buổi học!");
            }

            if ("ONGOING".equals(lesson.getStatus())) {
                lesson.setStatus("PENDING_CONFIRM");
                lessonRepository.save(lesson);
            } else {
                throw new RuntimeException("Trạng thái buổi học không hợp lệ để kết thúc (phải là đang diễn ra ONGOING)!");
            }

            return ResponseEntity.ok(lesson);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // C. Học viên xác nhận hoàn thành buổi học (Giải ngân tiền cho Gia sư)
    @PostMapping("/lessons/{lessonId}/confirm")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> confirmLesson(@AuthenticationPrincipal Long userId, @PathVariable Long lessonId) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học!"));

            ClassEntity classEntity = classRepository.findById(lesson.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!userId.equals(classEntity.getStudentId())) {
                throw new RuntimeException("Chỉ Học viên của lớp mới được quyền xác nhận hoàn thành buổi học!");
            }

            if (!"PENDING_CONFIRM".equals(lesson.getStatus())) {
                throw new RuntimeException("Trạng thái buổi học phải là Chờ xác nhận (PENDING_CONFIRM)!");
            }

            // 1. Thực hiện giải ngân học phí 1 buổi (tương đương hourlyRate)
            // Với commission rate 15% (0.15)
            walletService.unfreezeAndDistribute(
                    classEntity.getStudentId(),
                    classEntity.getTutorId(),
                    classEntity.getHourlyRate(),
                    0.15
            );

            // 2. Cập nhật trạng thái buổi học
            lesson.setStatus("COMPLETED");
            lessonRepository.save(lesson);

            // 3. Kiểm tra xem tất cả các buổi học của lớp đã hoàn thành chưa
            List<Lesson> classLessons = lessonRepository.findByClassIdOrderByLessonNumberAsc(classEntity.getId());
            boolean allCompleted = classLessons.stream().allMatch(l -> "COMPLETED".equals(l.getStatus()));
            if (allCompleted) {
                classEntity.setStatus("COMPLETED");
                classRepository.save(classEntity);
            }

            return ResponseEntity.ok(lesson);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // D. Học viên gửi khiếu nại (Đưa trạng thái sang DISPUTED)
    @PostMapping("/lessons/{lessonId}/dispute")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> disputeLesson(@AuthenticationPrincipal Long userId, @PathVariable Long lessonId) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học!"));

            ClassEntity classEntity = classRepository.findById(lesson.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!userId.equals(classEntity.getStudentId())) {
                throw new RuntimeException("Chỉ Học viên của lớp mới được quyền gửi khiếu nại!");
            }

            if (!"PENDING_CONFIRM".equals(lesson.getStatus()) && !"ONGOING".equals(lesson.getStatus())) {
                throw new RuntimeException("Chỉ có thể khiếu nại buổi học đang học hoặc đang chờ nghiệm thu!");
            }

            lesson.setStatus("DISPUTED");
            lessonRepository.save(lesson);

            return ResponseEntity.ok(lesson);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // E. Admin xử lý tranh chấp/khiếu nại (Hoàn tiền / Giải ngân)
    @PostMapping("/lessons/{lessonId}/resolve-dispute")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resolveDispute(@PathVariable Long lessonId, @RequestParam String decision) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học!"));

            ClassEntity classEntity = classRepository.findById(lesson.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học tương ứng!"));

            if (!"DISPUTED".equals(lesson.getStatus())) {
                throw new RuntimeException("Buổi học này hiện tại không có tranh chấp/khiếu nại!");
            }

            if ("REFUND".equalsIgnoreCase(decision)) {
                // Hoàn lại tiền học phí buổi đó cho Học viên
                walletService.refund(classEntity.getStudentId(), classEntity.getHourlyRate());
                lesson.setStatus("COMPLETED"); // Xem như hoàn thành việc xử lý (buổi học kết thúc bằng hoàn tiền)
            } else if ("PAY_TUTOR".equalsIgnoreCase(decision)) {
                // Giải ngân cho gia sư sau khi trừ 15% phí hoa hồng
                walletService.unfreezeAndDistribute(
                        classEntity.getStudentId(),
                        classEntity.getTutorId(),
                        classEntity.getHourlyRate(),
                        0.15
                );
                lesson.setStatus("COMPLETED");
            } else {
                throw new RuntimeException("Quyết định giải quyết không hợp lệ (phải là REFUND hoặc PAY_TUTOR)!");
            }

            lessonRepository.save(lesson);

            // Kiểm tra xem tất cả các buổi học của lớp đã hoàn thành chưa
            List<Lesson> classLessons = lessonRepository.findByClassIdOrderByLessonNumberAsc(classEntity.getId());
            boolean allCompleted = classLessons.stream().allMatch(l -> "COMPLETED".equals(l.getStatus()));
            if (allCompleted) {
                classEntity.setStatus("COMPLETED");
                classRepository.save(classEntity);
            }

            return ResponseEntity.ok(lesson);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // F. Admin lấy tất cả các buổi học bị tranh chấp
    @GetMapping("/lessons/disputed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDisputedLessons() {
        try {
            List<Lesson> disputed = lessonRepository.findByStatus("DISPUTED");
            List<Map<String, Object>> result = new ArrayList<>();

            for (Lesson les : disputed) {
                Map<String, Object> map = new HashMap<>();
                map.put("lessonId", les.getId());
                map.put("classId", les.getClassId());
                map.put("lessonNumber", les.getLessonNumber());
                map.put("startTime", les.getStartTime());
                map.put("endTime", les.getEndTime());
                map.put("status", les.getStatus());
                map.put("meetingLink", les.getMeetingLink());

                classRepository.findById(les.getClassId()).ifPresent(cls -> {
                    map.put("classTitle", cls.getTitle());
                    map.put("hourlyRate", cls.getHourlyRate());
                    
                    userRepository.findById(cls.getStudentId()).ifPresent(student -> {
                        map.put("studentName", student.getFullName());
                        map.put("studentEmail", student.getEmail());
                    });

                    userRepository.findById(cls.getTutorId()).ifPresent(tutor -> {
                        map.put("tutorName", tutor.getFullName());
                        map.put("tutorEmail", tutor.getEmail());
                    });
                });

                result.add(map);
            }

            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}

