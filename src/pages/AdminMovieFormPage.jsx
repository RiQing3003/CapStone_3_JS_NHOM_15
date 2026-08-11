import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { createMovie, getApiConfig, getMovieInfo, updateMovie } from "../services/movieApi";
import { getStoredAccessToken, getStoredUser } from "../utils/authStorage";

const initialMovie = {
  maPhim: "",
  tenPhim: "",
  trailer: "",
  moTa: "",
  maNhom: getApiConfig().groupCode,
  ngayKhoiChieu: "10/10/2026",
  sapChieu: true,
  dangChieu: true,
  hot: true,
  danhGia: 10,
  hinhAnh: null,
  posterUrl: "",
};

// Tải lại poster hiện tại thành File để API cập nhật phim luôn có dữ liệu hình ảnh.
async function fileFromImageUrl(imageUrl, movieTitle) {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const extension = blob.type.split("/")[1] || "jpg";
    const safeName = (movieTitle || "poster")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new File([blob], `${safeName || "poster"}.${extension}`, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}

// Form admin dùng chung cho thêm phim mới và sửa thông tin phim.
export function AdminMovieFormPage() {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const isEdit = Boolean(movieId);
  const [movie, setMovie] = useState({ ...initialMovie, maPhim: movieId ?? "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadedImagePreview = useMemo(() => {
    if (!movie.hinhAnh) return "";
    return URL.createObjectURL(movie.hinhAnh);
  }, [movie.hinhAnh]);
  const imagePreview = uploadedImagePreview || movie.posterUrl;

  useEffect(() => {
    return () => {
      if (uploadedImagePreview) {
        URL.revokeObjectURL(uploadedImagePreview);
      }
    };
  }, [uploadedImagePreview]);

  useEffect(() => {
    let isActive = true;

    if (isEdit) {
      getMovieInfo(movieId).then((detail) => {
        if (isActive && detail) {
          setMovie((currentMovie) => ({
            ...currentMovie,
            maPhim: detail.id,
            tenPhim: detail.title,
            trailer: detail.trailer ?? "",
            moTa: detail.description ?? "",
            maNhom: detail.maNhom ?? currentMovie.maNhom,
            ngayKhoiChieu: detail.releaseDateForForm || currentMovie.ngayKhoiChieu,
            sapChieu: detail.sapChieu ?? currentMovie.sapChieu,
            dangChieu: detail.dangChieu ?? currentMovie.dangChieu,
            hot: detail.hot ?? currentMovie.hot,
            danhGia: detail.rating ?? 10,
            posterUrl: detail.poster ?? "",
          }));
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [isEdit, movieId]);

  // Cập nhật một field trong state form phim.
  function updateField(field, value) {
    setMovie((currentMovie) => ({ ...currentMovie, [field]: value }));
  }

  // Validate và gửi request thêm/sửa phim lên API.
  async function handleSubmit(event) {
    event.preventDefault();

    const storedUser = getStoredUser();

    if (storedUser?.maLoaiNguoiDung !== "QuanTri" || !getStoredAccessToken()) {
      setMessage("Bạn cần đăng nhập bằng tài khoản admin trước khi thêm hoặc sửa phim.");
      return;
    }

    if (!isEdit && !movie.hinhAnh) {
      setMessage("Vui lòng chọn file hình trước khi thêm phim.");
      return;
    }

    setIsSubmitting(true);
    setMessage(isEdit ? "Đang cập nhật phim..." : "Đang thêm phim...");

    try {
      let submitMovie = movie;

      if (isEdit && !movie.hinhAnh) {
        setMessage("Đang lấy lại poster hiện tại để gửi API cập nhật...");
        const currentPosterFile = await fileFromImageUrl(movie.posterUrl, movie.tenPhim);

        if (!currentPosterFile) {
          setMessage("Không tải lại được poster hiện tại. Vui lòng chọn file hình rồi cập nhật lại.");
          return;
        }

        submitMovie = { ...movie, hinhAnh: currentPosterFile };
      }

      const payload = {
        ...submitMovie,
        maPhim: submitMovie.maPhim ? Number(submitMovie.maPhim) : "",
        danhGia: Number(submitMovie.danhGia),
      };

      if (isEdit) {
        await updateMovie(payload);
      } else {
        await createMovie(payload);
      }

      setMessage(isEdit ? "Cập nhật phim thành công." : "Thêm phim thành công.");
      window.setTimeout(() => navigate("/admin/movies"), 700);
    } catch (error) {
      setMessage(error.message || "Không thể lưu phim. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminShell title={isEdit ? "Sửa phim" : "Thêm phim"}>
      <form className="grid gap-6 xl:grid-cols-[1fr_320px]" onSubmit={handleSubmit}>
        <section className="rounded-lg border border-white/10 bg-[#181a22] p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-300">
              Nhập thông tin phim, lịch khởi chiếu và poster để hiển thị trên hệ thống.
            </p>
            <Link className="text-sm font-bold text-[#f5c84c]" to="/admin/movies">
              Quay lại danh sách
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {isEdit && <Field label="Mã phim" name="maPhim" onChange={updateField} type="number" value={movie.maPhim} />}
            <Field label="Tên phim" name="tenPhim" onChange={updateField} value={movie.tenPhim} />
            <Field label="Trailer" name="trailer" onChange={updateField} value={movie.trailer} />
            <Field label="Ngày khởi chiếu" name="ngayKhoiChieu" onChange={updateField} value={movie.ngayKhoiChieu} />
            <Field label="Đánh giá" name="danhGia" onChange={updateField} max="10" min="1" type="number" value={movie.danhGia} />
            <label className="block text-sm font-semibold text-slate-300 md:col-span-2">
              Hình ảnh
              <input
                accept="image/*"
                className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 file:mr-4 file:rounded file:border-0 file:bg-[#f5c84c] file:px-3 file:py-2 file:font-bold"
                onChange={(event) => updateField("hinhAnh", event.target.files?.[0] ?? null)}
                required={!isEdit}
                type="file"
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-300">
            Mô tả
            <textarea
              className="mt-2 min-h-36 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
              onChange={(event) => updateField("moTa", event.target.value)}
              required
              value={movie.moTa}
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
            <Checkbox checked={movie.sapChieu} label="Sắp chiếu" name="sapChieu" onChange={updateField} />
            <Checkbox checked={movie.dangChieu} label="Đang chiếu" name="dangChieu" onChange={updateField} />
            <Checkbox checked={movie.hot} label="Hot" name="hot" onChange={updateField} />
          </div>

          <button
            className="mt-6 rounded-md bg-[#f26b38] px-5 py-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : isEdit ? "Cập nhật phim" : "Thêm phim"}
          </button>
          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        </section>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-5">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#f5c84c]">Xem trước</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-white/[.03]">
            {imagePreview ? (
              <img className="h-80 w-full object-cover" src={imagePreview} alt="Preview phim" />
            ) : (
              <div className="grid h-80 place-items-center px-6 text-center text-sm text-slate-500">
                Chọn file ảnh để xem trước poster phim.
              </div>
            )}
            <div className="p-4">
              <p className="line-clamp-2 font-black">{movie.tenPhim || "Tên phim"}</p>
              <p className="mt-1 text-sm text-slate-400">{movie.dangChieu ? "Đang chiếu" : "Sắp chiếu"}</p>
            </div>
          </div>
        </aside>
      </form>
    </AdminShell>
  );
}

// Input text/number dùng chung trong form phim.
function Field({ label, max, min, name, onChange, type = "text", value }) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#f5c84c]"
        max={max}
        min={min}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

// Checkbox dùng cho các trạng thái sắp chiếu/đang chiếu/hot của phim.
function Checkbox({ checked, label, name, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <input
        checked={checked}
        className="h-4 w-4 accent-[#f5c84c]"
        onChange={(event) => onChange(name, event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
