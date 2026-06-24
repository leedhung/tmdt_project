# E-Tutor Platform 🎓

Chào mừng bạn đến với **E-Tutor Platform** - Nền tảng kết nối Gia sư và Học viên toàn diện được tích hợp luồng giao dịch tài chính tự động thông qua tính năng Ví điện tử & Ký quỹ (Escrow).

Dự án này được thiết kế và xây dựng theo mô hình Microservices-lite, vận hành hoàn toàn trên Docker giúp cho việc triển khai ở bất kỳ môi trường nào cũng trở nên cực kỳ dễ dàng.

---

## 🛠️ Công nghệ sử dụng
- **Backend**: Java 17, Spring Boot 3, Spring Security (JWT), Hibernate/JPA, MySQL 8.
- **Frontend**: React 18, Vite, Vanilla CSS, Axios.
- **Infrastructure**: Docker & Docker Compose.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Quick Start)

**Yêu cầu hệ thống:** Máy tính của bạn cần cài đặt sẵn [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Mở Terminal / PowerShell tại thư mục gốc của dự án (`tmdt_project`).
2. Chạy câu lệnh sau để tự động Build và khởi động toàn bộ hệ thống:
   ```bash
   docker compose up -d --build
   ```
3. Đợi vài phút để hệ thống tải thư viện và khởi động các vùng chứa (containers).
4. Truy cập hệ thống:
   - **Giao diện người dùng (Frontend):** `http://localhost:8080` (hoặc `http://localhost:5173`)
   - **API Server (Backend):** `http://localhost:8081`

> **Tài khoản Admin mặc định** (đã được tạo sẵn bởi cơ sở dữ liệu):
> - **Email:** `admin@etutor.com`
> - **Mật khẩu:** `admin123`

---

## 🧪 Kịch bản Test chi tiết toàn hệ thống (End-to-End Workflow)

Để hiểu rõ cách hệ thống hoạt động và test đầy đủ các chức năng lõi (bao gồm tính năng phân quyền, bảo mật, và tài chính tự động), bạn vui lòng thực hiện theo kịch bản luồng (1 cycle) sau đây:

### Bước 1: Khởi tạo và Phân quyền (Quản trị viên)
1. Truy cập Frontend, đăng ký 2 tài khoản thử nghiệm mới toanh: ví dụ `giasu1@gmail.com` và `hocvien1@gmail.com`.
2. Đăng xuất. Sử dụng tài khoản **Admin mặc định** (`admin@etutor.com` / `admin123`) để đăng nhập.
3. Đi tới **Admin Dashboard** -> Bấm sang tab **Người dùng hệ thống**.
4. Tại cột "Vai trò", bạn nhấn vào Dropdown và cấp quyền:
   - Đổi `giasu1@gmail.com` thành vai trò **TUTOR**.
   - Chắc chắn `hocvien1@gmail.com` đang ở vai trò **STUDENT**.
   - *(Xác nhận các thông báo cấp quyền thành công)*.

### Bước 2: Tạo Giao dịch & Kết nối Gia sư - Học viên
1. Mở một trình duyệt ẩn danh (Incognito), đăng nhập bằng tài khoản **Học viên** (`hocvien1@gmail.com`).
2. Học viên tiến hành thao tác **Nạp tiền** vào ví nội bộ hệ thống.
3. Học viên bấm nút **Đăng tìm gia sư** để tạo một lớp học mới.
4. Tại trình duyệt chính, đăng nhập bằng tài khoản **Gia sư** (`giasu1@gmail.com`).
5. Gia sư vào mục "Tìm lớp học" -> Nhấn **Ứng tuyển** vào lớp vừa tạo.
6. Học viên bên ẩn danh quay lại, chấp nhận gia sư và tiến hành **Thanh toán bảo chứng học phí**.
   - *Kết quả:* Lớp học chuyển sang trạng thái `ACTIVATED` (Đang hoạt động). Tiền bị trừ khỏi số dư khả dụng của học viên và chuyển sang trạng thái "Đóng băng" trên hệ thống (Escrow).

### Bước 3: Thống kê Dòng tiền Hệ thống (Admin Cashflow)
1. Đăng nhập lại bằng tài khoản **Admin**.
2. Đi tới Admin Dashboard -> Mục **Giám sát Ví tiền**.
3. Bạn sẽ quan sát thấy:
   - **TỔNG TIỀN NẠP VÀO HỆ THỐNG:** Tăng lên bằng đúng số tiền học viên đã nạp ở Bước 2.
   - **TIỀN ĐANG ĐÓNG BĂNG (ESCROW):** Hiển thị đúng số tiền học phí của lớp học đang chờ học.

### Bước 4: Thống kê Doanh thu & Chức năng Hủy lớp (Auto-Refund)
1. Đăng nhập bằng tài khoản **Gia sư**.
2. Nhìn lên thẻ **Doanh thu thực tế** tại trang Dashboard.
   - *Lưu ý:* Doanh thu lúc này vẫn không đổi (vì lớp đang dạy, tiền chưa được giải ngân).
3. Kéo xuống danh sách lớp học đang quản lý, tìm lớp vừa nhận và bấm nút **"Hủy lớp"** (nút màu hồng đỏ) -> Xác nhận.
   - *Kết quả:* Lớp chuyển sang trạng thái `CANCELLED` (Đã hủy).
4. Đăng nhập lại bằng **Học viên**, vào phần Ví tiền xem Lịch sử giao dịch.
   - *Kết quả:* Một giao dịch loại **`REFUND` (Hoàn tiền)** tự động được sinh ra. Toàn bộ tiền học đóng băng đã được trả thẳng về ví khả dụng của Học viên.

### Bước 5: Khiếu nại và Phán xử (Dispute & Resolve trên UI)
1. **Học viên khiếu nại:** Tại tab "Lớp học của tôi", mở chi tiết Lịch học của một lớp đang học. Bấm nút **"Khiếu nại"** (màu đỏ) ở một buổi học bất kỳ (Trạng thái sẽ chuyển sang `DISPUTED`).
2. **Admin tiếp nhận và phán xử:** 
   - Đăng nhập Admin, vào tab **Hỗ trợ & Khiếu nại**.
   - Admin sẽ thấy một Ticket khiếu nại mới từ Học viên.
   - Admin có thể nhấn **"Hoàn học phí Học viên"** (Trả lại tiền về ví Học viên) hoặc **"Giải ngân Gia sư"** (Chuyển tiền vào ví Gia sư, cắt 15% hoa hồng).
   - *Kết quả:* Hệ thống tự động chuyển luồng tiền chính xác theo quyết định và cập nhật trạng thái Ticket thành `RESOLVED`.

### Bước 6: Kiểm tra Bảo mật JWT (Security Blacklist)
1. Đăng nhập vào bất kỳ tài khoản nào. Mở công cụ Developer Tools của trình duyệt (F12) -> Tab **Network**.
2. Nhấn nút **Đăng xuất** ở menu hệ thống.
3. Ở Tab Network, copy lại chuỗi `Bearer Token` từ API `POST /logout` vừa được gọi.
4. Mở phần mềm **Postman** (hoặc cURL), dùng lại chính Token vừa copy đó để thử lấy dữ liệu cá nhân thông qua API `GET http://localhost:8081/api/v1/auth/profile`.
5. *Kết quả:* Bạn sẽ nhận về mã lỗi HTTP `401 Unauthorized` ngay lập tức do Token đã bị hệ thống chặn hoàn toàn trong cơ sở dữ liệu (Blacklist).


