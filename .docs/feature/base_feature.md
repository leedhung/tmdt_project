1.1. Module Xác thực & Phân quyền (Authentication & Authorization)
Cục này giải quyết bài toán: Tạo tài khoản, Đăng nhập, Nhận diện ai là ai và Bảo mật.
Các chức năng/API cần code xong ở phần Base:
•	Đăng ký tài khoản (3 Role): * API nhận vào dữ liệu và tạo User với vai trò tương ứng: Học viên (chưa cần điền profile học), Gia sư (ở trạng thái chờ duyệt, chưa được hiển thị), và tài khoản Admin tạo sẵn trong DB.
•	Đăng nhập đa phương thức:
o	API Đăng nhập bằng Email + Mật khẩu (Mật khẩu bắt buộc phải mã hóa bằng BCrypt trước khi lưu vào DB).
o	API/Cơ chế Đăng nhập bằng Google / Facebook (Nhận Token từ Google, kiểm tra nếu Email chưa có trong hệ thống thì tự động tạo tài khoản mới với Role mặc định là Học viên).
•	Quản lý mật khẩu:
o	Chức năng Đổi mật khẩu (khi đã đăng nhập).
o	API Quên/Lấy lại mật khẩu (Gửi mã OTP hoặc link reset qua Email).
•	Cơ chế Token (JWT):
o	Khi đăng nhập thành công, trả về AccessToken (hết hạn sau 1 tiếng) và RefreshToken (dùng để lấy lại AccessToken mới mà không bắt người dùng đăng nhập lại).
•	Chặn và Phân quyền API (Interceptor / Middleware):
o	Viết cấu hình để chặn truy cập. Ví dụ: Đường dẫn bắt đầu bằng /api/v1/admin/* thì chỉ có Token của Admin mới vào được, /api/v1/tutor/* thì chỉ Gia sư vào được.
1.2. Bộ khung Lớp học & Buổi học (Class & Lesson Schema)
Cục này giải quyết bài toán: Tạo ra bộ khung dữ liệu mẫu để ai cũng có chỗ để đọc/ghi mà không làm lệch cấu trúc của nhau.
Các chức năng/API cần code xong ở phần Base:
•	Tạo cấu trúc bảng dữ liệu (Entity/Table Mapping): Tạo sẵn các bảng trong Database với các mối quan hệ (Relationship):
o	Bảng Lớp học (Nối với ID Học viên, ID Gia sư, chứa trạng thái ClassStatus).
o	Bảng Buổi học (Nối với ID Lớp học, chứa trạng thái LessonStatus, Link phòng, Link video).
•	API CRUD cơ bản cho Lớp học (Dạng thô):
o	API tạo một Lớp học mới (Mặc định chuyển trạng thái về PENDING_APPROVAL).
o	API thay đổi trạng thái Lớp học (Dùng chung cho cả 3 người).
•	Hàm tiện ích tự động rải lịch (Schedule Generator):
o	Viết sẵn logic: Khi truyền vào Ngày bắt đầu, Số buổi học (ví dụ 12 buổi) và Lịch cố định (Thứ 2 - Thứ 4 từ 19h-21h), hệ thống tự động tính ra chính xác ngày giờ của 12 buổi học đó để chuẩn bị lưu vào bảng Buổi học.
1.3. Module Ví tiền & Giao dịch nền tảng (Wallet & Transaction)
Cục này giải quyết bài toán: Nạp tiền, Rút tiền, Đóng băng tiền khi mua khóa học và Giải ngân khi học xong.
Các chức năng/API cần code xong ở phần Base:
•	Tự động tạo Ví khi đăng ký: * Viết logic ngầm: Bất kỳ khi nào một tài khoản Học viên hoặc Gia sư được tạo thành công ở module 1.1, hệ thống phải tự động tạo kèm cho họ một bản ghi trong bảng Wallet với số dư ban đầu bằng 0.
•	API Nạp tiền (Deposit):
o	Tạo API giả lập nạp tiền (hoặc tích hợp cổng thanh toán như VNPay/Momo) để Học viên nạp tiền vào Ví của họ nhằm tăng balance.
•	API Rút tiền (Withdraw):
o	Tạo API cho phép Gia sư tạo yêu cầu rút tiền từ Ví về tài khoản ngân hàng thực tế (Trừ vào balance).
•	Hàm Đóng băng tiền (Freeze Balance):
o	Viết hàm logic: Khi học viên bấm mua lớp, hệ thống trừ tiền ở cột balance (Số dư khả dụng) và cộng tiền đó vào cột frozen_balance (Số dư bị đóng băng).
•	Hàm Giải ngân / Hoàn tiền (Unfreeze/Refund Balance):
o	Hàm giải ngân: Trừ tiền ở frozen_balance của Học viên $\rightarrow$ Trừ phí hoa hồng sàn $\rightarrow$ Cộng tiền vào balance của Gia sư.
o	Hàm hoàn tiền: Trừ tiền ở frozen_balance của Học viên $\rightarrow$ Cộng ngược lại vào balance của Học viên.
Tổng kết kịch bản sau khi làm xong Base:
Khi code xong toàn bộ danh sách trên, 3 thành viên sẽ có một bệ phóng cực kỳ rõ ràng để làm việc độc lập:
1.	Người 1 (Hồ sơ & Admin): Chỉ cần lấy dữ liệu User có sẵn từ module 1.1, viết thêm các trường như "Bằng cấp", "Kinh nghiệm" để làm chức năng Duyệt gia sư.
2.	Người 2 (Đăng bài & Kết nối): Gọi API tạo lớp ở module 1.2 (Lúc này lớp có trạng thái PENDING_APPROVAL), làm giao diện cho Admin bấm duyệt để đổi trạng thái lớp thành FINDING_TUTOR.
3.	Người 3 (Học Online & Tiền bạc): Gọi hàm Đóng băng tiền ở module 1.3 khi học viên chọn được gia sư $\rightarrow$ Gọi hàm Tự động rải lịch ở module 1.2 để sinh ra các buổi học trực tuyến $\rightarrow$ Khi học xong thì gọi hàm Giải ngân để chuyển tiền cho gia sư.
Tất cả các hàm lõi đã có sẵn, mỗi người chỉ cần lắp ghép chúng vào luồng giao diện của mình là hoàn thành dự án!

