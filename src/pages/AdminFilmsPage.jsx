import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { deleteMovie, getMovies } from "../services/movieApi";

// Trang quản lý phim: lấy phim từ server, tìm kiếm trong bảng và điều hướng sửa/xóa/tạo lịch.
export function AdminFilmsPage() {
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .finally(() => setIsLoading(false));
  }, []);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredMovies = normalizedKeyword
    ? movies.filter((movie) =>
        `${movie.id} ${movie.title} ${movie.description}`.toLowerCase().includes(normalizedKeyword),
      )
    : movies;

  // Xóa phim sau khi admin xác nhận.
  async function handleDelete(movieId) {
    const shouldDelete = window.confirm(`Bạn chắc chắn muốn xóa phim ${movieId}?`);
    if (!shouldDelete) return;

    setMessage(`Đang xóa phim ${movieId}...`);

    try {
      await deleteMovie(movieId);
      setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== movieId));
      setMessage("Xóa phim thành công.");
    } catch {
      setMessage("Không thể xóa phim. Vui lòng kiểm tra quyền admin và thử lại.");
    }
  }

  return (
    <AdminShell title="Quản lý phim">
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <SmallStat label="Tổng phim" value={movies.length} />
        <SmallStat label="Đang hiển thị" value={filteredMovies.length} />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#181a22]">
        <div className="grid gap-4 border-b border-white/10 p-5 lg:grid-cols-[1fr_auto]">
          <input
            className="rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo mã phim, tên phim hoặc mô tả"
            value={keyword}
          />
          <Link
            className="rounded-md bg-[#f5c84c] px-4 py-3 text-center text-sm font-black text-slate-950"
            to="/admin/movies/new"
          >
            Thêm phim
          </Link>
        </div>
        {message && <p className="border-b border-white/10 px-5 py-3 text-sm text-slate-300">{message}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[.04] text-slate-300">
              <tr>
                <th className="px-5 py-4">Mã phim</th>
                <th className="px-5 py-4">Hình ảnh</th>
                <th className="px-5 py-4">Tên phim</th>
                <th className="px-5 py-4">Đánh giá</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr className="border-t border-white/10 align-top" key={movie.id}>
                  <td className="px-5 py-4 font-bold">{movie.id}</td>
                  <td className="px-5 py-4">
                    <img className="h-20 w-14 rounded object-cover" src={movie.poster} alt={movie.title} />
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-md font-bold">{movie.title}</p>
                    <p className="mt-1 line-clamp-2 max-w-md text-slate-400">{movie.description}</p>
                  </td>
                  <td className="px-5 py-4">{movie.rating}/10</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded bg-white px-3 py-2 font-bold text-slate-950" to={`/admin/movies/${movie.id}/edit`}>
                        Sửa
                      </Link>
                      <Link
                        className="rounded bg-[#f5c84c] px-3 py-2 font-bold text-slate-950"
                        to={`/admin/movies/${movie.id}/showtime`}
                      >
                        Tạo lịch
                      </Link>
                      <button className="rounded bg-[#f26b38] px-3 py-2 font-bold" onClick={() => handleDelete(movie.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !filteredMovies.length && (
          <div className="p-8 text-center text-sm text-slate-400">Không tìm thấy phim phù hợp.</div>
        )}
        {isLoading && <div className="p-8 text-center text-sm text-slate-400">Đang tải danh sách phim...</div>}
      </div>
    </AdminShell>
  );
}

// Ô thống kê nhỏ cho trang quản lý phim.
function SmallStat({ label, value }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#181a22] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#f5c84c]">{value}</p>
    </article>
  );
}
