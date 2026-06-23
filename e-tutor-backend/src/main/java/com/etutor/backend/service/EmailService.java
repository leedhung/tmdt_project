package com.etutor.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Gửi mã OTP xác thực đổi mật khẩu
    public void sendOtpEmail(String recipientEmail, String otpCode) {
        String subject = "GiaSuHome - Mã xác thực OTP khôi phục mật khẩu";
        String content = "Chào bạn,\n\n"
                + "Bạn vừa gửi yêu cầu khôi phục mật khẩu tại GiaSuHome.\n"
                + "Mã OTP xác thực của bạn là: " + otpCode + "\n"
                + "Mã OTP này có thời hạn sử dụng là 5 phút.\n\n"
                + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ GiaSuHome.";

        // THỰC HIỆN LOG MÃ OTP RA CONSOLE TRƯỚC ĐỂ LUÔN CÓ MÃ TEST KHI CHƯA CÓ SMTP THẬT
        System.out.println("====================================================================");
        System.out.println("   [DEVELOPMENT LOG] GIA SU HOME - EMAIL OTP SIMULATOR");
        System.out.println("   Người nhận: " + recipientEmail);
        System.out.println("   Mã OTP 6 số: " + otpCode);
        System.out.println("====================================================================");
        log.info("Đã giả lập gửi thành công OTP [{}] tới email [{}] ra Console.", otpCode, recipientEmail);

        // Nếu thông tin cấu hình hòm thư trống, chỉ in log và không nỗ lực gửi email thật
        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            log.info("Cấu hình Email SMTP trống. Chạy ở chế độ Giả lập thành công.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Đã gửi email thật chứa mã OTP tới hòm thư: {}", recipientEmail);
        } catch (Exception ex) {
            log.warn("Không thể gửi email thật qua SMTP (Lỗi: {}). Fallback chạy giả lập thành công.", ex.getMessage());
        }
    }
}
