import { MOVIE_API_CONFIG } from "../config/movieConfig";
import { getStoredAccessToken, getStoredUser } from "../utils/authStorage";

const API_BASE_URL = MOVIE_API_CONFIG.baseUrl;
const GROUP_CODE = MOVIE_API_CONFIG.groupCode;
const CYBERSOFT_TOKEN = MOVIE_API_CONFIG.cybersoftToken;

// Đổi ngày từ server sang định dạng dd/MM/yyyy để form phim hiển thị đúng yêu cầu API.
function formatDateForMovieForm(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue || "";
  }

  return date.toLocaleDateString("vi-VN");
}

// Trả về cấu hình API hiện tại để các trang biết base URL, mã nhóm và token đã có chưa.
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    groupCode: GROUP_CODE,
    isConfigured: Boolean(API_BASE_URL),
    hasCybersoftToken: Boolean(CYBERSOFT_TOKEN),
  };
}

// Goi API goc: tu gan TokenCybersoft va lay message loi tu server neu request that bai.
async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("Missing movie API base URL");
  }

  const { headers: optionHeaders, ...requestOptions } = options;
  const isFormData = requestOptions.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(CYBERSOFT_TOKEN ? { TokenCybersoft: CYBERSOFT_TOKEN } : {}),
      ...optionHeaders,
    },
  });

  if (!response.ok) {
    let errorMessage = `API ${response.status}: ${path}`;

    try {
      const errorPayload = await response.json();
      errorMessage =
        errorPayload.content ||
        errorPayload.message ||
        errorPayload.Message ||
        errorPayload.title ||
        errorMessage;
    } catch {
      try {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // Keep the status-based message when the response body cannot be read.
      }
    }

    throw new Error(errorMessage);
  }

  const payload = await response.json();
  return payload.content ?? payload;
}

