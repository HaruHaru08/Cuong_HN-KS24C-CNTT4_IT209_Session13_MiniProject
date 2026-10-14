# 🏛️ Campus Hub Pro — PTIT Student Community Platform

> **Đề tài Mini Project Session 13 — Môn IT209: DevOps & Kỹ thuật Vận hành Hệ thống**  
> **Đơn vị đào tạo:** Học viện Công nghệ Bưu chính Viễn thông (PTIT)  
> **Dự án gốc:** [Campus Hub Base](https://github.com/dinhthanhnam/campus-hub-base)  
> **Phiên bản nâng cấp:** `Campus Hub Pro v2.0-release`

---

## 🌟 1. Giới thiệu Đề tài & Vấn đề Giải quyết

Trong môi trường đại học (đặc biệt tại Học viện Công nghệ Bưu chính Viễn thông - PTIT), hàng nghìn sinh viên thường xuyên có nhu cầu:
1. **Tìm kiếm & Trả lại đồ thất lạc** (thẻ sinh viên, ví tiền, chìa khóa xe, máy tính Casio, sạc laptop...).
2. **Trao đổi giáo trình, sách cũ, linh kiện điện tử, đồ dùng học tập KTX**.
3. **Tìm nhóm học tập, thảo luận đồ án, tìm bạn ghép phòng trọ**.

### ⚠️ Hạn chế của Dự án Nền (Campus Hub Base):
* Chỉ cho phép đăng bài và để lại bình luận công khai thông thường.
* **Không có cơ chế xác minh quyền sở hữu**: Kẻ gian có thể mạo danh để nhận nhầm/nhận bừa đồ thất lạc.
* **Lộ lọt thông tin cá nhân**: Sinh viên phải để lại SĐT/Zalo công khai trong phần bình luận.
* **Không có quy trình kết thúc giao dịch**: Tác giả không thể phê duyệt người nhận và đánh dấu hoàn tất tự động.
* **Không có kiểm duyệt vi phạm**: Thiếu công cụ báo cáo bài đăng rác (Spam, lừa đảo).

### 🚀 Giải pháp Đột phá của Campus Hub Pro:
* **Quy trình Xác minh & Trao nhận Đồ bảo mật (Item Claim & Handover Workflow)**:
  * Sinh viên gửi **Yêu cầu nhận đồ (Claim Request)** kèm mô tả bằng chứng chi tiết và thông tin liên hệ bảo mật.
  * Thông tin liên hệ chỉ hiển thị riêng cho chủ bài viết (bảo mật quyền riêng tư tuyệt đối).
  * Chủ bài viết có quyền **Duyệt (Approve)** hoặc **Từ chối (Reject)** kèm lời nhắn hẹn gặp.
  * Nút hành động **"Xác nhận đã bàn giao thành công"**: Tự động chuyển bài viết sang `RESOLVED`, đóng các yêu cầu đang chờ khác.
* **Hệ thống Kiểm duyệt & Báo cáo Vi phạm (Post Reporting & Admin Moderation)**:
  * Sinh viên có thể báo cáo bài viết vi phạm (Spam, lừa đảo, sai chuyên mục).
  * Dashboard quản trị viên hiển thị thống kê KPI thời gian thực và 1-click ẩn bài vi phạm.
* **Bộ lọc Đa tiêu chí**: Lọc theo từ khóa, chuyên mục và trạng thái (Đang mở / Đã giải quyết).
* **Giao diện PTIT Brand Identity**: Thiết kế tông màu đỏ PTIT đặc trưng, tinh tế, responsive.
* **Hạ tầng DevOps Hoàn chỉnh**: Multi-stage Dockerfile, Docker Compose tự động, Nginx reverse proxy, CI/CD pipeline chuẩn GitHub Actions.

---

## 👥 2. Tài khoản Thử nghiệm Trình diễn

Hệ thống tự động khởi tạo dữ liệu mẫu khi khởi động lần đầu:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Sinh viên** | `student` | `student123` | Đăng bài, bình luận, quan tâm, gửi yêu cầu nhận đồ, duyệt yêu cầu của mình, báo cáo vi phạm |
| **Quản trị viên** | `admin` | `admin123` | Toàn quyền hệ thống, xem Admin Moderation Dashboard, thống kê KPI, duyệt báo cáo, ẩn bài đăng |

---

## 🏗️ 3. Kiến trúc Hệ thống (System Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          NGINX (Port 80)                               │
│  - Phục vụ Static Files React SPA (dist)                              │
│  - Gzip Compression & Static Cache                                    │
│  - Reverse Proxy: /api/*  ──> Backend Spring Boot                     │
│  - Reverse Proxy: /actuator/* ──> Actuator Health                     │
└──────────────────┬─────────────────────────────────────────────────────┘
                   │ Proxy HTTP:8080
┌──────────────────▼─────────────────────────────────────────────────────┐
│                 BACKEND: SPRING BOOT 3 (Port 8080)                     │
│  - Java 21 LTS, Spring Security (HTTP Basic + BCrypt)                  │
│  - Spring Data JPA, Hibernate, Flyway Migration                        │
│  - Module Bài đăng (Post), Bình luận (Comment), Thả tim (Reaction)     │
│  - Module Mới: Quy trình Trao nhận (Claim Request)                    │
│  - Module Mới: Báo cáo & Kiểm duyệt Vi phạm (Report & Moderation)      │
└──────────────────┬─────────────────────────────────────────────────────┘
                   │ JDBC Port 3306 (campushub_network)
┌──────────────────▼─────────────────────────────────────────────────────┐
│                 DATABASE: MYSQL 8.0 (Container)                         │
│  - Volume Persistent: campushub_mysql_data                             │
│  - Charset utf8mb4, Tự động chạy Flyway V1 & V2 migrations             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 4. Danh mục API RESTful Chính

### Nhóm API Kế thừa & Nâng cấp
| Method | Endpoint | Mô tả | Xác thực |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | Không |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại | Có |
| `GET` | `/api/categories` | Danh sách chuyên mục | Không |
| `GET` | `/api/posts` | Tìm kiếm & lọc bài đăng (keyword, category, status) | Không |
| `GET` | `/api/posts/{id}` | Chi tiết bài đăng | Không |
| `POST` | `/api/posts` | Tạo bài đăng mới | Có |
| `PUT` | `/api/posts/{id}` | Sửa bài đăng của mình | Có (Owner/Admin) |
| `PATCH` | `/api/posts/{id}/status` | Đổi trạng thái bài đăng | Có (Owner/Admin) |
| `DELETE` | `/api/posts/{id}` | Xóa bài đăng | Có (Owner/Admin) |
| `POST` | `/api/posts/{id}/comments` | Thêm bình luận | Có |
| `POST` | `/api/posts/{id}/reaction` | Bật/tắt bày tỏ quan tâm | Có |

### Nhóm API Mới Phát triển (Mở rộng Nghiệp vụ)
| Method | Endpoint | Mô tả | Xác thực |
|---|---|---|---|
| `POST` | `/api/posts/{id}/claims` | Gửi yêu cầu nhận đồ / trao đổi | Có (Sinh viên) |
| `GET` | `/api/posts/{id}/claims` | Xem danh sách yêu cầu (Chủ bài xem tất cả, người gửi xem của mình) | Có |
| `PATCH` | `/api/posts/{id}/claims/{claimId}/status` | Duyệt / Từ chối yêu cầu trao nhận | Có (Owner/Admin) |
| `POST` | `/api/posts/{id}/claims/{claimId}/handover` | Hoàn tất bàn giao -> Chuyển bài sang `RESOLVED` | Có (Owner/Admin) |
| `POST` | `/api/posts/{id}/report` | Báo cáo bài đăng vi phạm (Spam/Lừa đảo) | Có (Sinh viên) |
| `GET` | `/api/admin/reports` | Xem danh sách bài đăng bị báo cáo | Có (`ROLE_ADMIN`) |
| `PATCH` | `/api/admin/reports/{id}/dismiss` | Bỏ qua báo cáo vi phạm | Có (`ROLE_ADMIN`) |
| `PATCH` | `/api/admin/reports/{id}/hide-post` | Ẩn bài đăng vi phạm khỏi hệ thống | Có (`ROLE_ADMIN`) |
| `GET` | `/api/admin/stats` | Thống kê số liệu hệ thống (KPIs) | Có (`ROLE_ADMIN`) |

---

## 💻 5. Hướng dẫn Khởi chạy Hệ thống

### Cách 1: Chạy toàn bộ bằng Docker Compose (Khuyên dùng)
Yêu cầu: Đã cài Docker & Docker Compose.

```bash
# 1. Sao chép file cấu hình môi trường
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống bằng 1 lệnh
docker compose up -d --build

# 3. Kiểm tra trạng thái các container
docker compose ps
```

* **Frontend Web App:** Truy cập `http://localhost` (hoặc cổng cấu hình trong `.env`).
* **Backend API:** Truy cập `http://localhost:8080/api/posts`.
* **Health Check:** `http://localhost:8080/actuator/health`.

---

### Cách 2: Chạy trực tiếp trên máy phát triển (Local Development)

#### Backend:
```bash
cd backend
# Cấu hình biến môi trường kết nối MySQL nếu cần
./gradlew.bat bootRun
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại `http://localhost:5173`.

---

## 🧪 6. Kiểm thử Tự động (Automated Testing)

Dự án tích hợp bộ kiểm thử tích hợp (Integration Tests) tự động hóa 100%:

```bash
# Kiểm thử Backend Spring Boot (MockMvc + JUnit 5 + H2 DB)
cd backend
./gradlew.bat test

# Kiểm tra mã nguồn Frontend (ESLint + Build Vite)
cd ../frontend
npm run lint
npm run build
```

Kết quả: **10/10 kiểm thử tích hợp thành công, 0 lỗi cú pháp.**

---

## 🌐 7. Triển khai Công khai (Public Deployment)

Hệ thống được thiết kế sẵn sàng cho việc triển khai công khai trên các nền tảng đám mây (Cloud Platforms):
* **Phương án 1 (Cloud PaaS):** Triển khai trực tiếp lên Render / Railway thông qua Dockerfile có sẵn.
* **Phương án 2 (Cloudflare Tunnel / Ngrok):** Tạo đường hầm truy cập an toàn ra internet trong buổi bảo vệ trực tiếp:
  ```bash
  ngrok http 80
  # hoặc: cloudflared tunnel --url http://localhost:80
  ```
  Hệ thống cung cấp đường dẫn HTTPS công khai để hội đồng và các nhóm sinh viên trải nghiệm thực tế.

---

## 👥 8. Thành viên Thực hiện
* **Sinh viên:** Nguyễn Việt Nam
* **Lớp:** D21CQCN04-B (CNTT4) — PTIT
* **Môn học:** IT209 — DevOps & Vận hành Phần mềm
