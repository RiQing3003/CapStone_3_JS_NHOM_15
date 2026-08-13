import { Link, NavLink } from "react-router-dom";
import { clearStoredUser, getStoredUser } from "../utils/authStorage";

const navItems = [
  { label: "Phim", to: "/datve" },
  { label: "Lịch chiếu", to: "/lichchieu" },
  { label: "Đặt vé", to: "/datve" },
];

// Header dùng chung cho trang khách hàng, hiển thị menu và trạng thái đăng nhập.
export function SiteHeader() {
  const storedUser = getStoredUser();

  // Đăng xuất khách hàng/admin và cập nhật lại header.
  function handleLogout() {
    clearStoredUser();
    window.location.assign("/");
  }

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
      <Link className="text-lg font-black tracking-wide text-white" to="/">
        CyberMovie
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
        {navItems.map((item) => (
          <NavLink className="transition hover:text-[#f5c84c]" key={item.label} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {storedUser ? (
        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white sm:inline-block"
            to="/profile"
          >
            {storedUser.hoTen || storedUser.taiKhoan}
          </Link>
          <button
            className="rounded-full bg-[#f5c84c] px-4 py-2 text-sm font-bold text-slate-950"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            to="/login"
          >
            Đăng nhập
          </Link>
          <Link
            className="rounded-full bg-[#f5c84c] px-4 py-2 text-sm font-bold text-slate-950"
            to="/register"
          >
            Đăng ký
          </Link>
        </div>
      )}
    </header>
  );
}
