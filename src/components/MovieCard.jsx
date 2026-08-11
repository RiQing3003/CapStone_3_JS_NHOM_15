import { Link } from "react-router-dom";

// Hiển thị một phim trong danh sách, kèm poster và nút vào trang chi tiết/lịch chiếu.
export function MovieCard({ movie }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#181a22] transition hover:-translate-y-1 hover:border-[#f5c84c]">
      <Link to={`/detail/${movie.id}`}>
        <img className="h-72 w-full object-cover" src={movie.poster} alt={movie.title} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex min-h-20 items-start justify-between gap-3">
          <Link className="transition hover:text-[#f5c84c]" to={`/detail/${movie.id}`}>
            <h3 className="line-clamp-3 text-xl font-bold leading-tight">{movie.title}</h3>
          </Link>
          <span className="mt-1 shrink-0 rounded bg-[#f5c84c] px-2 py-1 text-xs font-black text-slate-950">
            {movie.age}
          </span>
        </div>
        <p className="mb-5 min-h-5 text-sm text-slate-400">{movie.genre}</p>
        <Link
          className="mt-auto block w-full rounded-md bg-white px-4 py-3 text-center text-sm font-black text-slate-950"
          to={`/detail/${movie.id}`}
        >
          Chi tiết & lịch chiếu
        </Link>
      </div>
    </article>
  );
}
