-- Script khởi tạo cấu trúc cơ sở dữ liệu E-Tutor Platform
CREATE DATABASE IF NOT EXISTS etutor_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE etutor_db;

-- 1. Bảng Users (Tài khoản dùng chung cho 3 vai trò)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'TUTOR', 'STUDENT') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE, -- Dành cho Gia sư (chờ Admin duyệt)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng Hồ sơ Gia sư (Tutor Profiles)
CREATE TABLE IF NOT EXISTS tutor_profiles (
    user_id BIGINT PRIMARY KEY,
    qualifications TEXT,               -- Bằng cấp, chứng chỉ dạng text hoặc JSON
    experience TEXT,                   -- Kinh nghiệm giảng dạy
    hourly_rate DECIMAL(12, 2) DEFAULT 0.00, -- Học phí mong muốn theo giờ
    subjects VARCHAR(255),             -- Môn học giảng dạy (cách nhau bởi dấu phẩy)
    citizen_card VARCHAR(50),          -- Số CCCD
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Bảng Hồ sơ Học viên (Student Profiles)
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id BIGINT PRIMARY KEY,
    grade VARCHAR(50),                 -- Lớp học (Ví dụ: Lớp 10, Lớp 12, Đại học)
    learning_goals TEXT,               -- Mục tiêu học tập
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Bảng Ví tiền (Wallets - Dùng cho luồng giữ tiền trung gian Escrow)
CREATE TABLE IF NOT EXISTS wallets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,         -- Số dư khả dụng (có thể rút hoặc nạp)
    frozen_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,  -- Số dư bị đóng băng khi mua khóa học
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Bảng Lịch sử Giao dịch (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('DEPOSIT', 'WITHDRAW', 'LOCK', 'UNLOCK') NOT NULL, -- LOCK: Đóng băng học phí, UNLOCK: Giải ngân/hoàn trả
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING' NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Bảng Lớp học (Classes)
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT,
    tutor_id BIGINT,                                         -- Có thể NULL khi học viên đăng bài tuyển gia sư
    title VARCHAR(150) NOT NULL,
    description TEXT,
    subject VARCHAR(100),                                    -- Môn học (VD: Toán, Lý, Tiếng Anh)
    grade_level VARCHAR(50),                                 -- Cấp lớp (VD: Lớp 10, Đại học)
    student_gender ENUM('MALE', 'FEMALE', 'OTHER'),          -- Giới tính học viên
    student_details TEXT,                                    -- Đặc điểm, học lực của học viên
    tutor_requirements TEXT,                                 -- Yêu cầu đối với gia sư
    learning_mode ENUM('ONLINE', 'OFFLINE') DEFAULT 'ONLINE',-- Hình thức học
    address VARCHAR(255),                                    -- Địa chỉ nếu học offline
    hourly_rate DECIMAL(12, 2) NOT NULL,
    total_lessons INT NOT NULL,                              -- Tổng số buổi học đăng ký
    schedule_config TEXT NOT NULL,                           -- Định dạng chuỗi JSON cấu hình thứ, giờ học cố định
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL' NOT NULL,  -- PENDING_APPROVAL, REJECTED, FINDING_TUTOR, WAITING_PAYMENT, ACTIVATED, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Bảng Chi tiết từng Buổi học (Lessons)
CREATE TABLE IF NOT EXISTS lessons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT NOT NULL,
    lesson_number INT NOT NULL,                             -- Buổi số mấy (ví dụ từ 1 đến 10)
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'UPCOMING' NOT NULL,         -- UPCOMING, ONGOING, PENDING_CONFIRM, COMPLETED, DISPUTED
    meeting_link VARCHAR(255),                              -- Link phòng học trực tuyến (Zoom, Meet, Jitsi)
    recording_link VARCHAR(255),                            -- Link video ghi hình
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Chèn dữ liệu mẫu cho tài khoản Admin mặc định (mật khẩu mặc định: 'admin123' - sẽ được BCrypt mã hóa)
-- Ở đây chèn mật khẩu thô dạng $2a$10$f/LhMv7C5Fv5Gep0o00tXe.g4j59.w9t9yX.Rj36DuxlGqRlyvF7G (Mã hóa BCrypt của admin123)
INSERT INTO users (email, password, role, full_name, is_verified) 
VALUES ('admin@etutor.com', '$2a$10$f/LhMv7C5Fv5Gep0o00tXe.g4j59.w9t9yX.Rj36DuxlGqRlyvF7G', 'ADMIN', 'Hệ Thống Admin', TRUE)
ON DUPLICATE KEY UPDATE email=email;
