TỔNG QUAN DỰ ÁN: WEBSITE THUÊ GIA SƯ VÀ HỌC TRỰC TUYẾN (E-TUTOR PLATFORM)
1. Giới thiệu dự án (Introduction)
Dự án nhằm xây dựng một nền tảng công nghệ dạng Marketplace (Chợ kết nối) kết hợp E-learning (Học trực tuyến), giúp kết nối trực tiếp giữa Học viên có nhu cầu bổ sung kiến thức và Gia sư có năng lực chuyên môn.

Khác với các trung tâm gia sư truyền thống, hệ thống này tối ưu hóa quy trình kết nối thông qua hai chiều (Học viên đăng tin tìm gia sư / Gia sư đăng bài mở lớp), tích hợp phòng học trực tuyến tương tác thời gian thực và áp dụng cơ chế thanh toán trung gian bảo mật (Escrow) để bảo vệ quyền lợi tài chính cho cả hai bên.

2. Mục tiêu dự án (Project Objectives)
Giải quyết rào cản địa lý: Tích hợp tính năng học Online (Video Call, Bảng trắng) cho phép học viên và gia sư ở các tỉnh thành khác nhau vẫn có thể tương tác.

Minh bạch hóa chất lượng: Hệ thống kiểm duyệt hồ sơ bằng cấp chặt chẽ từ Admin và cơ chế đánh giá (Review/Rating) công khai sau mỗi khóa học.

Đảm bảo an toàn tài chính: Tích hợp hệ thống Ví điện tử nền tảng, tự động đóng băng học phí và giải ngân theo từng buổi học hoặc hoàn tiền khi có tranh chấp/khiếu nại.

Tối ưu hóa hiệu suất làm việc nhóm: Xây dựng trên kiến trúc mô-đun hóa độc lập (Modular) giúp đội ngũ phát triển (3 người) có thể code song song, dễ dàng bảo trì và mở rộng nâng cấp.

3. Kiến trúc tổng thể & Đối tượng người dùng (Actors)
Hệ thống được vận hành xoay quanh 3 Tác nhân chính (Actors):

Học viên (Student): Tìm kiếm gia sư, đăng bài tuyển gia sư, nạp tiền, thanh toán lớp học, tham gia phòng học online, xác nhận hoàn thành và đánh giá gia sư.

Gia sư (Tutor): Đăng ký thông tin, cập nhật bằng cấp/CCCD, ứng tuyển vào các lớp học, tự tạo khóa học tuyển học viên, trực tiếp giảng dạy qua phòng học trực tuyến và rút tiền thù lao.

Quản trị viên (Admin): Kiểm duyệt hồ sơ gia sư, phê duyệt bài đăng lớp học, cấu hình hệ thống (mã giảm giá, hoa hồng) và đứng ra giải quyết các khiếu nại/tranh chấp tài chính.

4. Các Phân hệ Tính năng Chính (Core Modules)
Hệ thống được chia thành 3 phân hệ độc lập tương ứng với lộ trình phát triển của 3 thành viên:

                  [ MODULE BASE: Auth, JWT, Database Schema, Wallet Core ]
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         ▼                                   ▼                                   ▼
[Module 1: Admin & Profile]       [Module 2: Marketplace]          [Module 3: E-Learning & Finance]
 - Quản lý thông tin cá nhân       - Học viên đăng tin tìm gia sư   - Giả lập/Tích hợp thanh toán
 - Upload bằng cấp, chứng chỉ      - Gia sư đăng khóa học mở sẵn    - Tự động tính toán rải lịch học
 - Dashboard Admin duyệt hồ sơ     - Bộ lọc tìm kiếm thông minh     - Tự động tạo phòng học Online
 - Khóa/Mở tài khoản người dùng    - Luồng ứng tuyển & chốt lớp     - Điểm danh, Xác nhận, Giải ngân
Phân hệ 1: Quản trị & Hồ sơ cá nhân (Admin & Profile Subsystem)

Trọng tâm: Quản lý vòng đời tài khoản, xác thực thông tin đầu vào nhằm tạo dựng uy tín cho nền tảng.

Phân hệ 2: Chợ kết nối & Điều phối lớp (Marketplace Subsystem)

Trọng tâm: Xử lý các thuật toán tìm kiếm, bộ lọc nâng cao (môn học, học phí, lịch rảnh) và luồng kết nối cung - cầu trước khi lớp học bắt đầu.

Phân hệ 3: Lớp học trực tuyến & Quản lý Tài chính (E-Learning & Finance Subsystem)

Trọng tâm: Vận hành real-time các buổi học trực tuyến (Tích hợp API họp video), điểm danh check-in/check-out tự động và kiểm soát dòng tiền dòng tiền đóng băng/hoàn trả một cách an toàn.

5. Kế hoạch Công nghệ dự kiến (Technology Stack)
Backend: Java Spring Boot / NodeJS (Express hoặc NestJS) / .NET Core. (Sử dụng kiến trúc RESTful API, mã hóa mật khẩu BCrypt, bảo mật tầng API bằng JWT).

Frontend: ReactJS / VueJS hoặc Flutter (nếu làm ứng dụng di động).

Database: MySQL hoặc PostgreSQL (Hệ quản trị cơ sở dữ liệu quan hệ giúp đảm bảo tính toàn vẹn dữ liệu giao dịch tài chính).

Third-party APIs: Zoom API / Google Meet API / Jitsi (Phòng học trực tuyến); VNPay / MoMo (Cổng thanh toán); Cloudinary / AWS S3 (Lưu trữ hình ảnh bằng cấp, tài liệu