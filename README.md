# Excel Arena – Công Thức Chiến Binh ⚔️

Game web luyện **hàm Excel** vui nhộn: thư viện **≥ 100 hàm**, nhiều chế độ chơi, confetti, combo, huy hiệu, **xuất Excel** và **đồng bộ Google Sheets**.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Zustand · SheetJS (xlsx)

**Repo:** https://github.com/Bachhhhhhhhhhhhhh/excel-arena-BMLG

> ⚠️ **GitHub chỉ lưu source code**, không tự “chạy” website.  
> Muốn có link chơi online → deploy **Vercel** (miễn phí, 2 phút).

---

## Deploy online (Vercel) — khuyến nghị

1. Vào [vercel.com/new](https://vercel.com/new) → đăng nhập bằng **GitHub**
2. **Import** repo `Bachhhhhhhhhhhhhh/excel-arena-BMLG`
3. Framework: **Next.js** (tự nhận) · Root: `/` · không cần env
4. Bấm **Deploy** → nhận URL dạng `https://excel-arena-bmlg.vercel.app`

Mỗi lần `git push` lên `main`, Vercel tự build lại.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Bachhhhhhhhhhhhhh/excel-arena-BMLG)

---

## Chạy local

```bash
git clone https://github.com/Bachhhhhhhhhhhhhh/excel-arena-BMLG.git
cd excel-arena-BMLG
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # chạy sau build
```

---

## Chế độ chơi

| Mode | Mô tả |
|------|--------|
| **Luyện tập tự do** | Chọn nhóm hàm, không giới hạn thời gian |
| **Challenge 60 giây** | Random liên tục, đếm ngược 60s |
| **Boss Fight** | Câu khó/trung bình, 3 mạng, combo |
| **Daily Challenge** | 10 câu seeded theo ngày |

---

## Cấu trúc thư mục

```
src/
  app/                 # App Router pages
    page.tsx           # Trang chủ
    play/              # Chơi game
    library/           # Thư viện hàm
    leaderboard/       # Xếp hạng + export
    settings/          # Cài đặt + Sheets
  components/
    ui/                # Button, Card, Input, Badge
    game/              # GameBoard, ModeSelector, HUD...
    export/            # Xuất Excel + Google Sheets
    layout/            # Header
  data/
    functions.ts       # Catalog ≥100 hàm (BẮT BUỘC mở rộng tại đây)
    questions.ts       # Câu hỏi luyện tập
  store/
    game-store.ts      # Zustand + persist localStorage
  lib/
    formula-check.ts   # So khớp công thức (linh hoạt ,/;)
    excel-export.ts    # SheetJS export .xlsx
    google-sheets.ts   # POST tới Apps Script
    badges.ts          # Huy hiệu
  types/
    index.ts
google-apps-script/
  Code.gs              # Script deploy Web App cho Sheets
```

---

## Thêm hàm mới

Mở `src/data/functions.ts`, thêm object vào mảng `EXCEL_FUNCTIONS`:

```ts
{
  name: "TEXTJOIN",
  category: "text", // math | logical | text | datetime | lookup | statistical | financial | information | dynamic
  description: "Nối chuỗi với delimiter",
  syntax: "TEXTJOIN(delimiter, ignore_empty, text1, ...)",
  example: '=TEXTJOIN(", ",TRUE,A1:A5)',
}
```

## Thêm câu hỏi mới

Mở `src/data/questions.ts`, thêm vào mảng `QUESTIONS`:

```ts
{
  id: "sum-99",                    // unique
  functionName: "SUM",             // khớp name trong functions.ts
  category: "math",
  difficulty: "easy",              // easy | medium | hard
  title: "Tổng nhanh",
  prompt: "Tính tổng B2:B5.",
  sampleData: {
    headers: ["SP", "SL"],
    rows: [["A", 10], ["B", 20]],
    rangeLabel: "A1:B3",
  },
  correctAnswer: "=SUM(B2:B3)",
  acceptedAnswers: ["=SUM(B2:B3)", "SUM(B2:B3)"], // tùy chọn
  explanation: "SUM cộng các số trong vùng.",
  points: 10,
}
```

> So khớp công thức **không phân biệt hoa thường**, chấp nhận có/không `=`, khoảng trắng, dấu `,` hoặc `;`.

---

## Xuất Excel

Trang **Xếp hạng** hoặc **Cài đặt** → nút **Xuất Excel**.

File gồm 3 sheet: `Lich_su_choi`, `Bang_xep_hang`, `Tong_quan`.

---

## Google Sheets (append liên tục)

1. Tạo Google Spreadsheet
2. **Extensions → Apps Script** → dán `google-apps-script/Code.gs`
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy URL dạng `https://script.google.com/macros/s/.../exec`
5. Vào **Cài đặt** (hoặc Leaderboard) → dán URL → **Lưu**

Mỗi lần trả lời đúng/sai, app POST JSON một dòng → script `appendRow`.

---

## Thống kê thư viện (mặc định)

- Hàm: xem `TOTAL_FUNCTIONS` trong `src/data/functions.ts`
- Câu hỏi: `TOTAL_QUESTIONS` trong `src/data/questions.ts`
- Nhóm: Math, Logical, Text, Date & Time, Lookup, Statistical, Financial, Information, Dynamic Array/LAMBDA

---

## Ghi chú kỹ thuật

- State game + lịch sử: **Zustand** + `persist` (localStorage key `excel-arena-storage`)
- Animation: **Framer Motion** + **canvas-confetti**
- Excel: **xlsx** (SheetJS)
- Không cần backend cho chơi offline; Sheets chỉ cần URL Web App

---

## License

MIT — tự do dùng cho học tập và nội bộ doanh nghiệp.
