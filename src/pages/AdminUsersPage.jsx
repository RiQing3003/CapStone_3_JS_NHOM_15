import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { deleteUser, getApiConfig, getUsers } from "../services/movieApi";

const ADMIN_GROUP_CODE = getApiConfig().groupCode;

// Trang quản lý người dùng: lấy/tìm user trong mã nhóm hiện tại và thao tác xóa.
export function AdminUsersPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    getUsers(submittedKeyword).then((nextUsers) => {
      if (isActive) {
        setUsers(nextUsers);
        setIsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [submittedKeyword]);

  // Xóa user sau khi kiểm tra user thuộc đúng mã nhóm của project.
  async function handleDelete(user) {
    if ((user.maNhom || ADMIN_GROUP_CODE) !== ADMIN_GROUP_CODE) {
      setMessage(`Chỉ được xóa người dùng thuộc nhóm ${ADMIN_GROUP_CODE}.`);
      return;
    }

    setMessage(`Đang xóa người dùng ${user.taiKhoan}...`);

    try {
      await deleteUser(user.taiKhoan);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.taiKhoan !== user.taiKhoan));
      setMessage("Xóa người dùng thành công.");
    } catch {
      setMessage("Không thể xóa người dùng. Vui lòng kiểm tra quyền admin và thử lại.");
    }
  }

  return (
    <AdminShell title="Quản lý người dùng">
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <SmallStat label="Kết quả" value={users.length} />
        <SmallStat label="Quản trị" value={users.filter((user) => user.maLoaiNguoiDung === "QuanTri").length} />
        <SmallStat label="Khách hàng" value={users.filter((user) => user.maLoaiNguoiDung === "KhachHang").length} />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#181a22]">
        <div className="grid gap-4 border-b border-white/10 p-5 lg:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tài khoản hoặc họ tên"
            value={keyword}
          />
          <button
            className="rounded-md border border-white/10 px-4 py-3 text-center text-sm font-black text-white"
            onClick={() => {
              setIsLoading(true);
              setSubmittedKeyword(keyword);
            }}
            type="button"
          >
            Tìm kiếm
          </button>
          <Link
            className="rounded-md bg-[#f5c84c] px-4 py-3 text-center text-sm font-black text-slate-950"
            to="/admin/users/new"
          >
            Thêm người dùng
          </Link>
        </div>
        {message && <p className="border-b border-white/10 px-5 py-3 text-sm text-slate-300">{message}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-white/[.04] text-slate-300">
              <tr>
                <th className="px-5 py-4">Tài khoản</th>
                <th className="px-5 py-4">Họ tên</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Số ĐT</th>
                <th className="px-5 py-4">Loại</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-t border-white/10" key={user.taiKhoan}>
                  <td className="px-5 py-4 font-bold">{user.taiKhoan}</td>
                  <td className="px-5 py-4">{user.hoTen}</td>
                  <td className="px-5 py-4">{user.email}</td>
                  <td className="px-5 py-4">{user.soDt ?? user.soDT}</td>
                  <td className="px-5 py-4">
                    <span className="rounded bg-white/10 px-3 py-2 font-bold">{user.maLoaiNguoiDung}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link className="rounded bg-white px-3 py-2 font-bold text-slate-950" to={`/admin/users/${user.taiKhoan}/edit`}>
                        Sửa
                      </Link>
                      <button className="rounded bg-[#f26b38] px-3 py-2 font-bold" onClick={() => handleDelete(user)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !users.length && <div className="p-8 text-center text-sm text-slate-400">Không có người dùng phù hợp.</div>}
        {isLoading && <div className="p-8 text-center text-sm text-slate-400">Đang tải danh sách người dùng...</div>}
      </div>
    </AdminShell>
  );
}

// Ô thống kê nhỏ cho trang quản lý người dùng.
function SmallStat({ label, value }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#181a22] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#f5c84c]">{value}</p>
    </article>
  );
}
