export type NavCategory = {
  name: string
  slug: string
  children?: { name: string; slug: string }[]
}

/**
 * @deprecated Use getNavCategories from @/lib/queries to fetch categories from the database.
 */
export const NAV_CATEGORIES: NavCategory[] = [
  {
    name: "Sống hay",
    slug: "song-hay",
    children: [
      { name: "Chuyện hay", slug: "chuyen-hay" },
      { name: "Hot trên mạng", slug: "hot-tren-mang" },
      { name: "Du lịch", slug: "du-lich" },
      { name: "Khám phá", slug: "kham-pha" },
    ],
  },
  {
    name: "Sống khỏe",
    slug: "song-khoe",
    children: [
      { name: "Khỏe đẹp", slug: "khoe-dep" },
      { name: "Chăm con", slug: "cham-con" },
    ],
  },
  {
    name: "Mẹo hay",
    slug: "meo-hay",
    children: [
      { name: "Mẹo gia đình", slug: "meo-gia-dinh" },
      { name: "Mẹo nấu ăn", slug: "meo-nau-an" },
      { name: "Mẹo công nghệ", slug: "meo-cong-nghe" },
      { name: "Mẹo tiết kiệm", slug: "meo-tiet-kiem" },
    ],
  },
  {
    name: "Gia đình",
    slug: "gia-dinh",
    children: [
      { name: "Chuyện vợ chồng", slug: "chuyen-vo-chong" },
      { name: "Nuôi dạy con", slug: "nuoi-day-con" },
      { name: "Tâm sự", slug: "tam-su" },
    ],
  },
  {
    name: "Góc cổ nhân",
    slug: "goc-co-nhan",
    children: [
      { name: "Tử vi", slug: "tu-vi" },
      { name: "Phong thủy", slug: "phong-thuy" },
      { name: "Tướng số", slug: "tuong-so" },
      { name: "Lịch vạn niên", slug: "lich-van-nien" },
      { name: "Trắc nghiệm", slug: "trac-nghiem" },
    ],
  },
  {
    name: "Xem mua luôn",
    slug: "xem-mua-luon",
    children: [
      { name: "Thời trang", slug: "thoi-trang" },
      { name: "Làm đẹp", slug: "lam-dep" },
      { name: "Đồ gia dụng", slug: "do-gia-dung" },
    ],
  },
  {
    name: "Video",
    slug: "video",
  },
] as const
