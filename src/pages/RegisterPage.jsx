import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { getApiConfig, register } from "../services/movieApi";

const initialForm = {
  taiKhoan: "",
  matKhau: "",
  email: "",
  soDt: "",
  hoTen: "",
  maNhom: getApiConfig().groupCode,
};

// Trang đăng ký tài khoản khách hàng mới.
export function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  // Validate dữ liệu người dùng nhập và gửi API đăng ký.
  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedForm = {
      ...form,
      taiKhoan: form.taiKhoan.trim(),
      email: form.email.trim(),
      soDt: form.soDt.trim(),
      hoTen: form.hoTen.trim(),
    };

    if (normalizedForm.matKhau.length < 6) {
      setMessage("Mật khẩu cần có ít nhất 6 ký tự.");
      return;
    }

    if (!/^\d{9,11}$/.test(normalizedForm.soDt)) {
      setMessage("Số điện thoại cần gồm 9 đến 11 chữ số.");
      return;
    }

    setMessage("Đang tạo tài khoản...");

    try {
      await register(normalizedForm);
      setMessage("Đăng ký thành công. Bạn có thể đăng nhập.");
    } catch (error) {
      setMessage(error.message || "Không thể đăng ký. Vui lòng kiểm tra lại thông tin tài khoản.");
    }
  }

  // Cập nhật một field trong form đăng ký.
  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[.9fr_1.1fr] md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Đăng ký</p>
          <h1 className="mt-3 text-4xl font-black">Tạo tài khoản đặt vé</h1>
          <p className="mt-5 leading-8 text-slate-300">
            Tạo tài khoản để đặt vé nhanh hơn và theo dõi lịch sử giao dịch của bạn.
          </p>
        </div>

        <form className="rounded-lg border border-white/10 bg-[#181a22] p-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Tài khoản"
              name="taiKhoan"
              onChange={updateField}
              value={form.taiKhoan}
            />
            <Field
              label="Mật khẩu"
              name="matKhau"
              onChange={updateField}
              type="password"
              value={form.matKhau}
            />
            <Field label="Email" name="email" onChange={updateField} type="email" value={form.email} />
            <Field label="Số điện thoại" name="soDt" onChange={updateField} value={form.soDt} />
            <Field label="Họ tên" name="hoTen" onChange={updateField} value={form.hoTen} />
          </div>

          <button className="mt-6 w-full rounded-md bg-[#f26b38] px-4 py-4 text-sm font-black">
            Đăng ký
          </button>
          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
          <p className="mt-5 text-sm text-slate-400">
            Đã có tài khoản?{" "}
            <Link className="font-bold text-[#f5c84c]" to="/login">
              Đăng nhập
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

// Input dùng chung trong form đăng ký.
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
