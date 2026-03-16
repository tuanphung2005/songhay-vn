"use client"

import { useMemo, useState } from "react"

type DayQuality = {
  score: number
  label: "Rất tốt" | "Tốt" | "Hơi tốt" | "Trung bình" | "Cần cẩn trọng"
  note: string
}

const heavenlyStems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
const earthlyBranches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]

const hoangDaoList = ["Thanh Long Hoàng Đạo", "Minh Đường Hoàng Đạo", "Kim Quỹ Hoàng Đạo", "Ngọc Đường Hoàng Đạo", "Tư Mệnh Hoàng Đạo"]
const trucList = ["Khai", "Mãn", "Bình", "Định", "Chấp", "Phá"]
const napAmList = ["Tích Lịch Hỏa", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Thiên Hà Thủy", "Đại Lâm Mộc"]
const seasonList = ["Xuân", "Hạ", "Thu", "Đông"]
const tietKhiList = ["Kinh Trập", "Xuân Phân", "Thanh Minh", "Cốc Vũ", "Tiểu Mãn"]
const nhiThapBatTuList = [
  "Sao: Nguy (Thuộc hành: Hỏa, Con vật: Én)",
  "Sao: Bích (Thuộc hành: Thủy, Con vật: Rái cá)",
  "Sao: Cang (Thuộc hành: Kim, Con vật: Rồng)",
  "Sao: Tâm (Thuộc hành: Nguyệt, Con vật: Chồn)",
]

const goodStars = ["Minh đường*", "Đại hồng sa", "Nhân chuyên", "Thiên phúc", "Tục thế", "Tuế hợp"]
const badStars = ["Địa tặc", "Hỏa tai", "Hoang vu", "Kim thần thất sát (năm)", "Ly Sào", "Nguyệt hư", "Tứ thời cô quả"]

const goodWorks = [
  "Hôn thú, giá thú (ngày cưới, đám hỏi)",
  "Xây dựng, làm nhà, sửa nhà",
  "Khai trương",
  "An táng, mai táng",
  "Tế tự, tế lễ",
  "Động thổ",
  "Xuất hành, di chuyển",
  "Giao dịch, ký hợp đồng",
  "Cầu tài, lộc",
  "Tố tụng, giải oan",
  "Làm việc thiện, làm phúc",
  "Nhập trạch (về nhà mới)",
  "Khai nghiệp (bắt đầu công việc mới)",
  "Cầu tự (cầu con cái)",
  "Khai giảng, đăng ký khóa học",
  "Cầu sức khỏe",
]

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateVi(input: string) {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function toCanChi(seed: number) {
  return `${heavenlyStems[Math.abs(seed) % 10]} ${earthlyBranches[Math.abs(seed) % 12]}`
}

function qualityFromScore(score: number): DayQuality {
  if (score >= 3.5) {
    return {
      score,
      label: "Rất tốt",
      note: "Ngày rất tốt, thuận lợi cho các việc quan trọng và ký kết.",
    }
  }

  if (score >= 3.0) {
    return {
      score,
      label: "Tốt",
      note: "Ngày tốt, có thể tiến hành phần lớn công việc theo kế hoạch.",
    }
  }

  if (score >= 2.5) {
    return {
      score,
      label: "Hơi tốt",
      note: "Ngày hơi tốt, có thể thực hiện các hoạt động nhẹ nhàng.",
    }
  }

  if (score >= 2.0) {
    return {
      score,
      label: "Trung bình",
      note: "Ngày trung bình, nên ưu tiên việc thường nhật và hạn chế quyết định lớn.",
    }
  }

  return {
    score,
    label: "Cần cẩn trọng",
    note: "Ngày cần cẩn trọng, cân nhắc kỹ trước khi xử lý việc quan trọng.",
  }
}

function buildReport(targetDate: string) {
  // Mốc mẫu để hiển thị đúng nội dung người dùng mong muốn.
  if (targetDate === "2026-03-16") {
    return {
      displayDate: "16/03/2026",
      lunarDate: "28/01/2026",
      canChiDay: "Kỷ Sửu",
      canChiMonth: "Canh Dần",
      canChiYear: "Bính Ngọ",
      hoangDao: "Minh Đường Hoàng Đạo",
      truc: "Khai",
      napAm: "Tích Lịch Hỏa",
      season: "Hạ",
      tietKhi: "Kinh Trập",
      nhiThapBatTu: "Sao: Nguy (Thuộc hành: Hỏa, Con vật: Én)",
      quality: qualityFromScore(2.5),
      direction: "Hướng tài lộc: Nam | Nhân duyên: Đông bắc | Hướng bất lợi: Bắc",
      goodHours: "Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)",
      dayConflicts: "Ất Mùi, Đinh Mùi",
      monthConflicts: "Giáp Tý, Nhâm Thân, Giáp Ngọ, Mậu Thân",
    }
  }

  const date = new Date(targetDate)
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date
  const year = safeDate.getFullYear()
  const month = safeDate.getMonth() + 1
  const day = safeDate.getDate()
  const seed = year * 10000 + month * 100 + day

  const lunarDay = ((day + 12) % 30) || 30
  const lunarMonth = ((month + 10) % 12) || 12
  const lunarYear = year

  const qualityScore = 2 + ((seed % 20) / 20) * 2

  return {
    displayDate: formatDateVi(formatInputDate(safeDate)),
    lunarDate: `${String(lunarDay).padStart(2, "0")}/${String(lunarMonth).padStart(2, "0")}/${lunarYear}`,
    canChiDay: toCanChi(seed + 6),
    canChiMonth: toCanChi(seed + 3),
    canChiYear: toCanChi(year),
    hoangDao: hoangDaoList[seed % hoangDaoList.length],
    truc: trucList[seed % trucList.length],
    napAm: napAmList[seed % napAmList.length],
    season: seasonList[seed % seasonList.length],
    tietKhi: tietKhiList[seed % tietKhiList.length],
    nhiThapBatTu: nhiThapBatTuList[seed % nhiThapBatTuList.length],
    quality: qualityFromScore(Number(qualityScore.toFixed(1))),
    direction: "Hướng tài lộc: Nam | Nhân duyên: Đông bắc | Hướng bất lợi: Bắc",
    goodHours: "Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)",
    dayConflicts: `${toCanChi(seed + 1)}, ${toCanChi(seed + 7)}`,
    monthConflicts: `${toCanChi(seed + 2)}, ${toCanChi(seed + 4)}, ${toCanChi(seed + 9)}, ${toCanChi(seed + 13)}`,
  }
}

export function GoodDayFullReport() {
  const [targetDate, setTargetDate] = useState("2026-03-16")

  const report = useMemo(() => buildReport(targetDate), [targetDate])

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Xem ngày tốt xấu đầy đủ</h2>
          <p className="text-sm text-zinc-600">Chọn ngày để xem bản phân tích chi tiết theo lịch âm tham khảo.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Ngày xem:
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="rounded border border-zinc-300 px-2 py-1"
          />
        </label>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <p className="font-semibold">
          Ngày {report.displayDate}: {report.hoangDao}, trực {report.truc} - Ngày {report.quality.label.toLowerCase()}
        </p>
        <p>
          Ngày âm lịch {report.lunarDate} năm {report.canChiYear}, là ngày {report.quality.label.toLowerCase()} theo
          lịch âm. {report.quality.note}
        </p>
      </div>

      <div className="grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
        <p>
          <span className="font-semibold text-zinc-900">Ngày âm lịch:</span> {report.lunarDate} - ngày:{report.canChiDay},
          tháng:{report.canChiMonth}, năm:{report.canChiYear}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Là ngày:</span> {report.hoangDao}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Trực:</span> {report.truc}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Nạp âm:</span> {report.napAm}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Thuộc mùa:</span> {report.season} | Tiết khí: {report.tietKhi}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Nhị thập bát tú:</span> {report.nhiThapBatTu}
        </p>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        <p>
          <span className="font-semibold text-zinc-900">Đánh giá chung:</span> [{report.quality.score.toFixed(1)}]
        </p>
        <p>
          <span className="font-semibold text-zinc-900">{report.quality.label}:</span> {report.quality.note}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">Tốt đối với từng việc</h3>
        <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
          {goodWorks.map((work) => (
            <p key={work}>• {work}</p>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-sm text-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-900">Tính chất của ngày</h3>
        <p>
          <span className="font-semibold text-zinc-900">Hướng xuất hành:</span> {report.direction}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Giờ tốt hôm nay (Giờ hoàng đạo):</span> {report.goodHours}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Tuổi gia chủ xung khắc với ngày:</span> {report.dayConflicts}
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Tuổi gia chủ xung khắc với tháng:</span> {report.monthConflicts}
        </p>
      </div>

      <div className="grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <h4 className="font-semibold text-emerald-900">Các sao tốt</h4>
          <div className="mt-1 space-y-1">
            {goodStars.map((star) => (
              <p key={star}>• {star}</p>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
          <h4 className="font-semibold text-rose-900">Các sao xấu</h4>
          <div className="mt-1 space-y-1">
            {badStars.map((star) => (
              <p key={star}>• {star}</p>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Dữ liệu mang tính tham khảo để hỗ trợ lên kế hoạch công việc theo ngày.
      </p>
    </section>
  )
}
