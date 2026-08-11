// Định dạng số tiền sang VND để hiển thị giá vé và tổng tiền.
export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}
