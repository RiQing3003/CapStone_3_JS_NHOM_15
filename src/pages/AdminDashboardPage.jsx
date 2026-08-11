import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { getMovies, getTheaterSystems, getUsers } from "../services/movieApi";

// Trang tổng quan admin, hiển thị nhanh số lượng phim/người dùng và lối tắt quản trị.
export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    movies: 0,
    users: 0,
    theaterSystems: 0,
    latestMovies: [],
  });

  useEffect(() => {
    let isActive = true;

    Promise.all([getMovies(), getUsers(), getTheaterSystems()]).then(([movies, users, systems]) => {
      if (isActive) {
        setStats({
          movies: movies.length,
          users: users.length,
          theaterSystems: systems.length,
          latestMovies: movies.slice(0, 5),
        });
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AdminShell title="Tổng quan quản trị">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng số phim" value={stats.movies} />
        <StatCard label="Người dùng" value={stats.users} />
        <StatCard label="Hệ thống rạp" value={stats.theaterSystems} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-white/10 bg-[#181a22]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#f5c84c]">Quản lý phim</p>
              <h2 className="mt-1 text-2xl font-black">Phim mới nhất</h2>
            </div>
            <Link className="rounded-md bg-[#f5c84c] px-4 py-3 text-sm font-black text-slate-950" to="/admin/movies">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {stats.latestMovies.map((movie) => (
              <Link
                className="grid gap-4 p-5 transition hover:bg-white/[.04] sm:grid-cols-[64px_1fr_auto] sm:items-center"
                key={movie.id}
                to={`/admin/movies/${movie.id}/edit`}
              >
                <img className="h-20 w-16 rounded-md object-cover" src={movie.poster} alt={movie.title} />
                <div>
                  <p className="font-black">{movie.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-400">{movie.description}</p>
                </div>
                <span className="rounded bg-white/10 px-3 py-2 text-sm font-bold text-slate-200">
                  {movie.rating}/10
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-5">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#f5c84c]">Thao tác nhanh</p>
          <div className="mt-4 grid gap-3">
            <Link className="rounded-md bg-white px-4 py-3 text-sm font-black text-slate-950" to="/admin/movies/new">
              Thêm phim mới
            </Link>
            <Link className="rounded-md bg-white px-4 py-3 text-sm font-black text-slate-950" to="/admin/users/new">
              Thêm người dùng
            </Link>
            <Link className="rounded-md bg-[#f26b38] px-4 py-3 text-sm font-black text-white" to="/admin/movies">
              Tạo lịch chiếu từ danh sách phim
            </Link>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

// Card thống kê nhỏ dùng trong dashboard admin.
function StatCard({ label, value }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#181a22] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black text-[#f5c84c]">{value}</p>
    </article>
  );
}
