import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { login } from "../services/movieApi";
import { saveStoredUser } from "../utils/authStorage";

// Trang đăng nhập: xử lý đăng nhập khách hàng/admin và điều hướng theo loại tài khoản.
export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = location.state?.from || "";
  const isAdminLogin = redirectPath.startsWith("/admin");
  const [form, setForm] = useState({ taiKhoan: "", matKhau: "" });
  const [message, setMessage] = useState("");

  // Gửi thông tin đăng nhập, lưu user và điều hướng về home hoặc admin.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Đang gửi thông tin đăng nhập...");

    try {
      const user = await login(form);
      saveStoredUser(user);

      if (user.maLoaiNguoiDung === "QuanTri") {
        setMessage("Đăng nhập admin thành công.");
        navigate(isAdminLogin ? redirectPath || "/admin" : "/admin", { replace: true });
        return;
      }

      if (isAdminLogin) {
        setMessage("Tài khoản này không có quyền quản trị. Vui lòng đăng nhập bằng tài khoản admin.");
        return;
      }

      setMessage("Đăng nhập thành công.");
      navigate("/", { replace: true });
    } catch (error) {
      setMessage(error.message || "Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[.9fr_1.1fr] md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">
            {isAdminLogin ? "Đăng nhập admin" : "Đăng nhập"}
          </p>
          <h1 className="mt-3 text-4xl font-black">
            {isAdminLogin ? "Cần quyền quản trị" : "Chào mừng bạn quay lại"}
          </h1>
          <p className="mt-5 leading-8 text-slate-300">
            {isAdminLogin
              ? "Bạn cần đăng nhập bằng tài khoản admin để truy cập khu vực quản trị."
              : "Đăng nhập để đặt vé, xem hồ sơ và theo dõi lịch sử giao dịch."}
          </p>
        </div>

        <form className="rounded-lg border border-white/10 bg-[#181a22] p-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-300" htmlFor="taiKhoan">
            Tài khoản
          </label>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
            id="taiKhoan"
            onChange={(event) => setForm({ ...form, taiKhoan: event.target.value })}
            required
            value={form.taiKhoan}
          />

          <label className="mt-5 block text-sm font-semibold text-slate-300" htmlFor="matKhau">
            Mật khẩu
          </label>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
            id="matKhau"
            onChange={(event) => setForm({ ...form, matKhau: event.target.value })}
            required
            type="password"
            value={form.matKhau}
          />

          <button className="mt-6 w-full rounded-md bg-[#f26b38] px-4 py-4 text-sm font-black">
            {isAdminLogin ? "Đăng nhập admin" : "Đăng nhập"}
          </button>
          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
          {!isAdminLogin && (
            <p className="mt-5 text-sm text-slate-400">
              Chưa có tài khoản?{" "}
              <Link className="font-bold text-[#f5c84c]" to="/register">
                Đăng ký
              </Link>
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
