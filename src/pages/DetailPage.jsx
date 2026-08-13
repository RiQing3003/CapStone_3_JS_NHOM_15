import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { getMovieDetail } from "../services/movieApi";
import { formatCurrency } from "../utils/format";

// Trang chi tiết phim: lấy thông tin phim và danh sách suất chiếu để khách chọn vé.
export function DetailPage() {
  const { movieId } = useParams();
  const [detailState, setDetailState] = useState({ isLoaded: false, movieId: null, movie: null });

  useEffect(() => {
    let isActive = true;

    getMovieDetail(movieId).then((movie) => {
      if (isActive) {
        setDetailState({ isLoaded: true, movieId, movie });
      }
    });

    return () => {
      isActive = false;
    };
  }, [movieId]);

  if (detailState.movieId !== movieId || !detailState.isLoaded) {
    return (
      <main className="min-h-screen bg-[#0f1015] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-16 text-slate-300">Đang tải chi tiết phim...</div>
      </main>
    );
  }

  const movie = detailState.movie;

  if (!movie) {
    return (
      <main className="min-h-screen bg-[#0f1015] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-16 text-slate-300">
          Không thể tải chi tiết phim từ server. Vui lòng thử lại sau.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <section className="relative isolate overflow-hidden">
        <img
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
          src={movie.backdrop || movie.poster}
          alt=""
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0f1015_0%,rgba(15,16,21,.92)_50%,rgba(15,16,21,.62)_100%)]" />
        <SiteHeader />

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[300px_1fr] lg:py-20">
          <img
            className="h-[430px] w-full rounded-lg object-cover shadow-2xl shadow-black/40"
            src={movie.poster}
            alt={movie.title}
          />
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[.22em] text-[#f5c84c]">Chi tiết phim</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.12] md:text-5xl">{movie.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200">{movie.description}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              <InfoPill label="Trạng thái" value={movie.genre} />
              <InfoPill label="Thời lượng" value={`${movie.duration} phút`} />
              <InfoPill label="Độ tuổi" value={movie.age} />
              <InfoPill label="Đánh giá" value={`${movie.rating}/10`} />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                className="rounded-md border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:border-[#f5c84c]"
                href={movie.trailer || undefined}
                rel="noreferrer"
                target={movie.trailer ? "_blank" : undefined}
              >
                Xem trailer
              </a>
              <button
                className="rounded-md bg-[#f26b38] px-5 py-3 text-sm font-black text-white"
                onClick={() => document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" })}
                type="button"
              >
                Chọn suất chiếu
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="showtimes" className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Lịch chiếu</p>
            <h2 className="mt-2 text-3xl font-black">Chọn rạp và suất chiếu</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Bấm vào suất chiếu phù hợp để chọn ghế và hoàn tất đặt vé.
          </p>
        </div>

        {movie.showtimes.length ? (
          <div className="grid gap-3">
            {movie.showtimes.map((showtime) => (
              <Link
                className="grid gap-4 rounded-lg border border-white/10 bg-white/[.03] p-5 transition hover:border-[#f5c84c] hover:bg-[#f5c84c]/10 md:grid-cols-[1fr_auto] md:items-center"
                key={showtime.id}
                to={`/ticketroom/${showtime.id}`}
              >
                <span>
                  <span className="block text-lg font-black">{showtime.cinema}</span>
                  <span className="mt-1 block text-sm text-slate-400">{showtime.room}</span>
                </span>
                <span className="flex flex-wrap items-center gap-4">
                  <span className="rounded-md bg-[#f5c84c] px-4 py-3 text-xl font-black text-slate-950">
                    {showtime.time}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">{formatCurrency(showtime.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[.03] p-8 text-slate-300">
            Phim này hiện chưa có lịch chiếu. Vui lòng quay lại sau hoặc chọn phim khác.
          </div>
        )}
      </section>
    </main>
  );
}

// Ô thông tin ngắn như trạng thái, thời lượng, độ tuổi và đánh giá.
function InfoPill({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[.16em] text-slate-400">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
