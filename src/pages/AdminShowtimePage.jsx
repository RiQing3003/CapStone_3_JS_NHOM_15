import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import {
  createShowtime,
  getApiConfig,
  getMovieInfo,
  getTheaterClusters,
  getTheaterSystems,
} from "../services/movieApi";
import { getStoredAccessToken, getStoredUser } from "../utils/authStorage";
import { formatCurrency } from "../utils/format";

// Định dạng Date thành chuỗi dd/MM/yyyy HH:mm:ss đúng yêu cầu API tạo lịch chiếu.
function formatShowtimeDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}:00`;
}

// Tạo ngày chiếu mặc định sau hiện tại một tuần để tránh chọn ngày quá khứ.
function getDefaultShowtimeDate() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  return formatShowtimeDate(nextWeek);
}

// Gợi ý ngày chiếu dựa trên ngày khởi chiếu của phim.
function getSuggestedShowtimeDate(movie) {
  if (!movie?.releaseDate) {
    return getDefaultShowtimeDate();
  }

  const releaseDate = new Date(movie.releaseDate);

  if (Number.isNaN(releaseDate.getTime())) {
    return getDefaultShowtimeDate();
  }

  const suggestedDate = new Date(Math.max(releaseDate.getTime(), new Date().getTime()));
  suggestedDate.setDate(suggestedDate.getDate() + 1);
  suggestedDate.setHours(14, 30, 0, 0);

  return formatShowtimeDate(suggestedDate);
}

// Parse và kiểm tra chuỗi ngày chiếu admin nhập vào.
function parseShowtimeDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year, hour, minute, second] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsedDate;
}

// Tạo thông báo lỗi dễ hiểu hơn khi API tạo lịch chiếu trả lỗi.
function getCreateShowtimeErrorMessage(error, payload, selectedCluster, selectedScreen) {
  const apiMessage = error.message || "Không thể tạo lịch chiếu. Vui lòng kiểm tra lại dữ liệu.";

  if (!apiMessage.toLowerCase().includes("cụm rạp")) {
    return apiMessage;
  }

  return [
    apiMessage,
    `Phim ${payload.maPhim}, ${selectedScreen?.tenRap ?? "rạp đã chọn"}, suất ${payload.ngayChieuGioChieu}.`,
    selectedCluster && selectedScreen
      ? `Rạp đang chọn thuộc ${selectedCluster.tenCumRap}.`
      : "",
    "Vui lòng thử cụm rạp khác hoặc liên hệ quản trị hệ thống.",
  ]
    .filter(Boolean)
    .join(" ");
}

// Trang admin tạo lịch chiếu cho một phim theo hệ thống rạp, cụm rạp và rạp đã chọn.
export function AdminShowtimePage() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [form, setForm] = useState({
    maPhim: Number(movieId),
    ngayChieuGioChieu: getDefaultShowtimeDate(),
    maRap: "",
    giaVe: 75000,
  });
  const [theaterSystems, setTheaterSystems] = useState([]);
  const [theaterClusters, setTheaterClusters] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([getMovieInfo(movieId), getTheaterSystems()]).then(([nextMovie, systems]) => {
      if (isActive) {
        const firstSystem = systems[0];

        setMovie(nextMovie);
        setTheaterSystems(systems);
        setSelectedSystemId(firstSystem?.maHeThongRap ?? "");
        setForm((currentForm) => ({
          ...currentForm,
          ngayChieuGioChieu: getSuggestedShowtimeDate(nextMovie),
        }));
      }
    });

    return () => {
      isActive = false;
    };
  }, [movieId]);

  useEffect(() => {
    let isActive = true;

    if (selectedSystemId) {
      getTheaterClusters(selectedSystemId).then((clusters) => {
        if (isActive) {
          const firstCluster = clusters.find((cluster) => cluster.danhSachRap?.length) ?? clusters[0];
          const firstScreen = firstCluster?.danhSachRap?.[0];

          setTheaterClusters(clusters);
          setSelectedClusterId(firstCluster?.maCumRap ?? "");
          setForm((currentForm) => ({
            ...currentForm,
            maRap: firstScreen?.maRap ?? "",
          }));
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [selectedSystemId]);

  const selectedCluster = theaterClusters.find((cluster) => cluster.maCumRap === selectedClusterId);
  const visibleScreens = selectedCluster?.danhSachRap ?? [];
  const selectedScreen = visibleScreens.find((screen) => String(screen.maRap) === String(form.maRap));
  const showtimePayload = {
    maPhim: Number(form.maPhim),
    ngayChieuGioChieu: form.ngayChieuGioChieu,
    maRap: String(form.maRap),
    giaVe: Number(form.giaVe),
  };

  // Validate dữ liệu form và gửi payload TaoLichChieu lên server.
  async function handleSubmit(event) {
    event.preventDefault();

    const storedUser = getStoredUser();

    if (storedUser?.maLoaiNguoiDung !== "QuanTri" || !getStoredAccessToken()) {
      setMessage("Bạn cần đăng nhập bằng tài khoản admin trước khi tạo lịch chiếu.");
    return;
    }

    const groupCode = getApiConfig().groupCode;

    if (storedUser.maNhom && storedUser.maNhom !== groupCode) {
      setMessage("Tài khoản admin không phù hợp với hệ thống hiện tại. Vui lòng đăng nhập lại.");
      return;
    }

    const parsedDate = parseShowtimeDate(form.ngayChieuGioChieu);

    if (!parsedDate) {
      setMessage("Ngày chiếu phải đúng định dạng dd/MM/yyyy HH:mm:ss, ví dụ 31/08/2026 14:30:00.");
    return;
    }

    if (parsedDate <= new Date()) {
      setMessage("Ngày chiếu phải lớn hơn ngày hiện tại. Ví dụ hôm nay là 10/08/2026 thì không dùng 31/07/2026 được.");
      return;
    }

    if (movie?.releaseDate) {
      const releaseDate = new Date(movie.releaseDate);

      if (!Number.isNaN(releaseDate.getTime()) && parsedDate < releaseDate) {
        setMessage(
          `Suất chiếu phải sau ngày khởi chiếu của phim (${formatShowtimeDate(releaseDate)}). Hãy chọn ngày từ ${
            formatShowtimeDate(releaseDate).split(" ")[0]
          } trở đi.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    setMessage("Đang tạo lịch chiếu...");

    try {
      await createShowtime(showtimePayload);
      setMessage("Tạo lịch chiếu thành công. Bạn có thể mở trang chi tiết phim để kiểm tra.");
    } catch (error) {
      setMessage(getCreateShowtimeErrorMessage(error, showtimePayload, selectedCluster, selectedScreen));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cập nhật một field trong form tạo lịch chiếu.
  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  return (
    <AdminShell title="Tạo lịch chiếu">
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <form className="rounded-lg border border-white/10 bg-[#181a22] p-6" onSubmit={handleSubmit}>
          <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-300">
              Chọn hệ thống rạp, cụm rạp, phòng chiếu và thời gian để mở bán vé cho phim.
            </p>
            <Link className="text-sm font-bold text-[#f5c84c]" to="/admin/movies">
              Quay lại phim
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Mã phim" name="maPhim" onChange={updateField} type="number" value={form.maPhim} />
            <label className="block text-sm font-semibold text-slate-300">
              Hệ thống rạp
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
                onChange={(event) => {
                  const nextSystemId = event.target.value;

                  setSelectedSystemId(nextSystemId);
                }}
                required
                value={selectedSystemId}
              >
                {theaterSystems.map((system) => (
                  <option key={system.maHeThongRap} value={system.maHeThongRap}>
                    {system.tenHeThongRap}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Cụm rạp
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
                onChange={(event) => {
                  const nextClusterId = event.target.value;
                  const nextCluster = theaterClusters.find((cluster) => cluster.maCumRap === nextClusterId);
                  const nextScreen = nextCluster?.danhSachRap?.[0];

                  setSelectedClusterId(nextClusterId);
                  updateField("maRap", nextScreen?.maRap ?? "");
                }}
                required
                value={selectedClusterId}
              >
                {theaterClusters.map((cluster) => (
                  <option key={cluster.maCumRap} value={cluster.maCumRap}>
                    {cluster.tenCumRap}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Rạp
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
                onChange={(event) => updateField("maRap", event.target.value)}
                required
                value={form.maRap}
              >
                {visibleScreens.map((screen) => (
                  <option key={screen.maRap} value={screen.maRap}>
                    {screen.tenRap}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Ngày chiếu giờ chiếu"
              name="ngayChieuGioChieu"
              onChange={updateField}
              placeholder="10/10/2026 14:30:00"
              value={form.ngayChieuGioChieu}
            />
            <Field label="Giá vé" name="giaVe" onChange={updateField} type="number" value={form.giaVe} />
          </div>

          <button
            className="mt-6 rounded-md bg-[#f26b38] px-5 py-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isSubmitting || !form.maRap}
          >
            {isSubmitting ? "Đang tạo..." : "Tạo lịch chiếu"}
          </button>
          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        </form>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-5">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#f5c84c]">Thông tin lịch chiếu</p>
          {movie && (
            <div className="mt-4 flex gap-4 rounded-lg bg-white/[.03] p-4">
              <img className="h-24 w-16 rounded object-cover" src={movie.poster} alt={movie.title} />
              <div>
                <p className="font-black">{movie.title}</p>
                <p className="mt-1 text-sm text-slate-400">Mã phim: {form.maPhim}</p>
              </div>
            </div>
          )}
          <dl className="mt-5 space-y-3 text-sm">
            <Summary label="Cụm rạp" value={selectedCluster?.tenCumRap ?? "Chưa chọn"} />
            <Summary label="Địa chỉ" value={selectedCluster?.diaChi ?? "Chưa chọn"} />
            <Summary label="Rạp" value={selectedScreen ? selectedScreen.tenRap : "Chưa chọn"} />
            <Summary label="Khởi chiếu" value={movie?.releaseDate ? formatShowtimeDate(new Date(movie.releaseDate)) : "Chưa có"} />
            <Summary label="Suất chiếu" value={form.ngayChieuGioChieu} />
            <Summary label="Giá vé" value={formatCurrency(Number(form.giaVe) || 0)} />
          </dl>
        </aside>
      </div>
    </AdminShell>
  );
}

// Input dùng chung cho mã phim, ngày chiếu và giá vé.
function Field({ label, name, onChange, placeholder = "", type = "text", value }) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

// Dòng tóm tắt thông tin lịch chiếu chuẩn bị gửi API.
function Summary({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
