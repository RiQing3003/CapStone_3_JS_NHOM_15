import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminFilmsPage } from "./pages/AdminFilmsPage";
import { AdminMovieFormPage } from "./pages/AdminMovieFormPage";
import { AdminShowtimePage } from "./pages/AdminShowtimePage";
import { AdminUserFormPage } from "./pages/AdminUserFormPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { TicketRoomPage } from "./pages/TicketRoomPage";
import { getStoredUser } from "./utils/authStorage";

// Bao ve khu vuc quan tri: chua dang nhap admin thi day ve trang dang nhap.
function RequireAdmin() {
  const location = useLocation();
  const storedUser = getStoredUser();

  if (storedUser?.maLoaiNguoiDung !== "QuanTri") {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}

// Khai bao toan bo luong dieu huong cua website trong mot noi de de cham va bao tri.
function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Trang khach hang */}
        <Route element={<HomePage />} path="/" />
        <Route element={<HomePage />} path="/home" />
        <Route element={<HomePage />} path="/trangchu" />
        <Route element={<HomePage scrollToSection="showtimes" />} path="/lichchieu" />
        <Route element={<HomePage scrollToSection="movies" />} path="/datve" />

        {/* Chi tiet phim va phong dat ve */}
        <Route element={<DetailPage />} path="/detail/:movieId" />
        <Route element={<DetailPage />} path="/chitietphim/:movieId" />
        <Route element={<DetailPage />} path="/movie/:movieId" />
        <Route element={<DetailPage />} path="/phim/:movieId" />

        <Route element={<TicketRoomPage />} path="/ticketroom/:showtimeId" />
        <Route element={<TicketRoomPage />} path="/chitietphongve/:showtimeId" />

        {/* Tai khoan nguoi dung */}
        <Route element={<LoginPage />} path="/login" />
        <Route element={<LoginPage />} path="/dangnhap" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<RegisterPage />} path="/dangky" />
        <Route element={<ProfilePage />} path="/profile" />
        <Route element={<ProfilePage />} path="/thongtincanhan" />

        {/* Trang admin chi cho tai khoan QuanTri */}
        <Route element={<RequireAdmin />}>
          <Route element={<AdminDashboardPage />} path="/admin" />
          <Route element={<AdminDashboardPage />} path="/admin/dashboard" />
          <Route element={<AdminFilmsPage />} path="/admin/movies" />
          <Route element={<AdminMovieFormPage />} path="/admin/movies/new" />
          <Route element={<AdminMovieFormPage />} path="/admin/movies/:movieId/edit" />
          <Route element={<AdminShowtimePage />} path="/admin/movies/:movieId/showtime" />
          <Route element={<AdminUsersPage />} path="/admin/users" />
          <Route element={<AdminUserFormPage />} path="/admin/users/new" />
          <Route element={<AdminUserFormPage />} path="/admin/users/:username/edit" />
        </Route>

        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </>
  );
}

// Bọc toàn bộ route trong BrowserRouter để React Router điều hướng phía client.
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
