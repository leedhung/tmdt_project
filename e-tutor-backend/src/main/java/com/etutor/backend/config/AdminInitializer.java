package com.etutor.backend.config;

import com.etutor.backend.model.Role;
import com.etutor.backend.model.User;
import com.etutor.backend.model.Wallet;
import com.etutor.backend.repository.UserRepository;
import com.etutor.backend.repository.WalletRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(UserRepository userRepository,
                            WalletRepository walletRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByEmail("admin@etutor.com").ifPresentOrElse(
            user -> {
                // Đảm bảo mật khẩu của admin@etutor.com là "admin123" được mã hóa chuẩn bằng encoder hiện tại
                user.setPassword(passwordEncoder.encode("admin123"));
                user.setIsVerified(true);
                user.setRole(Role.ADMIN);
                userRepository.save(user);
                System.out.println("[AdminInitializer] Da reset mat khau cho admin@etutor.com thanh 'admin123' thanh cong!");
            },
            () -> {
                // Tạo mới nếu chưa tồn tại
                User admin = User.builder()
                        .email("admin@etutor.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .fullName("Hệ Thống Admin")
                        .isVerified(true)
                        .build();
                User saved = userRepository.save(admin);
                
                // Khởi tạo ví cho Admin
                if (walletRepository.findByUserId(saved.getId()).isEmpty()) {
                    Wallet wallet = Wallet.builder()
                            .userId(saved.getId())
                            .balance(BigDecimal.ZERO)
                            .frozenBalance(BigDecimal.ZERO)
                            .build();
                    walletRepository.save(wallet);
                }
                System.out.println("[AdminInitializer] Da tao moi tai khoan admin@etutor.com voi mat khau 'admin123'!");
            }
        );
    }
}
