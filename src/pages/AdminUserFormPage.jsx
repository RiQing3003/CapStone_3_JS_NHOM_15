import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { createUser, getApiConfig, getUsers, updateUser } from "../services/movieApi";

const initialUser = {
  taiKhoan: "",
  matKhau: "",
  email: "",
  soDt: "",
  maNhom: getApiConfig().groupCode,
  maLoaiNguoiDung: "KhachHang",
  hoTen: "",
};

// Form admin dùng chung để thêm mới hoặc cập nhật thông tin người dùng.
export function AdminUserFormPage() {
  const { username } = useParams();
  const isEdit = Boolean(username);
  const [user, setUser] = useState({ ...initialUser, taiKhoan: username ?? "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    if (isEdit) {
      getUsers(username).then((users) => {
        const selectedUser = users.find((item) => item.taiKhoan === username) ?? users[0];

        if (isActive && selectedUser) {
          setUser((currentUser) => ({
            ...currentUser,
            ...selectedUser,
            matKhau: selectedUser.matKhau ?? "",
            soDt: selectedUser.soDt ?? selectedUser.soDT ?? "",
            maNhom: selectedUser.maNhom ?? getApiConfig().groupCode,
            maLoaiNguoiDung: selectedUser.maLoaiNguoiDung ?? "KhachHang",
          }));
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [isEdit, username]);

  // Cập nhật một field trong state form người dùng.
  function updateField(field, value) {
    setUser((currentUser) => ({ ...currentUser, [field]: value }));
  }

  // Gửi dữ liệu thêm/sửa người dùng lên API quản lý người dùng.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(isEdit ? "Đang cập nhật người dùng..." : "Đang thêm người dùng...");

    try {
      if (isEdit) {
        await updateUser(user);
      } else {
        await createUser(user);
      }

      setMessage(isEdit ? "Cập nhật người dùng thành công." : "Thêm người dùng thành công.");
    } catch {
      setMessage("Không thể lưu người dùng. Vui lòng kiểm tra quyền admin và thử lại.");
    }
  }

  return (
    <AdminShell title={isEdit ? "Sửa người dùng" : "Thêm người dùng"}>
      <form className="rounded-lg border border-white/10 bg-[#181a22] p-6" onSubmit={handleSubmit}>
        <p className="mb-6 text-sm leading-6 text-slate-300">
          Quản lý thông tin đăng nhập, liên hệ và phân quyền người dùng.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Tài khoản" name="taiKhoan" onChange={updateField} value={user.taiKhoan} />
          <Field
            label="Mật khẩu"
            name="matKhau"
            onChange={updateField}
            type="password"
            value={user.matKhau}
          />
          <Field label="Email" name="email" onChange={updateField} type="email" value={user.email} />
          <Field label="Số điện thoại" name="soDt" onChange={updateField} value={user.soDt} />
          <label className="block text-sm font-semibold text-slate-300">
            Loại người dùng
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
              onChange={(event) => updateField("maLoaiNguoiDung", event.target.value)}
              value={user.maLoaiNguoiDung}
            >
              <option value="KhachHang">KhachHang</option>
              <option value="QuanTri">QuanTri</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-300 md:col-span-2">
            Họ tên
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
              onChange={(event) => updateField("hoTen", event.target.value)}
              required
              value={user.hoTen}
            />
          </label>
        </div>

        <button className="mt-6 rounded-md bg-[#f26b38] px-5 py-4 text-sm font-black">
          {isEdit ? "Cập nhật người dùng" : "Thêm người dùng"}
        </button>
        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
      </form>
    </AdminShell>
  );
}

// Input dùng chung trong form người dùng.
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