// Goi cac API can dang nhap: bo sung Bearer token cua user/admin hien tai.
async function authorizedRequest(path, options = {}) {
  const token = getStoredAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Chuan hoa du lieu phim tu API CyberSoft ve format card/banner cua giao dien.
function normalizeMovie(movie) {
  return {
    id: movie.maPhim,
    maPhim: movie.maPhim,
    title: movie.tenPhim,
    genre: movie.dangChieu ? "Đang chiếu" : "Sắp chiếu",
    maNhom: movie.maNhom,
    sapChieu: Boolean(movie.sapChieu),
    dangChieu: Boolean(movie.dangChieu),
    hot: Boolean(movie.hot),
    duration: 120,
    rating: movie.danhGia ?? 8,
    age: "T13",
    poster: movie.hinhAnh,
    backdrop: movie.hinhAnh,
    description: movie.moTa,
    trailer: movie.trailer,
    releaseDate: movie.ngayKhoiChieu,
    releaseDateForForm: formatDateForMovieForm(movie.ngayKhoiChieu),
    showtimes: [],
  };
}

// Chuẩn hóa lịch chiếu từ API về format trang chi tiết phim đang dùng.
function normalizeShowtime(showtime) {
  const startTime = new Date(showtime.ngayChieuGioChieu);

  return {
    id: showtime.maLichChieu,
    cinema: showtime.tenCumRap,
    room: showtime.tenRap,
    time: Number.isNaN(startTime.getTime())
      ? showtime.ngayChieuGioChieu
      : startTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    price: showtime.giaVe,
  };
}

// Chuẩn hóa dữ liệu ghế từ API phòng vé về format sơ đồ ghế của UI.
function normalizeSeat(seat) {
  return {
    id: String(seat.maGhe),
    name: seat.tenGhe,
    type: seat.loaiGhe === "Vip" ? "vip" : "standard",
    booked: seat.daDat,
    price: seat.giaVe,
  };
}

// Chuẩn hóa banner từ API để hero carousel biết ảnh và mã phim tương ứng.
function normalizeBanner(banner) {
  return {
    id: banner.maBanner,
    movieId: banner.maPhim,
    image: banner.hinhAnh,
    title: `Banner ${banner.maBanner}`,
  };
}

// Lấy danh sách banner từ server CyberSoft cho carousel trang chủ.
export async function getBanners() {
  try {
    const banners = await request("/QuanLyPhim/LayDanhSachBanner");
    return banners.map(normalizeBanner);
  } catch {
    return [];
  }
}

// Lấy danh sách phim theo mã nhóm đang cấu hình.
export async function getMovies() {
  try {
    const movies = await request(`/QuanLyPhim/LayDanhSachPhim?MaNhom=${GROUP_CODE}`);
    return movies.map(normalizeMovie);
  } catch {
    return [];
  }
}

// Lấy thông tin cơ bản của một phim, dùng cho form sửa phim và trang admin.
export async function getMovieInfo(movieId) {
  try {
    const movie = await request(`/QuanLyPhim/LayThongTinPhim?MaPhim=${movieId}`);
    return normalizeMovie(movie);
  } catch {
    return null;
  }
}

// Lay thong tin phim kem lich chieu de render trang chi tiet phim.
export async function getMovieDetail(movieId) {
  try {
    const detail = await request(`/QuanLyRap/LayThongTinLichChieuPhim?MaPhim=${movieId}`);
    const movie = normalizeMovie(detail);
    const showtimes =
      detail.heThongRapChieu?.flatMap((system) =>
        system.cumRapChieu.flatMap((cinema) =>
          cinema.lichChieuPhim.map((showtime) =>
            normalizeShowtime({
              ...showtime,
              tenCumRap: cinema.tenCumRap,
            }),
          ),
        ),
      ) ?? [];

    return {
      ...movie,
      showtimes,
    };
  } catch {
    return null;
  }
}

// Lấy thông tin phòng vé gồm thông tin phim và danh sách ghế theo mã lịch chiếu.
export async function getTicketRoom(showtimeId) {
  try {
    const room = await request(`/QuanLyDatVe/LayDanhSachPhongVe?MaLichChieu=${showtimeId}`);
    return {
      movieInfo: room.thongTinPhim,
      seats: room.danhSachGhe.map(normalizeSeat),
    };
  } catch {
    return {
      movieInfo: null,
      seats: [],
    };
  }
}

// Gửi thông tin đăng nhập và nhận lại user kèm accessToken.
export async function login(credentials) {
  return request("/QuanLyNguoiDung/DangNhap", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Đăng ký tài khoản khách hàng mới và ép maNhom theo nhóm hiện tại của project.
export async function register(account) {
  return request("/QuanLyNguoiDung/DangKy", {
    method: "POST",
    body: JSON.stringify({ ...account, maNhom: GROUP_CODE }),
  });
}

// Gui danh sach ghe da chon len API DatVe cua CyberSoft.
export async function bookTickets({ showtimeId, seats }) {
  return authorizedRequest("/QuanLyDatVe/DatVe", {
    method: "POST",
    body: JSON.stringify({
      maLichChieu: Number(showtimeId),
      danhSachVe: seats.map((seat) => ({
        maGhe: Number(seat.id),
        giaVe: seat.price,
      })),
    }),
  });
}

// Lấy hoặc tìm kiếm người dùng trong đúng mã nhóm của project.
export async function getUsers(keyword = "") {
  try {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      const users = await authorizedRequest(`/QuanLyNguoiDung/LayDanhSachNguoiDung?MaNhom=${GROUP_CODE}`);
      return users.map((user) => ({ ...user, maNhom: user.maNhom || GROUP_CODE }));
    }

    const search = encodeURIComponent(normalizedKeyword);
    const users = await authorizedRequest(`/QuanLyNguoiDung/TimKiemNguoiDung?MaNhom=${GROUP_CODE}&tuKhoa=${search}`);
    return users.map((user) => ({ ...user, maNhom: user.maNhom || GROUP_CODE }));
  } catch {
    return [];
  }
}

// Admin thêm người dùng mới vào đúng mã nhóm của project.
export async function createUser(user) {
  return authorizedRequest("/QuanLyNguoiDung/ThemNguoiDung", {
    method: "POST",
    body: JSON.stringify({ ...user, maNhom: GROUP_CODE }),
  });
}

// Admin cập nhật thông tin người dùng hiện có.
export async function updateUser(user) {
  return authorizedRequest("/QuanLyNguoiDung/CapNhatThongTinNguoiDung", {
    method: "POST",
    body: JSON.stringify({ ...user, maNhom: GROUP_CODE }),
  });
}

// Admin xóa người dùng theo tài khoản.
export async function deleteUser(username) {
  return authorizedRequest(`/QuanLyNguoiDung/XoaNguoiDung?TaiKhoan=${encodeURIComponent(username)}`, {
    method: "DELETE",
  });
}

// Tao lich chieu tu trang admin voi ma phim, ma rap, ngay gio chieu va gia ve.
export async function createShowtime(showtime) {
  return authorizedRequest("/QuanLyDatVe/TaoLichChieu", {
    method: "POST",
    body: JSON.stringify({
      ...showtime,
      maPhim: Number(showtime.maPhim),
      maRap: String(showtime.maRap),
      giaVe: Number(showtime.giaVe),
    }),
  });
}

// Lấy danh sách hệ thống rạp để render select hệ thống rạp.
export async function getTheaterSystems() {
  try {
    return await request("/QuanLyRap/LayThongTinHeThongRap");
  } catch {
    return [];
  }
}

// Lấy danh sách cụm rạp và rạp con theo hệ thống rạp đã chọn.
export async function getTheaterClusters(systemId) {
  try {
    return await request(`/QuanLyRap/LayThongTinCumRapTheoHeThong?maHeThongRap=${systemId}`);
  } catch {
    return [];
  }
}

// Lay lich chieu theo he thong rap de trang chu hien thi poster phim va cac suat chieu.
export async function getTheaterScheduleSystems(systemId = "") {
  try {
    const systemQuery = systemId ? `maHeThongRap=${systemId}&` : "";

    return await request(`/QuanLyRap/LayThongTinLichChieuHeThongRap?${systemQuery}maNhom=${GROUP_CODE}`);
  } catch {
    return [];
  }
}

// Lấy thông tin tài khoản đang đăng nhập và lịch sử đặt vé nếu server có trả về.
export async function getProfile() {
  try {
    return await authorizedRequest("/QuanLyNguoiDung/ThongTinTaiKhoan", {
      method: "POST",
    });
  } catch {
    const user = getStoredUser();

    return {
      taiKhoan: user?.taiKhoan ?? "",
      hoTen: user?.hoTen ?? "Khach hang",
      email: user?.email ?? "customer@example.com",
      soDT: user?.soDT ?? user?.soDt ?? "",
      maLoaiNguoiDung: user?.maLoaiNguoiDung ?? "KhachHang",
      thongTinDatVe: [],
    };
  }
}

// Cập nhật thông tin cá nhân của tài khoản hiện tại.
export async function updateProfile(profile) {
  return authorizedRequest("/QuanLyNguoiDung/CapNhatThongTinNguoiDung", {
    method: "PUT",
    body: JSON.stringify({ ...profile, maNhom: GROUP_CODE }),
  });
}

// API them/sua phim yeu cau multipart FormData vi co upload file hinh anh.
function createMovieFormData(movie) {
  const formData = new FormData();

  if (movie.maPhim) {
    formData.append("maPhim", String(movie.maPhim));
  }

  formData.append("tenPhim", movie.tenPhim);
  formData.append("trailer", movie.trailer);
  formData.append("moTa", movie.moTa);
  formData.append("maNhom", GROUP_CODE);
  formData.append("ngayKhoiChieu", movie.ngayKhoiChieu);
  formData.append("sapChieu", String(movie.sapChieu));
  formData.append("dangChieu", String(movie.dangChieu));
  formData.append("hot", String(movie.hot));
  formData.append("danhGia", String(movie.danhGia));

  if (movie.hinhAnh) {
    formData.append("File", movie.hinhAnh, movie.hinhAnh.name);
  }

  return formData;
}

// Admin thêm phim mới bằng API upload hình.
export async function createMovie(movie) {
  return authorizedRequest("/QuanLyPhim/ThemPhimUploadHinh", {
    method: "POST",
    body: createMovieFormData(movie),
  });
}

// Admin cập nhật phim bằng API upload hình.
export async function updateMovie(movie) {
  return authorizedRequest("/QuanLyPhim/CapNhatPhimUpload", {
    method: "POST",
    body: createMovieFormData(movie),
  });
}

// Admin xóa phim theo mã phim.
export async function deleteMovie(movieId) {
  return authorizedRequest(`/QuanLyPhim/XoaPhim?MaPhim=${movieId}`, {
    method: "DELETE",
  });
}
