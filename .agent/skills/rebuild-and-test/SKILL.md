---
name: rebuild-and-test
description: Yêu cầu bắt buộc phải chạy lệnh rebuild và kiểm thử (test) lại toàn bộ hệ thống ngay sau khi có bất kỳ thay đổi nào trong mã nguồn để đảm bảo độ tin cậy và tránh lỗi phát sinh.
version: 1.0.0
tags:
  - build
  - test
  - quality-assurance
  - verification
---

# Quy Trình Bắt Buộc Rebuild và Test Khi Sửa Code

Skill này định nghĩa quy trình kiểm soát chất lượng bắt buộc mà tác nhân AI (agent) phải thực hiện ngay sau khi chỉnh sửa bất kỳ tệp mã nguồn nào trong hệ thống **GiaSuHome**.

## Điều Kiện Kích Hoạt (Trigger)
- Bất kỳ khi nào thực hiện chỉnh sửa, tạo mới hoặc xóa bỏ mã nguồn tại thư mục `e-tutor-frontend` hoặc `e-tutor-backend`.

## Quy Trình Thực Hiện (Workflow)

Ngay sau khi chỉnh sửa mã nguồn, trước khi kết thúc lượt hoặc báo cáo cho người dùng, agent **BẮT BUỘC** phải thực hiện các bước kiểm tra sau:

### 1. Đối Với Thay Đổi Ở Frontend (`e-tutor-frontend`)
Di chuyển vào thư mục `d:\Project\TMDT\e-tutor-frontend` và chạy các lệnh kiểm tra:

- **Lệnh Biên Dịch (Rebuild)**:
  ```bash
  npm run build
  ```
  *Yêu cầu*: Quá trình build phải hoàn thành thành công 100% không phát sinh lỗi biên dịch (errors).

- **Lệnh Kiểm Tra Lint (Nếu cần)**:
  ```bash
  npm run lint
  ```
  *Yêu cầu*: Đảm bảo không có lỗi cú pháp nghiêm trọng làm gián đoạn mã nguồn.

### 2. Đối Với Thay Đổi Ở Backend (`e-tutor-backend`)
Di chuyển vào thư mục `d:\Project\TMDT\e-tutor-backend` và chạy các lệnh kiểm tra:

- **Lệnh Biên Dịch (Compile)**:
  ```bash
  mvn clean compile
  ```
  *Yêu cầu*: Biên dịch Java thành công không có lỗi build.

- **Lệnh Chạy Kiểm Thử (Test)**:
  ```bash
  mvn test
  ```
  *Yêu cầu*: Tất cả các bài kiểm thử đơn vị (unit tests) phải vượt qua (passed) hoàn toàn.

### 3. Báo Cáo Kết Quả Cho Người Dùng
Trong phản hồi cuối cùng, agent phải báo cáo rõ ràng trạng thái build và test:
- Lệnh đã chạy.
- Kết quả chạy (thành công/thất bại).
- Các log lỗi phát sinh (nếu có) và phương án khắc phục ngay lập tức trước khi bàn giao.
