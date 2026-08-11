import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearStoredUser, getStoredUser } from "../utils/authStorage";

const adminNav = [
  { label: "Tổng quan", to: "/admin" },
  { label: "Quản lý phim", to: "/admin/movies" },
  { label: "Quản lý người dùng", to: "/admin/users" },
];

// Khung giao diện chung cho khu vực quản trị gồm sidebar, tài khoản và nội dung trang.
export function AdminShell({ children, title }) {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.maLoaiNguoiDung === "QuanTri";

  // Đăng xuất admin và quay về trang chủ.
  function handleLogout() {
    clearStoredUser();
    navigate("/");
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-5">
          <Link className="text-xl font-black text-[#f5c84c]" to="/">
            CyberMovie Admin
          </Link>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[.03] p-4">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Tài khoản</p>
            {storedUser ? (
              <>
                <p className="mt-2 font-black">{storedUser.hoTen || storedUser.taiKhoan}</p>
                <p className={isAdmin ? "mt-1 text-sm text-emerald-300" : "mt-1 text-sm text-[#f5c84c]"}>
                  {isAdmin ? "Admin đã sẵn sàng" : "Chưa phải tài khoản admin"}
                </p>
                <button
                  className="mt-4 w-full rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                  onClick={handleLogout}
                  type="button"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-300">Chưa đăng nhập admin</p>
                <Link className="mt-3 inline-block text-sm font-bold text-[#f5c84c]" to="/login">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

          <nav className="mt-6 grid gap-2">
            {adminNav.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-md px-4 py-3 text-sm font-bold transition ${
                    isActive ? "bg-[#f5c84c] text-slate-950" : "text-slate-300 hover:bg-white/10"
                  }`
                }
                end={item.to === "/admin"}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section>
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Quản trị</p>
            <h1 className="mt-2 text-3xl font-black">{title}</h1>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
