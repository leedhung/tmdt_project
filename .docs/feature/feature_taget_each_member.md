1. Các Chức năng cơ bản dùng chung (Phải làm trước khi chia ca)
Cả nhóm (hoặc Leader) nên dành ra 2-3 ngày để hoàn thiện cục Shared Core này. Một khi cục này đã lên GitHub, 3 người chỉ việc kéo về và phát triển nhánh riêng của mình.
1.1. Module Xác thực & Phân quyền (Authentication & Authorization)
Đây là phần cốt lõi nhất. Cả 3 tính năng của 3 người đều cần biết "Ai đang gọi API này? Họ là Học viên, Gia sư hay Admin?".
•	Giải pháp độc lập: Cài đặt sẵn JWT (JSON Web Token).
•	Sau khi làm xong, hệ thống sẽ cung cấp một hàm/annotation dùng chung (Ví dụ trong Backend: @CurrentUser hoặc SecurityContextHolder). Khi Thành viên 3 làm chức năng "Vào phòng học", bạn đó chỉ cần gọi hàm này là lấy được ID của học viên đang đăng nhập, không cần quan tâm giao diện Đăng nhập trông như thế nào.
1.2. Bộ khung Quản lý Trạng thái Lớp học (State Machine / Enums)
Cả 3 thành viên đều sẽ tương tác với thực thể Lớp học (Class) và Buổi học (Lesson) nhưng ở các giai đoạn khác nhau. Do đó, cần định nghĩa sẵn bộ các Trạng thái (Enums) dùng chung trong Database và Mã nguồn.
•	Quy định sẵn các Enum:
o	ClassStatus: PENDING_APPROVAL (Chờ duyệt), REJECTED (Bị từ chối), FINDING_TUTOR (Đang tìm gia sư), WAITING_PAYMENT (Chờ thanh toán), ACTIVATED (Đang tiến hành), COMPLETED (Hoàn thành).
o	LessonStatus: UPCOMING (Sắp diễn ra), ONGOING (Đang học), PENDING_CONFIRM (Chờ xác nhận), COMPLETED (Đã học xong), DISPUTED (Tranh chấp).
•	Khi đã có bộ Enum này, Thành viên 2 cứ tự do viết code chuyển trạng thái từ PENDING_APPROVAL sang FINDING_TUTOR, còn Thành viên 3 tự do viết code chuyển từ WAITING_PAYMENT sang ACTIVATED mà không bị lệch logic.
1.3. Module Ví tiền & Giao dịch nền tảng (Wallet & Transaction Base)
Vì Thành viên 2 (Đăng ký lớp) cần tạo yêu cầu thanh toán, còn Thành viên 3 (Học online xong) cần giải ngân tiền, nên cấu trúc bảng dữ liệu số dư và lịch sử giao dịch phải được thống nhất trước.
•	Thiết kế sẵn bảng Wallet (id, user_id, balance, frozen_balance) và bảng Transaction (id, wallet_id, amount, type [DEPOSIT, WITHDRAW, LOCK, UNLOCK], status).
2. Bản kế hoạch chia tách 3 Cụm chức năng độc lập hoàn toàn
Sau khi đã có 3 phần dùng chung ở trên, hệ thống sẽ được chia thành 3 Module riêng biệt, nằm ở 3 thư mục (Folder/Package) khác nhau trong source code. 3 người sẽ làm việc trên 3 file/thư mục này nên không bao giờ lo bị xung đột (conflict) code.
🏢 Người 1: Module Quản trị & Xét duyệt (Admin & Profile Subsystem)
Người này tập trung vào luồng "Đầu vào" của hệ thống và trang quản lý của Admin.
•	Các chức năng độc lập cần viết:
o	API/Giao diện cập nhật hồ sơ Gia sư (Upload bằng cấp, CCCD, thông tin cá nhân).
o	API/Giao diện cập nhật hồ sơ Học viên.
o	Dashboard dành cho Admin: Xem danh sách gia sư mới đăng ký $\rightarrow$ Bấm Duyệt/Từ chối.
o	Giao diện Admin quản lý danh sách người dùng, khóa/mở tài khoản.
•	Tính độc lập: Module này chỉ đọc/ghi vào bảng Tutor, Student và thay đổi trường is_verified (Đã duyệt) của User. Nó hoàn toàn không đụng đến lịch học hay phòng học online.
🛒 Người 2: Module Chợ kết nối & Đăng bài (Marketplace Subsystem)
Người này phụ trách luồng "Kết nối" trước khi lớp học chính thức bắt đầu.
•	Các chức năng độc lập cần viết:
o	Tính năng 1: Học viên đăng bài tìm gia sư $\rightarrow$ Hiện ra danh sách lớp công khai. Gia sư vào nhấn "Ứng tuyển" $\rightarrow$ Học viên chọn gia sư.
o	Tính năng 2: Gia sư đăng bài mở lớp online sẵn $\rightarrow$ Học viên vào xem danh sách $\rightarrow$ Học viên nhấn "Đăng ký".
o	Xử lý tạo hóa đơn (Invoice) ban đầu với trạng thái WAITING_PAYMENT.
•	Tính độc lập: Module này chỉ tương tác với bảng Class_Request (Yêu cầu lớp) và Class_Application (Đơn ứng tuyển). Người này chỉ cần làm đến bước Học viên bấm "Chốt chọn gia sư/Chốt đăng ký lớp" và tạo ra một bản ghi Lớp học có trạng thái Chờ thanh toán là xong nhiệm vụ.
💻 Người 3: Module Vận hành Lớp học Online & Tài chính (E-Learning & Finance Subsystem)
Người này phụ trách luồng "Vận hành" kể từ khi lớp học đã được thanh toán tiền thành công.
•	Các chức năng độc lập cần viết:
o	Luồng Thanh toán: Nhận webhook từ cổng thanh toán (hoặc nút bấm giả lập thanh toán thành công cho giai đoạn dev) $\rightarrow$ Chuyển trạng thái lớp sang ACTIVATED $\rightarrow$ Tự động sinh ra 10 hoặc 20 Buổi học (Lesson) vào bảng tương ứng dựa theo lịch học đã chốt.
o	Luồng Phòng học Online: Viết Cronjob tự động chạy để sinh link Zoom/Google Meet trước 15 phút. Viết API Check-in/Check-out khi học viên/gia sư bấm nút "Vào phòng".
o	Luồng Kết thúc: Xử lý nút "Xác nhận hoàn thành buổi học" của học viên $\rightarrow$ Cộng tiền vào ví gia sư. Xử lý nút gửi "Khiếu nại".
•	Tính độc lập: Người này không cần quan tâm lớp học đó do ai duyệt, do học viên đăng hay gia sư đăng. Người này chỉ cần viết code lắng nghe: "Cứ hễ có lớp nào chuyển sang trạng thái ACTIVATED, tôi sẽ lấy dữ liệu lịch học của lớp đó để vận hành".
3. Quy trình làm việc hàng ngày để đảm bảo "Độc lập"
Để duy trì sự độc lập này trong suốt quá trình code, nhóm bạn nên tuân thủ nguyên tắc "Mock API" ở Frontend:
Ví dụ thực tế: Thành viên 3 làm giao diện "Phòng học Online", trong đó có hiển thị Tên và Ảnh của Gia sư. Thành viên 3 không cần đợi Thành viên 1 làm xong tính năng "Quản lý hồ sơ Gia sư". Thành viên 3 cứ tự tạo ra một dữ liệu giả (Mock Data) dạng JSON: { "tutorName": "Gia sư Nguyễn Văn A", "avatar": "image.png" } ngay trên Frontend để làm giao diện trước. Khi nào Thành viên 1 code xong API thật, Thành viên 3 chỉ cần thay đường link API giả bằng đường link API thật của Thành viên 1 là xong.
Bằng cách xây dựng Base vững, chia Enums rõ ràng và chia Module theo đúng 3 giai đoạn: Trước khi học (Người 1, 2) và Trong khi học (Người 3), nhóm bạn chắc chắn sẽ code song song rất mượt mà mà không lo nghẽn cổ chai.

