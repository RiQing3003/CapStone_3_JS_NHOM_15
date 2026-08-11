const USER_STORAGE_KEY = "movie_user";

// Đọc thông tin user/admin từ localStorage để giữ trạng thái sau khi refresh trang.
export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

// Lưu user/admin sau khi đăng nhập thành công.
export function saveStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// Xóa trạng thái đăng nhập khi người dùng đăng xuất.
export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

// Lấy accessToken để gọi các API cần Authorization.
export function getStoredAccessToken() {
  return getStoredUser()?.accessToken ?? "";
}
