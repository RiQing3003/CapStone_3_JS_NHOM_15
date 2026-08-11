import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { bookTickets, getTicketRoom } from "../services/movieApi";
import { formatCurrency } from "../utils/format";

// Trang phòng vé: lấy sơ đồ ghế, cho khách chọn ghế và gửi request đặt vé.
export function TicketRoomPage() {
  const { showtimeId } = useParams();
  const [roomState, setRoomState] = useState({ room: null, showtimeId: null });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    getTicketRoom(showtimeId).then((room) => {
      if (isActive) {
        setRoomState({ room, showtimeId });
        setSelectedSeats([]);
        setBookingMessage("");
      }
    });

    return () => {
      isActive = false;
    };
  }, [showtimeId]);

  const selectedSeatItems =
    roomState.room?.seats.filter((seat) => selectedSeats.includes(seat.id)) ?? [];
  const subtotal = selectedSeatItems.reduce((sum, seat) => sum + seat.price, 0);

  // Chọn hoặc bỏ chọn ghế nếu ghế chưa được đặt.
  function toggleSeat(seat) {
    if (seat.booked) return;

    setSelectedSeats((currentSeats) =>
      currentSeats.includes(seat.id)
        ? currentSeats.filter((seatId) => seatId !== seat.id)
        : [...currentSeats, seat.id],
    );
  }

  // Gửi danh sách ghế đã chọn lên API đặt vé.
  async function handleBooking() {
    setBookingMessage("Đang gửi yêu cầu đặt vé...");

    try {
      await bookTickets({ showtimeId, seats: selectedSeatItems });
      setBookingMessage("Đặt vé thành công.");
    } catch {
      setBookingMessage("Bạn cần đăng nhập tài khoản khách hàng trước khi đặt vé.");
    }
  }

  if (roomState.showtimeId !== showtimeId || !roomState.room) {
    return (
      <main className="min-h-screen bg-[#0f1015] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-16 text-slate-300">Đang tải phòng vé...</div>
      </main>
    );
  }

  const room = roomState.room;
  const movieInfo = room.movieInfo;

  if (!movieInfo || !room.seats.length) {
    return (
      <main className="min-h-screen bg-[#0f1015] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 py-16 text-slate-300">
          Không thể tải phòng vé từ server. Vui lòng quay lại trang chi tiết phim và thử suất chiếu khác.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1015] text-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Phòng vé</p>
              <h1 className="mt-2 text-3xl font-black">Chọn ghế của bạn</h1>
              <p className="mt-3 text-slate-400">
                {movieInfo.tenCumRap} - {movieInfo.tenRap} - {movieInfo.gioChieu}
              </p>
            </div>
            <Link className="text-sm font-bold text-[#f5c84c]" to="/">
              Quay lại danh sách phim
            </Link>
          </div>

          <div className="mb-8 rounded-lg border border-white/10 bg-[#181a22] p-5">
            <div className="mx-auto mb-8 h-12 max-w-3xl rounded-t-[50%] border-t-4 border-[#f5c84c] bg-white/5 text-center text-xs font-bold uppercase tracking-[.3em] text-slate-400">
              Màn hình
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-8 gap-2 sm:grid-cols-10 lg:grid-cols-16">
              {room.seats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                return (
                  <button
                    className={`aspect-square rounded-md text-[11px] font-black transition ${
                      seat.booked
                        ? "cursor-not-allowed bg-slate-700 text-slate-500"
                        : isSelected
                          ? "bg-[#f26b38] text-white"
                          : seat.type === "vip"
                            ? "bg-[#f5c84c] text-slate-950"
                            : "bg-white text-slate-950"
                    }`}
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    title={`${seat.name} - ${formatCurrency(seat.price)}`}
                    type="button"
                  >
                    {seat.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-300">
              <Legend color="bg-white" label="Ghế thường" />
              <Legend color="bg-[#f5c84c]" label="Ghế VIP" />
              <Legend color="bg-[#f26b38]" label="Đang chọn" />
              <Legend color="bg-slate-700" label="Đã đặt" />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#181a22] p-6">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f5c84c]">Hóa đơn</p>
          <h2 className="mt-3 text-2xl font-black leading-tight">{movieInfo.tenPhim}</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <SummaryRow label="Cụm rạp" value={movieInfo.tenCumRap} />
            <SummaryRow label="Rạp" value={movieInfo.tenRap} />
            <SummaryRow label="Suất chiếu" value={movieInfo.gioChieu} />
            <SummaryRow
              label="Ghế"
              value={selectedSeatItems.length ? selectedSeatItems.map((seat) => seat.name).join(", ") : "Chưa chọn"}
            />
          </dl>

          <div className="mt-5 rounded-md bg-white/[.04] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">Tổng tiền</span>
              <span className="text-2xl font-black text-[#f5c84c]">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-md bg-[#f26b38] px-4 py-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={!selectedSeats.length}
            onClick={handleBooking}
          >
            Đặt vé
          </button>
          {bookingMessage && <p className="mt-4 text-sm text-slate-300">{bookingMessage}</p>}
        </aside>
      </section>
    </main>
  );
}

// Dòng thông tin trong hóa đơn đặt vé.
function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

// Chú giải màu sắc của từng loại ghế trong sơ đồ.
function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2">
      <i className={`h-3 w-3 rounded-sm ${color}`} /> {label}
    </span>
  );
}
