import { PrismaClient } from "@prisma/client"

import { NAV_CATEGORIES } from "../lib/categories"
import { hashPassword } from "../lib/password"
import { slugify } from "../lib/slug"

const prisma = new PrismaClient()

type SeedPost = {
  categorySlug: string
  title: string
  excerpt: string
  content: string
  thumbnailUrl: string
  videoEmbedUrl?: string
  isFeatured?: boolean
  isTrending?: boolean
  views: number
}

const demoPosts: SeedPost[] = [
  {
    categorySlug: "song-hay",
    title: "5 thoi quen buoi sang giup ngay moi nhe nhang hon",
    excerpt: "Chi can 20 phut buoi sang, ban co the cai thien nang luong va tam trang ro ret.",
    content:
      "Bat dau ngay moi voi 5 thoi quen don gian: uong nuoc am, van dong nhe, ghi 3 dieu biet on, an sang can bang va sap xep 3 viec quan trong. Cach lam nay giup giam cang thang, tang kha nang tap trung va giu tinh than on dinh trong suot ngay.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    isTrending: true,
    views: 2430,
  },
  {
    categorySlug: "song-hay",
    title: "Nghe thuat noi chuyen de tao thien cam trong 3 phut dau",
    excerpt: "Khong can hoa my, chi can dung cach dat cau hoi va lang nghe chu dong.",
    content:
      "Trong 3 phut dau tien, hay dung ten nguoi doi dien, dat cau hoi mo va phan hoi ngan gon de the hien su quan tam. Tu the mo, mat huong ve doi dien va toc do noi cham vua du giup cuoc tro chuyen tro nen de chiu va tao cam giac tin cay hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1760,
  },
  {
    categorySlug: "song-hay",
    title: "Lam viec tai nha khong met moi voi quy tac 50 10",
    excerpt: "Sau moi 50 phut tap trung, nghi 10 phut de bo nao duoc nap lai nang luong.",
    content:
      "Quy tac 50 10 giup ngan met moi tri tue va duy tri hieu suat on dinh. Trong 10 phut nghi, tranh luot mang xa hoi, hay uong nuoc, nhin xa 20 met va van dong co vai gay. Sau 1 tuan ap dung, ban se thay tinh trang qua tai giam ro.",
    thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1325,
  },
  {
    categorySlug: "song-hay",
    title: "Song toi gian giua thanh pho: it do hon, nhieu niem vui hon",
    excerpt: "Toi gian khong phai la cat bo, ma la giu lai dieu quan trong nhat.",
    content:
      "Hay bat dau bang viec sap xep lai goc ban lam viec, loai bo do vat khong dung 30 ngay va dat quy tac mua sam 1 vao 1 ra. Ban se tiet kiem thoi gian, giam ap luc tinh than va co nhieu khong gian cho nhung trai nghiem gia tri.",
    thumbnailUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1980,
  },
  {
    categorySlug: "song-khoe",
    title: "Duong sinh 15 phut truoc khi ngu de ngu sau giac",
    excerpt: "Chuoi dong tac tho, keo gian co va tha long giup co the vao trang thai nghi ngoi nhanh hon.",
    content:
      "Truoc gio ngu 30 phut, tat man hinh xanh, tho 4 6, xoay co vai nhe va keo gian lung hong. Ket hop am nhac nhe va phong ngu mat me se giup chat luong giac ngu cai thien ro. Day la bai duong sinh don gian, phu hop moi lua tuoi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2860,
  },
  {
    categorySlug: "song-khoe",
    title: "Thuc duong trong 7 ngay: goi y bua an can bang de de ap dung",
    excerpt: "Thay doi nho trong bua an co the giup tieu hoa em hon va giam cam giac met.",
    content:
      "Tang rau xanh 2 bua moi ngay, uu tien ngu coc nguyen hat, dam thuc vat va giam duong tinh luyen. Ke hoach 7 ngay nham tao nen tang ben vung, khong ep can. Ban co the dieu chinh khau vi theo thoi quen gia dinh de duy tri lau dai.",
    thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
    views: 1642,
  },
  {
    categorySlug: "song-khoe",
    title: "Lich van nien va nhung khung gio de tap luyen hieu qua",
    excerpt: "Co the moi nguoi co nhip sinh hoc rieng, nhung co nhung moc gio de de bat nhip.",
    content:
      "Buoi sang som phu hop cardio nhe, buoi chieu toi uu cho bai tap suc manh. Theo doi nang luong trong 2 tuan de tim khung gio vang cua rieng ban. Luyen tap dung luc giup giam bo cuoc va tao tien do on dinh hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
    views: 1210,
  },
  {
    categorySlug: "song-khoe",
    title: "3 bai tap tai nha khong dung cu cho nguoi ban ron",
    excerpt: "Chi can 12 phut moi ngay de duy tri suc ben va su linh hoat.",
    content:
      "Bo 3 bai tap gom squat, plank va lunges co the thuc hien tai nha ma khong can dung cu. Moi bai 40 giay, nghi 20 giay, lap lai 3 vong. Cach nay phu hop nguoi ban ron va de duy tri than hinh can doi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1400&q=80",
    views: 1954,
  },
  {
    categorySlug: "meo-hay",
    title: "Meo sap xep tu lanh 10 phut tiet kiem nua gio nau an",
    excerpt: "Phan tang thuc pham thong minh se giup ban nau nhanh va giam lang phi.",
    content:
      "Dat rau cu de thay o tang giua, do an da che bien o hop trong suot va dan nhan ngay mo nap. Moi toi thu 2, danh 10 phut kiem tra han su dung de len ke hoach bua an. Ban se giam bo thuc pham va de dang mua sam dung nhu cau.",
    thumbnailUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 3045,
  },
  {
    categorySlug: "meo-hay",
    title: "Cach giat trang quan ao ma khong can chat tay manh",
    excerpt: "Ket hop nguyen lieu san co trong bep de xu ly vet ban nhe an toan hon.",
    content:
      "Hoa tan bot baking soda voi nuoc am, ngam 20 phut truoc khi giat. Vet mau vang co the xu ly bang oxy gia loang theo ti le phu hop. Luon thu tren goc vai nho truoc de dam bao chat lieu khong bi anh huong.",
    thumbnailUrl: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1400&q=80",
    views: 1390,
  },
  {
    categorySlug: "meo-hay",
    title: "Tip tiet kiem dien mua he cho nha pho",
    excerpt: "Dieu chinh nhiet do dieu hoa va cach su dung quat hop ly de giam hoa don.",
    content:
      "Dat dieu hoa 26 27 do, ket hop quat doi luu khong khi va ve sinh loc dinh ky. Dong rem vao gio nang gat va tranh bat tat dieu hoa lien tuc. Cac meo nho nay co the giup giam dang ke chi phi dien hang thang.",
    thumbnailUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80",
    views: 1756,
  },
  {
    categorySlug: "meo-hay",
    title: "Checklist don dep cuoi tuan gon gon trong 45 phut",
    excerpt: "Lam theo thu tu uu tien se giam cam giac qua tai viec nha.",
    content:
      "Chia theo 3 cum: be mat thuong dung, san nha va nha tam. Dat dong ho 15 phut moi cum, tranh sa da vao mot khu vuc qua lau. Ket thuc bang viec bo rac va mo cua thong gio de nha thoang hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1400&q=80",
    views: 1120,
  },
  {
    categorySlug: "doi-song",
    title: "Nhip song Ha Noi cuoi tuan: 6 dia diem di bo dep va yen",
    excerpt: "Goi y nhung noi vua co cay xanh vua de di chuyen cho ca gia dinh.",
    content:
      "Tu ho Tay den khu pho co, ban co the chon cung duong di bo phu hop moi muc nang luong. Uu tien khung gio sang som hoac chieu muon de tranh dong duc. Di bo deu dan 30 phut moi ngay giup nang cao suc khoe tim mach va giam stress.",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2210,
  },
  {
    categorySlug: "doi-song",
    title: "Tai chinh ca nhan cho nguoi moi di lam: quy tac 50 30 20",
    excerpt: "Mot khung ngan sach de nho, de lam va de duy tri trong dai han.",
    content:
      "Phan bo thu nhap: 50 cho nhu cau, 30 cho mong muon va 20 cho tiet kiem dau tu. Bat dau bang so tien nho nhung deu, dong thoi lap quy du phong 3 6 thang chi phi. Ghi chep chi tieu theo tuan giup ban nhin ro hanh vi mua sam.",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80",
    views: 1888,
  },
  {
    categorySlug: "doi-song",
    title: "Xu huong song cham cua gioi tre do thi nam 2026",
    excerpt: "Song cham khong phai song cham tien do, ma la song co chu dich hon.",
    content:
      "Ngay cang nhieu ban tre uu tien suc khoe tinh than, thoi gian cho gia dinh va nhung trai nghiem that. Cac hoat dong nhu doc sach, lam gom, yoga va trekking nhe dang duoc quan tam. Song cham giup can bang giua ap luc cong viec va chat luong cuoc song.",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    views: 1540,
  },
  {
    categorySlug: "doi-song",
    title: "Bi quyet giu nha cua gon gang khi co tre nho",
    excerpt: "Uu tien he thong don gian va phu hop nhiep sinh hoat cua ca nha.",
    content:
      "Dung hop dan nhan theo mau cho do choi, sach va do dung hoc tap. Dat quy tac 10 phut truoc gio ngu de ca nha cung thu gon. Muc tieu khong phai nha luon hoan hao, ma la de moi nguoi deu tham gia va duy tri ne nep.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
    views: 1333,
  },
  {
    categorySlug: "goc-stress",
    title: "4 ky thuat tho nhanh giam stress truoc hop quan trong",
    excerpt: "Tho dung cach trong 90 giay co the ha muc kich hoat cua co the.",
    content:
      "Ban co the ap dung ky thuat box breathing 4 4 4 4 hoac tho dai hon khi tho ra 4 6. Ket hop tha long vai va thu gian ham giup tim dap deu tro lai. Ky nang nay hieu qua trong cac tinh huong can giu binh tinh nhanh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2699,
  },
  {
    categorySlug: "goc-stress",
    title: "Playlist am nhac thu gian cho ngay lam viec cang",
    excerpt: "Nhac khong loi tiet tau cham giup de tap trung va on dinh cam xuc.",
    content:
      "Hay chon cac ban nhac lo-fi, piano va ambient voi am luong vua phai. Moi 45 phut, dung 2 phut de nghe va tho deu. Nhung khoang nghi nho nay giup bo nao khoi phuc va giam cam giac bi dan nen boi cong viec.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80",
    views: 1402,
  },
  {
    categorySlug: "goc-stress",
    title: "Mini game 3 phut giup reset nao bo tai van phong",
    excerpt: "Mot chut vui nho giup doi nhom ket noi va giam cang thang.",
    content:
      "Thu mini game doan y qua emoji, tim diem khac nhau hoac cau hoi nhanh ve kien thuc doi song. Gioi han 3 phut de khong anh huong cong viec. Khong khi tich cuc trong nhom se giup hieu suat chung cai thien ro.",
    thumbnailUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    views: 1185,
  },
  {
    categorySlug: "goc-stress",
    title: "Goc vui cuoi ngay: 10 cau noi truyen cam hung ngan",
    excerpt: "Nhung cau noi ngan gon de ban ket thuc ngay voi tam the tich cuc.",
    content:
      "Sau mot ngay dai, nhung thong diep nho dung luc co the giup ban lay lai dong luc. Hay luu lai 10 cau noi yeu thich va doc lai moi toi. Viec nhac nho ban than deu dan la cach don gian de boi duong suc manh tinh than.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1400&q=80",
    views: 980,
  },
  {
    categorySlug: "tu-vi",
    title: "Tu vi 12 con giap tuan nay: ai co loc cong viec",
    excerpt: "Tong hop xu huong van trinh de ban tham khao va len ke hoach hop ly.",
    content:
      "Tuan nay, mot so tuoi co co hoi mo rong quan he cong viec va nhan duoc de xuat moi. Tuy nhien, nen than trong khi ra quyet dinh tai chinh lon. Tu vi chi mang tinh tham khao, dieu quan trong la su chu dong cua moi nguoi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1524680159700-3b557d2b6d05?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 3320,
  },
  {
    categorySlug: "tu-vi",
    title: "Mau sac may man theo ngay cho 12 cung hoang dao",
    excerpt: "Goi y mau sac de phoi do va tao cam hung tich cuc trong ngay.",
    content:
      "Moi cung co the uu tien mot bang mau de tang cam giac tu tin trong cong viec va giao tiep. Ban co the ap dung qua phu kien nho nhu ca vat, tui xach hoac op dien thoai. Su hai hoa tong the van la yeu to quan trong nhat.",
    thumbnailUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
    views: 2105,
  },
  {
    categorySlug: "tu-vi",
    title: "Ngay dep trong thang de khai truong va di chuyen",
    excerpt: "Lich tham khao cho cac ke hoach moi can su khoi dau thuan loi.",
    content:
      "Neu ban sap khai truong cua hang, chuyen van phong hoac bat dau du an moi, hay tham khao cac moc ngay dep trong thang. Ngoai yeu to tam linh, viec chuan bi ky luong ve nhan su, tai chinh va truyen thong van la then chot.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1400&q=80",
    views: 1677,
  },
  {
    categorySlug: "video",
    title: "Video: 7 bai tap gian co vai gay cho dan van phong",
    excerpt: "Huong dan truc quan de ban tap cung dong nghiep ngay tai cho.",
    content:
      "Video huong dan 7 bai tap gian co vai gay, moi dong tac 30 giay. Ban co the thuc hien giua cac khung hop de giam moi co va nhuc dau. Chu y giu nhip tho deu va tranh dong tac qua suc.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/2L2lnxIcNmo",
    isTrending: true,
    views: 2790,
  },
  {
    categorySlug: "video",
    title: "Video: Meal prep 3 bua toi trong 30 phut",
    excerpt: "Goi y nau an nhanh gon cho nguoi ban ron sau gio lam.",
    content:
      "Video tong hop 3 bua toi can bang voi nguyen lieu de mua. Moi mon duoc huong dan tung buoc, phu hop cho nguoi moi bat dau meal prep. Ban co the bien tau gia vi theo khau vi gia dinh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/4aZr5hZXP_s",
    views: 1911,
  },
  {
    categorySlug: "video",
    title: "Video: Decor goc lam viec dep voi ngan sach 500k",
    excerpt: "Nang cap khong gian lam viec nho gon, sang va truyen cam hung hon.",
    content:
      "Huong dan cach sap xep anh sang, cay xanh va do dung co ban de toi uu goc lam viec. Muc tieu la tao khong gian gon gang, de tap trung va de duy tri thoi quen lam viec sau gio hanh chinh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/lTRiuFIWV54",
    views: 1450,
  },
  {
    categorySlug: "video",
    title: "Video: Tu hoc thien 5 phut moi ngay cho nguoi moi",
    excerpt: "Bai tap ngan gon de ban bat dau hanh trinh cham soc tinh than.",
    content:
      "Video huong dan thien co ban trong 5 phut, phu hop cho nguoi moi. Ban co the ap dung vao dau ngay hoac truoc gio ngu de on dinh cam xuc. Kien tri nho moi ngay se tao thay doi ben vung.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    views: 1688,
  },
]

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@songhay.vn"
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456"

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Songhay Admin",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      email: adminEmail,
      name: "Songhay Admin",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword),
    },
  })

  const categoryBySlug = new Map<string, string>()

  for (const [index, category] of NAV_CATEGORIES.entries()) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index + 1 },
      create: { slug: category.slug, name: category.name, sortOrder: index + 1 },
    })

    categoryBySlug.set(category.slug, result.id)
  }

  for (const [index, post] of demoPosts.entries()) {
    const categoryId = categoryBySlug.get(post.categorySlug)

    if (!categoryId) {
      continue
    }

    const slug = slugify(post.title)
    const publishedAt = new Date(Date.now() - index * 8 * 60 * 60 * 1000)

    const upserted = await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        videoEmbedUrl: post.videoEmbedUrl || null,
        seoTitle: `${post.title} | Songhay.vn`,
        seoDescription: post.excerpt,
        ogImage: post.thumbnailUrl,
        categoryId,
        isFeatured: Boolean(post.isFeatured),
        isTrending: Boolean(post.isTrending),
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        views: post.views,
        publishedAt,
      },
      create: {
        slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        videoEmbedUrl: post.videoEmbedUrl || null,
        seoTitle: `${post.title} | Songhay.vn`,
        seoDescription: post.excerpt,
        ogImage: post.thumbnailUrl,
        categoryId,
        isFeatured: Boolean(post.isFeatured),
        isTrending: Boolean(post.isTrending),
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        views: post.views,
        publishedAt,
      },
    })

    if (index < 6) {
      await prisma.comment.upsert({
        where: {
          id: `${upserted.id}-demo-comment`,
        },
        update: {
          authorName: "Ban doc Songhay",
          content: "Noi dung huu ich, cam on Songhay.vn da chia se!",
          isApproved: true,
        },
        create: {
          id: `${upserted.id}-demo-comment`,
          postId: upserted.id,
          authorName: "Ban doc Songhay",
          content: "Noi dung huu ich, cam on Songhay.vn da chia se!",
          isApproved: true,
        },
      })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
