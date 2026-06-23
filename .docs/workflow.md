Luồng hoạt động (Workflow) chi tiết của từng chức năng
Chức năng 1: Đăng ký & Xét duyệt Hồ sơ Gia sư
Luồng này đảm bảo chất lượng đầu vào của gia sư nhằm tạo uy tín cho nền tảng.
•	Bước 1: Người dùng chọn đăng ký làm Gia sư $\rightarrow$ Điền thông tin cá nhân, cập nhật bằng cấp, chứng chỉ, căn cước công dân (CCCD) và chọn môn học/học phí mong muốn.
•	Bước 2: Tài khoản gia sư ở trạng thái Chờ duyệt (Pending). Lúc này gia sư chưa thể nhận lớp.
•	Bước 3: Admin nhận thông báo, vào kiểm tra tính xác thực của bằng cấp/CCCD.
o	Nếu hợp lệ: Admin duyệt $\rightarrow$ Trạng thái thành Đang hoạt động (Active). Hệ thống gửi email chúc mừng. Hồ sơ gia sư hiển thị công khai.
o	Nếu không hợp lệ: Admin từ chối + nhập lý do $\rightarrow$ Hệ thống gửi email yêu cầu cập nhật lại.

Chức năng 2: Tìm kiếm & Đăng ký / Nhận lớp (Kết nối)
Luồng này xử lý việc kết nối giữa Học viên và Gia sư. Ta sẽ đi theo luồng Học viên chủ động đăng bài tìm gia sư (Phổ biến nhất):
•	Bước 1: Học viên tạo một "Yêu cầu tìm gia sư" (Môn học, Hình thức: Online, Lịch rảnh, Học phí dự kiến, Yêu cầu khác).
•	Bước 2: Admin duyệt yêu cầu $\rightarrow$ Bài đăng xuất hiện trên "Danh sách lớp đang tìm gia sư".
•	Bước 3: Các Gia sư phù hợp thấy lớp $\rightarrow$ Ấn nút Ứng tuyển.
•	Bước 4: Học viên xem danh sách các gia sư đã ứng tuyển (Xem hồ sơ, đánh giá của họ) $\rightarrow$ Ấn Chọn gia sư này.
•	Bước 5: Hệ thống chuyển lớp học sang trạng thái Chờ thanh toán.

Chức năng 3: Thanh toán & Giữ tiền (Escrow)
Để bảo vệ quyền lợi hai bên, hệ thống đóng vai trò trung gian giữ tiền.
•	Bước 1: Học viên nhận thông báo gia sư đã xác nhận $\rightarrow$ Tiến hành Thanh toán tiền học (Ví dụ: Thanh toán cho 10 buổi đầu tiên) qua ngân hàng hoặc ví điện tử.
•	Bước 2: Hệ thống xác nhận đã nhận tiền $\rightarrow$ Chuyển trạng thái lớp học thành Đang tiến hành (In Progress). Lúc này thông tin liên lạc (SĐT) của 2 bên mới được mở hoàn toàn.
•	Bước 3: Tiền của học viên nằm ở tài khoản đóng băng của hệ thống (chưa chuyển cho gia sư).
Chức năng 4: Gia sư chủ động đăng bài tìm kiếm học viên
•  Bước 1 (Gia sư tạo bài): Gia sư vào trang quản lý $\rightarrow$ Chọn Tạo bài đăng tuyển học viên $\rightarrow$ Điền đầy đủ thông tin khóa học, lịch học, học phí $\rightarrow$ Nhấn Đăng bài.
•  Bước 2 (Admin kiểm duyệt): Bài viết chuyển sang trạng thái Chờ duyệt. Admin kiểm tra nội dung xem có phù hợp, có đúng quy định của trang web không $\rightarrow$ Phê duyệt $\rightarrow$ Bài viết hiển thị công khai trên "Danh sách khóa học/Lớp học mở sẵn".
•  Bước 3 (Học viên tìm kiếm và Đăng ký): * Học viên vào trang chủ, sử dụng bộ lọc (Môn, học phí, lịch rảnh) $\rightarrow$ Tìm thấy bài đăng của Gia sư.
•	Học viên xem hồ sơ gia sư, đánh giá cũ $\rightarrow$ Nhấn nút Đăng ký học.
•  Bước 4 (Thanh toán giữ chỗ): Hệ thống chuyển học viên đến trang Thanh toán. Học viên hoàn tất thanh toán tiền học cho hệ thống $\rightarrow$ Hệ thống ghi nhận học viên đã đặt chỗ thành công và thông báo cho Gia sư.
•  Bước 5 (Kích hoạt lớp): * Nếu là lớp 1 kèm 1: Lớp học chuyển sang trạng thái Đang tiến hành ngay lập tức.
•	Nếu là lớp nhóm (ví dụ tối đa 5 người): Khi đủ số lượng học viên thanh toán hoặc đến ngày khai giảng dự kiến, hệ thống sẽ tự động chốt danh sách và kích hoạt lớp học, gửi toàn bộ thời khóa biểu cho Gia sư và các Học viên.

Chức năng 5: Tổ chức Phòng học Online (Tính năng mới thêm)
Đây là luồng vận hành tự động theo thời gian thực (Real-time).
•	Bước 1: Dựa trên lịch học đã chốt, trước giờ học 15 phút, hệ thống tự động chạy một lệnh ngầm (Cronjob) để khởi tạo phòng học (gọi API Zoom/Google Meet/WebRTC) và gửi thông báo nhắc nhở cho cả 2 bên.
•	Bước 2: Gia sư và Học viên vào trang cá nhân $\rightarrow$ Ấn nút Vào phòng học.
•	Bước 3 (Điểm danh tự động): Hệ thống ghi nhận thời gian bấm nút của cả 2 bên để lưu log. Trong phòng học, họ sử dụng video, mic, share màn hình và bảng trắng để dạy học.
•	Bước 4 (Kết thúc): Sau khi hết giờ, phòng tự động đóng. Hệ thống ghi lại file Record (nếu có) và gửi thông báo yêu cầu học viên: Xác nhận buổi học hôm nay đã hoàn thành.

Chức năng 6: Giải ngân / Hoàn tiền & Đánh giá
Xử lý sau khi kết thúc một giai đoạn học hoặc khi có tranh chấp.
•	Kịch bản học tập suôn sẻ:
o	Học viên xác nhận học đủ số buổi $\rightarrow$ Hệ thống tự động trừ phí hoa hồng của trung tâm (ví dụ 15%) $\rightarrow$ Chuyển số tiền còn lại vào Ví của Gia sư. Gia sư có thể thực hiện lệnh Rút tiền về tài khoản ngân hàng của mình.
o	Học viên tiến hành Đánh giá (Review) & Chấm điểm sao cho gia sư. Đánh giá này sẽ hiển thị trên profile gia sư.
•	Kịch bản xảy ra Khiếu nại (Dispute):
o	Học viên thấy gia sư dạy không đạt chất lượng/bùng lịch $\rightarrow$ Ấn Khiếu nại + Gửi minh chứng.
o	Admin vào can thiệp, kiểm tra lịch sử phòng học online (log ra/vào phòng, xem lại video ghi hình buổi học).
o	Admin đưa ra phán quyết: Nếu lỗi do gia sư $\rightarrow$ Thực hiện lệnh Hoàn tiền (hoặc cấp voucher) lại cho Học viên dựa theo số buổi chưa học, đồng thời trừ điểm uy tín hoặc khóa tài khoản gia sư.

