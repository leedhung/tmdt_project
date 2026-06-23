# HƯỚNG DẪN TÍCH HỢP TESTSPRITE VÀO DỰ ÁN E-TUTOR

Tài liệu này hướng dẫn cách tích hợp và cấu hình **TestSprite** làm MCP Server trong IDE (Cursor / VS Code) để tự động hóa việc kiểm thử các luồng nghiệp vụ (workflow) của E-Tutor Platform.

---

## 1. Các bước Chuẩn bị phía Người dùng
Do TestSprite yêu cầu một tài khoản cá nhân và API Key để truy cập môi trường sandbox đám mây của họ, bạn cần thực hiện các bước sau:

1.  Truy cập vào trang chủ [TestSprite](https://www.testsprite.com/) và đăng ký một tài khoản.
2.  Sau khi đăng nhập, truy cập vào trang quản trị (Dashboard/Console) để lấy **API Key** của bạn.
3.  Lưu trữ API Key này bảo mật để điền vào phần cấu hình dưới đây.

---

## 2. Cách Tích hợp vào IDE (Cursor / VS Code)
TestSprite cung cấp gói MCP Server chính thức để bạn có thể gọi AI Test Agent ngay trong khung chat của IDE.

### Cách A: Cấu hình nhanh qua Giao diện Cursor
1.  Mở cài đặt của Cursor: `Ctrl + Shift + J` (hoặc vào **Settings** -> **Features** -> **MCP**).
2.  Nhấn nút **+ Add New MCP Server**.
3.  Điền các thông tin sau:
    *   **Name:** `TestSprite`
    *   **Type:** `command`
    *   **Command:** `npx -y @testsprite/testsprite-mcp@latest`
4.  Nhấp vào mục thêm biến môi trường (**Environment Variables**) và cấu hình:
    *   **Key:** `API_KEY`
    *   **Value:** *(Dán API Key bạn đã lấy ở Bước 1 vào đây)*
5.  Nhấn **Save** để kích hoạt server.

### Cách B: Cấu hình thủ công qua tệp JSON
Nếu bạn muốn cấu hình bằng tệp cấu hình, hãy tạo hoặc chỉnh sửa tệp cấu hình MCP của Cursor (thường nằm ở `~/.cursor/mcp.json` hoặc trong thư mục dự án `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": [
        "-y",
        "@testsprite/testsprite-mcp@latest"
      ],
      "env": {
        "API_KEY": "YOUR_TESTSPRITE_API_KEY_HERE"
      }
    }
  }
}
```
*(Thay thế `YOUR_TESTSPRITE_API_KEY_HERE` bằng API Key thực tế của bạn).*

---

## 3. Cách chạy Test tự động cho E-Tutor
Khi đã cấu hình xong MCP Server cho TestSprite trong IDE, bạn có thể gọi nó trực tiếp trong khung chat bằng các câu lệnh (prompts) mẫu sau:

### Kịch bản 1: Kiểm thử luồng Đăng ký & Xét duyệt Gia sư
> **Prompt:** `"@TestSprite Hãy tạo và chạy kịch bản kiểm thử luồng đăng ký của Gia sư theo tài liệu .docs/workflow.md. Hãy đảm bảo tài khoản gia sư mới tạo không thể đăng nhập được cho đến khi được Admin phê duyệt (is_verified = true)."`

### Kịch bản 2: Kiểm thử luồng Thanh toán Escrow
> **Prompt:** `"@TestSprite Hãy kiểm thử API/UI của luồng thanh toán Escrow: Học viên thanh toán lớp học -> Tiền chuyển vào ví đóng băng (frozen_balance) -> Trạng thái lớp học chuyển sang ACTIVATED -> Lịch học các buổi được tự động tạo ra."`

### Kịch bản 3: Kiểm thử toàn bộ dự án
> **Prompt:** `"@TestSprite Hãy phân tích tài liệu đặc tả trong thư mục .docs/ và chạy kiểm thử tự động toàn bộ các workflow chính của dự án."`

---

## 4. Quá trình hoạt động của Test Agent
Khi bạn gửi yêu cầu, TestSprite Agent sẽ tự động:
1.  Đọc và phân tích các tệp thiết kế đặc tả [overview.md](file:///d:/Project/TMDT/.docs/overview.md) và [workflow.md](file:///d:/Project/TMDT/.docs/workflow.md).
2.  Sinh mã kịch bản test UI/API tự động (sử dụng Playwright/NodeJS).
3.  Khởi tạo môi trường ảo độc lập trên đám mây để khởi chạy kịch bản và tương tác với trang web E-Tutor.
4.  Xuất báo cáo kết quả kèm theo các đề xuất vá lỗi (patches) trực tiếp cho bạn trong IDE nếu phát hiện tính năng chạy sai workflow thiết kế.
