# CyberMovie Booking Ticket

Ứng dụng đặt vé xem phim được xây dựng bằng React + Vite cho bài tập Capstone.

## Chức Năng

- Trang chủ hiển thị banner, danh sách phim, hệ thống rạp và cụm rạp.
- Trang chi tiết phim có thông tin phim, trailer và danh sách suất chiếu.
- Trang phòng vé có sơ đồ ghế, chọn ghế, tính tổng tiền và đặt vé.
- Đăng ký, đăng nhập, hồ sơ cá nhân và lịch sử đặt vé.
- Khu vực admin có quản lý phim, thêm/sửa/xóa phim, upload poster.
- Khu vực admin có quản lý người dùng và tạo lịch chiếu theo phim.
- Route `/admin` yêu cầu tài khoản quản trị; nếu chưa đăng nhập sẽ chuyển về trang đăng nhập.

## Chạy Dự Án

```bash
npm install
npm run dev
```

Kiểm tra trước khi nộp:

```bash
npm run lint
npm run build
```

## Routes

Khách hàng:

- `/`, `/home`, `/trangchu`
- `/detail/:movieId`, `/chitietphim/:movieId`
- `/ticketroom/:showtimeId`, `/chitietphongve/:showtimeId`
- `/login`, `/dangnhap`
- `/register`, `/dangky`
- `/profile`, `/thongtincanhan`

Admin:

- `/admin`
- `/admin/movies`
- `/admin/movies/new`
- `/admin/movies/:movieId/edit`
- `/admin/movies/:movieId/showtime`
- `/admin/users`
- `/admin/users/new`
- `/admin/users/:username/edit`

## Cấu Trúc Chính

- `src/services/movieApi.js`: service lấy dữ liệu phim, rạp, người dùng và đặt vé.
- `src/pages`: các màn hình khách hàng và admin.
- `src/components`: header, card phim và khung admin.
- `src/utils/authStorage.js`: đọc/ghi thông tin đăng nhập.
