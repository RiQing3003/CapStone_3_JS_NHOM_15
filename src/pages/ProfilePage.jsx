import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { getApiConfig, getProfile, updateProfile } from "../services/movieApi";
import { getStoredUser } from "../utils/authStorage";
import { formatCurrency } from "../utils/format";

const emptyProfile = {
  taiKhoan: "",
  matKhau: "",
  email: "",
  soDt: "",
  maNhom: getApiConfig().groupCode,
  maLoaiNguoiDung: "KhachHang",
  hoTen: "",
};

// Trang hồ sơ: hiển thị/cập nhật thông tin tài khoản và lịch sử đặt vé.
export function ProfilePage() {
  const [profileState, setProfileState] = useState({ isReady: false, profile: emptyProfile });
  const [message, setMessage] = useState("");
  const storedUser = getStoredUser();

  useEffect(() => {
    let isActive = true;

    getProfile().then((profile) => {
      if (isActive) {
        setProfileState({
          isReady: true,
          profile: {
            ...emptyProfile,
            ...profile,
            soDt: profile.soDt ?? profile.soDT ?? "",
            maLoaiNguoiDung: profile.maLoaiNguoiDung ?? "KhachHang",
          },
        });
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  // Cập nhật một field trong form hồ sơ cá nhân.
  function updateField(field, value) {
    setProfileState((currentState) => ({
      ...currentState,
      profile: { ...currentState.profile, [field]: value },
    }));
  }

  // Gửi dữ liệu cập nhật hồ sơ lên API.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Đang cập nhật thông tin...");

    try {
      await updateProfile(profileState.profile);
      setMessage("Cập nhật thông tin thành công.");
    } catch {
      setMessage("Không thể cập nhật thông tin lúc này. Vui lòng đăng nhập lại và thử sau.");
    }
  }

  if (!storedUser) {
    return (
      <main className="min-h-screen bg-[#0f1015] text-white">
        <SiteHeader />
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="rounded-lg border border-white/10 bg-[#181a22] p-8">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">
              Thông tin cá nhân
            </p>
            <h1 className="mt-3 text-3xl font-black">Bạn cần đăng nhập</h1>
            <p className="mt-4 text-slate-300">
              Đăng nhập để xem hồ sơ và lịch sử đặt vé của bạn.
            </p>
            <Link
              className="mt-6 inline-block rounded-md bg-[#f26b38] px-5 py-3 text-sm font-black"
              to="/login"
            >
              Đăng nhập
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const profile = profileState.profile;
  const bookings = profile.thongTinDatVe ?? [];

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_420px]">
        <form className="rounded-lg border border-white/10 bg-[#181a22] p-6" onSubmit={handleSubmit}>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">
            Thông tin cá nhân
          </p>
          <h1 className="mt-2 text-3xl font-black">Hồ sơ tài khoản</h1>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Tài khoản" name="taiKhoan" onChange={updateField} value={profile.taiKhoan} />
            <Field
              label="Mật khẩu"
              name="matKhau"
              onChange={updateField}
              type="password"
              value={profile.matKhau}
            />
            <Field label="Email" name="email" onChange={updateField} type="email" value={profile.email} />
            <Field label="Số điện thoại" name="soDt" onChange={updateField} value={profile.soDt} />
            <label className="block text-sm font-semibold text-slate-300 md:col-span-2">
              Họ tên
              <input
                className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
                onChange={(event) => updateField("hoTen", event.target.value)}
                required
                value={profile.hoTen}
              />
            </label>
          </div>
          <button className="mt-6 rounded-md bg-[#f26b38] px-5 py-4 text-sm font-black">
            Cập nhật thông tin
          </button>
          {!profileState.isReady && <p className="mt-4 text-sm text-slate-300">Đang tải hồ sơ...</p>}
          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        </form>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-6">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Vé đã đặt</p>
          <h2 className="mt-2 text-2xl font-black">Lịch sử đặt vé</h2>
          <div className="mt-5 grid gap-3">
            {bookings.length ? (
              bookings.map((booking) => (
                <div className="rounded-md border border-white/10 bg-white/[.03] p-4" key={booking.maVe}>
                  <p className="font-bold">{booking.tenPhim}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {booking.ngayDat} - {formatCurrency(booking.giaVe ?? 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-white/10 bg-white/[.03] p-4 text-sm text-slate-400">
                Chưa có lịch sử đặt vé. Những vé bạn đã mua sẽ được hiển thị tại đây.
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

// Input dùng chung trong form hồ sơ.
function Field({ label, name, onChange, type = "text", value }) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
