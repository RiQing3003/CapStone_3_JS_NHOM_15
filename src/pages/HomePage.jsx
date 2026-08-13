import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MovieCard } from "../components/MovieCard";
import { SiteHeader } from "../components/SiteHeader";
import {
  getBanners,
  getMovieInfo,
  getMovies,
  getTheaterClusters,
  getTheaterScheduleSystems,
  getTheaterSystems,
} from "../services/movieApi";

const HIDDEN_BANNER_MOVIE_IDS = new Set([1282]);

// Định dạng giờ chiếu ngắn để nút suất chiếu dễ đọc trong section rạp.
function formatShortShowtime(dateValue) {
  const showtimeDate = new Date(dateValue);

  if (Number.isNaN(showtimeDate.getTime())) {
    return dateValue;
  }

  return showtimeDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Trang chủ khách hàng: load phim, banner, hệ thống rạp và render các section chính.
export function HomePage({ scrollToSection = "" }) {
  const [movies, setMovies] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerMovieDetails, setBannerMovieDetails] = useState({});
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [theaterSystems, setTheaterSystems] = useState([]);
  const [theaterClusters, setTheaterClusters] = useState([]);
  const [theaterScheduleSystems, setTheaterScheduleSystems] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMovies(), getBanners(), getTheaterSystems()])
      .then(([nextMovies, nextBanners, nextSystems]) => {
        const visibleBanners = nextBanners.filter((banner) => !HIDDEN_BANNER_MOVIE_IDS.has(Number(banner.movieId)));

        setMovies(nextMovies);
        setBanners(visibleBanners);
        setTheaterSystems(nextSystems);
        setSelectedSystemId(nextSystems[0]?.maHeThongRap ?? "");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!scrollToSection) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      document.getElementById(scrollToSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => window.clearTimeout(timerId);
  }, [scrollToSection]);

  useEffect(() => {
    let isActive = true;

    if (selectedSystemId) {
      Promise.all([getTheaterClusters(selectedSystemId), getTheaterScheduleSystems(selectedSystemId)]).then(
        ([clusters, scheduleSystems]) => {
          if (isActive) {
            setTheaterClusters(clusters);
            setTheaterScheduleSystems(scheduleSystems);
          }
        },
      );
    }

    return () => {
      isActive = false;
    };
  }, [selectedSystemId]);

  const activeBanner = banners[activeBannerIndex];
  const activeBannerMovieId = activeBanner?.movieId;
  const movieFromList = movies.find((movie) => movie.id === activeBannerMovieId);
  const movieFromBanner = activeBannerMovieId ? bannerMovieDetails[activeBannerMovieId] : null;

  useEffect(() => {
    let isActive = true;

    if (activeBannerMovieId && !movieFromList && !movieFromBanner) {
      getMovieInfo(activeBannerMovieId).then((movie) => {
        if (isActive && movie) {
          setBannerMovieDetails((currentDetails) => ({
            ...currentDetails,
            [activeBannerMovieId]: movie,
          }));
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [activeBannerMovieId, movieFromList, movieFromBanner]);

  const featuredMovie = movieFromList ?? movieFromBanner ?? movies[0];
  const heroImage = activeBanner?.image ?? featuredMovie?.backdrop;
  const selectedScheduleSystem =
    theaterScheduleSystems.find((system) => system.maHeThongRap === selectedSystemId) ?? theaterScheduleSystems[0];
  const scheduleClustersById = {};

  for (const cluster of selectedScheduleSystem?.lstCumRap ?? []) {
    scheduleClustersById[cluster.maCumRap] = cluster;
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <section className="relative isolate overflow-hidden">
        {heroImage && (
          <img
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
            src={heroImage}
            alt=""
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0f1015_0%,rgba(15,16,21,.86)_42%,rgba(15,16,21,.35)_100%)]" />
        <SiteHeader />

        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[.22em] text-[#f5c84c]">
              Đặt vé xem phim trực tuyến
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.14] md:text-5xl lg:text-6xl">
              {featuredMovie?.title ?? "CyberMovie Booking"}
            </h1>
            <p className="mt-5 line-clamp-3 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              {featuredMovie?.description ??
                "Khám phá phim đang chiếu, xem lịch chiếu theo rạp và chọn ghế trong một quy trình đặt vé gọn gàng."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-4 py-2">Phim đang chiếu</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Chọn ghế trực quan</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Lịch chiếu cập nhật</span>
            </div>
            {banners.length > 1 && (
              <div className="mt-8 flex gap-2">
                {banners.map((banner, index) => (
                  <button
                    className={`h-2.5 rounded-full transition ${
                      index === activeBannerIndex ? "w-10 bg-[#f5c84c]" : "w-2.5 bg-white/30"
                    }`}
                    key={banner.id}
                    onClick={() => setActiveBannerIndex(index)}
                    title={banner.title}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>

          {featuredMovie && (
            <aside className="w-full max-w-xl rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur lg:ml-auto">
              <p className="text-sm font-semibold text-slate-200">Phim nổi bật</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-xl font-bold leading-snug">{featuredMovie.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {featuredMovie.genre} - {featuredMovie.rating}/10
                  </p>
                </div>
                <Link
                  className="shrink-0 rounded-full bg-[#f26b38] px-5 py-3 text-center text-sm font-bold"
                  to={`/detail/${featuredMovie.id}`}
                >
                  Đặt vé
                </Link>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section id="movies" className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">
              Đang chiếu
            </p>
            <h2 className="mt-2 text-3xl font-black">Danh sách phim</h2>
          </div>
          <p className="hidden max-w-md text-right text-sm text-slate-400 md:block">
            Chọn phim yêu thích, xem lịch chiếu và đặt vé trong vài bước.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-white/10 bg-white/[.03] p-8 text-slate-300">
            Đang tải danh sách phim...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      <section id="showtimes" className="border-y border-white/10 bg-[#151720]">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">
                Hệ thống rạp
              </p>
              <h2 className="mt-2 text-3xl font-black">Lịch chiếu theo rạp</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Chọn hệ thống rạp để xem các cụm rạp và phòng chiếu hiện có.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-lg border border-white/10 bg-[#181a22] lg:grid-cols-[300px_1fr]">
            <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <div className="grid gap-2">
                {theaterSystems.map((system) => (
                  <button
                    className={`flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                      system.maHeThongRap === selectedSystemId
                        ? "bg-[#f5c84c] text-slate-950"
                        : "bg-white/[.03] text-slate-300 hover:bg-white/10"
                    }`}
                    key={system.maHeThongRap}
                    onClick={() => setSelectedSystemId(system.maHeThongRap)}
                    type="button"
                  >
                    {system.logo && (
                      <img
                        className="h-9 w-9 rounded-md bg-white p-1 object-contain"
                        src={system.logo}
                        alt=""
                      />
                    )}
                    <span>{system.tenHeThongRap}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-5">
              {theaterClusters.length ? (
                theaterClusters.map((cluster) => {
                  const scheduleCluster = scheduleClustersById[cluster.maCumRap];
                  const moviesInCluster = scheduleCluster?.danhSachPhim ?? [];

                  return (
                    <article className="rounded-lg border border-white/10 bg-white/[.03] p-5" key={cluster.maCumRap}>
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <h3 className="text-lg font-black">{cluster.tenCumRap}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-400">{cluster.diaChi}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
                          {cluster.danhSachRap?.slice(0, 10).map((screen) => (
                            <span
                              className="rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-950"
                              key={screen.maRap}
                            >
                              {screen.tenRap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {moviesInCluster.length ? (
                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {moviesInCluster.slice(0, 6).map((movie) => (
                            <article
                              className="grid grid-cols-[76px_1fr] gap-3 rounded-md border border-white/10 bg-[#11131a] p-3"
                              key={movie.maPhim}
                            >
                              <img
                                className="h-28 w-[76px] rounded object-cover"
                                src={movie.hinhAnh}
                                alt={movie.tenPhim}
                              />
                              <div className="min-w-0">
                                <h4 className="line-clamp-2 text-sm font-black leading-snug">{movie.tenPhim}</h4>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                                  {movie.dangChieu && (
                                    <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-300">
                                      Đang chiếu
                                    </span>
                                  )}
                                  {movie.sapChieu && (
                                    <span className="rounded-full bg-[#f5c84c]/15 px-2 py-1 text-[#f5c84c]">
                                      Sắp chiếu
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {(movie.lstLichChieuTheoPhim ?? []).slice(0, 3).map((showtime) => (
                                    <Link
                                      className="rounded-md bg-white px-2.5 py-1.5 text-xs font-black text-slate-950 hover:bg-[#f5c84c]"
                                      key={showtime.maLichChieu}
                                      to={`/ticketroom/${showtime.maLichChieu}`}
                                    >
                                      {formatShortShowtime(showtime.ngayChieuGioChieu)}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-5 rounded-md bg-white/[.03] px-4 py-3 text-sm text-slate-400">
                          Cụm rạp này hiện chưa có phim đang hoặc sắp chiếu.
                        </p>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[.03] p-8 text-slate-300">
                  Đang tải thông tin cụm rạp...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
