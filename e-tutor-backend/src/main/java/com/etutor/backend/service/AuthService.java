package com.etutor.backend.service;

import com.etutor.backend.dto.*;
import com.etutor.backend.model.*;
import com.etutor.backend.repository.*;
import com.etutor.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    // Bộ nhớ tạm thời lưu mã OTP khôi phục mật khẩu (Email -> OtpData)
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();

    private static class OtpData {
        private final String code;
        private final long expiryTime;

        public OtpData(String code, long expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }

        public String getCode() { return code; }
        public boolean isExpired() { return System.currentTimeMillis() > expiryTime; }
    }

    public AuthService(UserRepository userRepository,
                       TutorProfileRepository tutorProfileRepository,
                       StudentProfileRepository studentProfileRepository,
                       WalletRepository walletRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.tutorProfileRepository = tutorProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
    }

    private void validateRegisterRequest(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống!");
        }
        if (!request.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            throw new RuntimeException("Email không đúng định dạng!");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new RuntimeException("Mật khẩu không được để trống!");
        }
        if (request.getPassword().length() < 6) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất 6 ký tự!");
        }
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Họ và tên không được để trống!");
        }
        if (request.getFullName().trim().length() < 2) {
            throw new RuntimeException("Họ và tên phải chứa ít nhất 2 ký tự!");
        }
        if (request.getRole() == null) {
            throw new RuntimeException("Vai trò thành viên không hợp lệ!");
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            if (!request.getPhone().trim().matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
                throw new RuntimeException("Số điện thoại không đúng định dạng Việt Nam (phải gồm 10 chữ số)!");
            }
        }

        if (request.getRole() == Role.STUDENT) {
            if (request.getGrade() == null || request.getGrade().trim().isEmpty()) {
                throw new RuntimeException("Khối lớp học không được để trống đối với Học viên!");
            }
        }
    }

    private void validateLoginRequest(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email đăng nhập không được để trống!");
        }
        if (!request.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            throw new RuntimeException("Email đăng nhập không đúng định dạng!");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new RuntimeException("Mật khẩu không được để trống!");
        }
    }

    @Transactional
    public String registerUser(RegisterRequest request) {
        // 0. Thực hiện validate dữ liệu đầu vào
        validateRegisterRequest(request);

        // 1. Kiểm tra Email tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        // 2. Tạo đối tượng User và mã hóa mật khẩu
        User user = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .isVerified(request.getRole() == Role.TUTOR ? false : true) // Gia sư mặc định chờ duyệt, học viên auto-active
                .build();

        User savedUser = userRepository.save(user);

        // 3. Tạo Hồ sơ Profile chi tiết tương ứng với vai trò
        if (request.getRole() == Role.TUTOR) {
            TutorProfile tutorProfile = TutorProfile.builder()
                    .userId(savedUser.getId())
                    .user(savedUser)
                    .qualifications(request.getQualifications() != null ? request.getQualifications().trim() : "")
                    .experience(request.getExperience() != null ? request.getExperience().trim() : "")
                    .hourlyRate(request.getHourlyRate() != null ? request.getHourlyRate() : BigDecimal.ZERO)
                    .subjects(request.getSubjects() != null ? request.getSubjects().trim() : "")
                    .citizenCard(request.getCitizenCard() != null ? request.getCitizenCard().trim() : "")
                    .build();
            tutorProfileRepository.save(tutorProfile);
        } else if (request.getRole() == Role.STUDENT) {
            StudentProfile studentProfile = StudentProfile.builder()
                    .userId(savedUser.getId())
                    .user(savedUser)
                    .grade(request.getGrade().trim())
                    .learningGoals(request.getLearningGoals() != null ? request.getLearningGoals().trim() : "")
                    .build();
            studentProfileRepository.save(studentProfile);
        }

        // 4. [LÕI VÍ TIỀN - TỰ ĐỘNG KHỞI TẠO VÍ]
        Wallet wallet = Wallet.builder()
                .userId(savedUser.getId())
                .balance(BigDecimal.ZERO)
                .frozenBalance(BigDecimal.ZERO)
                .build();
        walletRepository.save(wallet);

        return "Đăng ký tài khoản thành công!";
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticateUser(LoginRequest request) {
        // 0. Thực hiện validate dữ liệu đầu vào
        validateLoginRequest(request);

        // 1. Tìm User theo Email
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!"));

        // 2. So khớp mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!");
        }

        // 3. Cho phép đăng nhập bình thường kể cả chưa được duyệt (isVerified = false)
        // Việc chặn các hành động dạy học sẽ được xử lý ở API tạo/nhận lớp học hoặc ứng tuyển.

        // 4. Sinh Token JWT
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Transactional(readOnly = true)
    public String refreshAccessToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh Token không hợp lệ hoặc đã hết hạn!");
        }

        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        return tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
    }

    // Đổi mật khẩu cho tài khoản đã đăng nhập
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Yêu cầu OTP khôi phục mật khẩu
    public String sendOtpForgotPassword(String email) {
        // Kiểm tra email tồn tại
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này!"));

        // Tạo mã OTP 6 chữ số ngẫu nhiên
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Lưu cache hết hạn sau 5 phút (300.000 ms)
        long expiryTime = System.currentTimeMillis() + 300000;
        otpCache.put(email, new OtpData(otp, expiryTime));

        // Gửi email chứa OTP (Tự động fallback in console nếu chưa cấu hình SMTP)
        emailService.sendOtpEmail(email, otp);

        return "Mã xác thực OTP đã được gửi thành công!";
    }

    // Xác thực OTP và đặt lại mật khẩu mới
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail();
        OtpData cachedOtp = otpCache.get(email);

        if (cachedOtp == null) {
            throw new RuntimeException("Mã OTP không tồn tại hoặc yêu cầu chưa được khởi tạo!");
        }

        if (cachedOtp.isExpired()) {
            otpCache.remove(email);
            throw new RuntimeException("Mã OTP đã hết hạn sử dụng! Vui lòng gửi lại yêu cầu.");
        }

        if (!cachedOtp.getCode().equals(request.getOtp())) {
            throw new RuntimeException("Mã OTP xác thực không chính xác!");
        }

        // OTP hợp lệ, tiến hành cập nhật mật khẩu mới băm BCrypt
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa mã OTP khỏi cache sau khi đổi thành công
        otpCache.remove(email);

        return "Đặt lại mật khẩu mới thành công!";
    }

    // Lấy danh sách tất cả người dùng (Chỉ dành cho Admin)
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Lấy thông tin tài khoản hoàn chỉnh (bao gồm profile chi tiết)
    @Transactional(readOnly = true)
    public ProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        ProfileDto.ProfileDtoBuilder builder = ProfileDto.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .dob(user.getDob())
                .role(user.getRole().name())
                .isVerified(user.getIsVerified());

        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findById(userId).ifPresent(p -> {
                builder.grade(p.getGrade());
                builder.school(p.getSchool());
                builder.learningGoals(p.getLearningGoals());
            });
        } else if (user.getRole() == Role.TUTOR) {
            tutorProfileRepository.findById(userId).ifPresent(p -> {
                builder.qualifications(p.getQualifications());
                builder.experience(p.getExperience());
                builder.hourlyRate(p.getHourlyRate());
                builder.subjects(p.getSubjects());
                builder.citizenCard(p.getCitizenCard());
                builder.university(p.getUniversity());
                builder.duration(p.getDuration());
                builder.certificates(p.getCertificates());
                builder.status(p.getStatus());
                builder.rejectReason(p.getRejectReason());
            });
        }

        return builder.build();
    }

    // Cập nhật thông tin tài khoản hoàn chỉnh (bao gồm profile chi tiết)
    @Transactional
    public ProfileDto updateProfile(Long userId, ProfileDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        // Validate basic profile info
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Họ và tên không được để trống!");
        }
        if (request.getFullName().trim().length() < 2) {
            throw new RuntimeException("Họ và tên phải chứa ít nhất 2 ký tự!");
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            if (!request.getPhone().trim().matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
                throw new RuntimeException("Số điện thoại không đúng định dạng Việt Nam (phải gồm 10 chữ số)!");
            }
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setDob(request.getDob());
        userRepository.save(user);

        if (user.getRole() == Role.STUDENT) {
            StudentProfile profile = studentProfileRepository.findById(userId)
                    .orElseGet(() -> StudentProfile.builder().userId(userId).build());
            profile.setGrade(request.getGrade() != null ? request.getGrade().trim() : "");
            profile.setSchool(request.getSchool() != null ? request.getSchool().trim() : "");
            profile.setLearningGoals(request.getLearningGoals() != null ? request.getLearningGoals().trim() : "");
            studentProfileRepository.save(profile);
        } else if (user.getRole() == Role.TUTOR) {
            TutorProfile profile = tutorProfileRepository.findById(userId)
                    .orElseGet(() -> TutorProfile.builder().userId(userId).build());
            
            // Nếu hồ sơ đang bị từ chối duyệt, khi gia sư chỉnh sửa và lưu lại, chúng ta
            // tự động chuyển trạng thái về NOT_SUBMITTED để họ có thể gửi duyệt lại sau đó.
            if ("REJECTED".equals(profile.getStatus())) {
                profile.setStatus("NOT_SUBMITTED");
                profile.setRejectReason(null);
            }

            profile.setQualifications(request.getQualifications() != null ? request.getQualifications().trim() : "");
            profile.setExperience(request.getExperience() != null ? request.getExperience().trim() : "");
            profile.setHourlyRate(request.getHourlyRate() != null ? request.getHourlyRate() : java.math.BigDecimal.ZERO);
            profile.setSubjects(request.getSubjects() != null ? request.getSubjects().trim() : "");
            profile.setCitizenCard(request.getCitizenCard() != null ? request.getCitizenCard().trim() : "");
            profile.setUniversity(request.getUniversity() != null ? request.getUniversity().trim() : "");
            profile.setDuration(request.getDuration() != null ? request.getDuration().trim() : "90 phút");
            profile.setCertificates(request.getCertificates()); // Cập nhật danh sách bằng cấp chứng chỉ
            
            tutorProfileRepository.save(profile);
        }

        return getProfile(userId);
    }

    // Phê duyệt hoặc khóa tài khoản thành viên (Chỉ dành cho Admin)
    @Transactional
    public User toggleVerifyUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        
        // Đảo ngược trạng thái kích hoạt
        boolean currentStatus = user.getIsVerified() != null ? user.getIsVerified() : false;
        user.setIsVerified(!currentStatus);
        
        return userRepository.save(user);
    }

    // Gia sư gửi hồ sơ yêu cầu phê duyệt chuyên môn
    @Transactional
    public String submitReview(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
        TutorProfile profile = tutorProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Hồ sơ gia sư không tồn tại!"));

        // 1. Kiểm tra thông tin cơ bản của User
        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Họ và tên không được để trống!");
        }
        if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Số điện thoại liên lạc không được để trống!");
        }
        if (!user.getPhone().trim().matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
            throw new RuntimeException("Số điện thoại không đúng định dạng (phải gồm 10 chữ số)!");
        }

        // 2. Kiểm tra thông tin chuyên môn của TutorProfile
        if (profile.getQualifications() == null || profile.getQualifications().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn trình độ học vấn cao nhất!");
        }
        if (profile.getUniversity() == null || profile.getUniversity().trim().isEmpty()) {
            throw new RuntimeException("Trường đại học đào tạo không được để trống!");
        }
        if (profile.getCitizenCard() == null || profile.getCitizenCard().trim().isEmpty()) {
            throw new RuntimeException("Số căn cước công dân (CCCD) không được để trống!");
        }
        if (!profile.getCitizenCard().trim().matches("^[0-9]{12}$")) {
            throw new RuntimeException("Số CCCD không hợp lệ (phải đúng 12 chữ số)!");
        }
        if (profile.getSubjects() == null || profile.getSubjects().trim().isEmpty()) {
            throw new RuntimeException("Môn học giảng dạy không được để trống!");
        }
        if (profile.getHourlyRate() == null || profile.getHourlyRate().compareTo(new java.math.BigDecimal("10000")) < 0) {
            throw new RuntimeException("Học phí thù lao mong muốn không hợp lệ (tối thiểu từ 10.000đ trở lên)!");
        }
        if (profile.getExperience() == null || profile.getExperience().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập giới thiệu bản thân và kinh nghiệm giảng dạy!");
        }

        // 3. Kiểm tra bằng cấp chứng chỉ đính kèm
        if (profile.getCertificates() == null || profile.getCertificates().trim().isEmpty() || profile.getCertificates().trim().equals("[]")) {
            throw new RuntimeException("Vui lòng tải lên ít nhất một tài liệu bằng cấp hoặc chứng chỉ chuyên môn để Ban quản trị phê duyệt!");
        }

        // Cập nhật trạng thái
        profile.setStatus("PENDING");
        profile.setRejectReason(null);
        tutorProfileRepository.save(profile);

        return "Gửi yêu cầu phê duyệt hồ sơ gia sư thành công! Hệ thống đã ghi nhận hồ sơ và sẽ duyệt trong thời gian sớm nhất.";
    }

    // Admin lấy danh sách các gia sư đang chờ duyệt hồ sơ chuyên môn
    @Transactional(readOnly = true)
    public List<TutorProfile> getPendingTutors() {
        return tutorProfileRepository.findByStatus("PENDING");
    }

    // Admin phê duyệt hồ sơ gia sư
    @Transactional
    public void approveTutorProfile(Long userId) {
        TutorProfile profile = tutorProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Hồ sơ gia sư không tồn tại!"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        profile.setStatus("APPROVED");
        profile.setRejectReason(null);
        tutorProfileRepository.save(profile);

        // Kích hoạt tài khoản tham gia chính thức
        user.setIsVerified(true);
        userRepository.save(user);
    }

    // Admin từ chối phê duyệt hồ sơ gia sư và gửi kèm lý do
    @Transactional
    public void rejectTutorProfile(Long userId, String reason) {
        TutorProfile profile = tutorProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Hồ sơ gia sư không tồn tại!"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng cung cấp lý do từ chối cụ thể để phản hồi cho gia sư sửa đổi hồ sơ!");
        }

        profile.setStatus("REJECTED");
        profile.setRejectReason(reason.trim());
        tutorProfileRepository.save(profile);

        // Giữ tài khoản ở trạng thái chưa kích hoạt
        user.setIsVerified(false);
        userRepository.save(user);
    }

    // Lấy danh sách gia sư đã phê duyệt công khai kèm profile
    public List<ProfileDto> getActiveTutors() {
        List<User> allUsers = userRepository.findAll();
        List<ProfileDto> activeTutors = new java.util.ArrayList<>();
        for (User u : allUsers) {
            if (u.getRole() == Role.TUTOR && (u.getIsVerified() != null && u.getIsVerified())) {
                try {
                    ProfileDto dto = getProfile(u.getId());
                    activeTutors.add(dto);
                } catch (Exception e) {
                    // Bỏ qua nếu có lỗi nạp profile
                }
            }
        }
        return activeTutors;
    }
}
