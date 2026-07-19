# Excel Arena – Công Thức Chiến Binh ⚔️

Game luyện hàm Excel (Next.js 14) · theme anime ice-blue · 180+ hàm · 4 chế độ chơi.

**Source:** https://github.com/Bachhhhhhhhhhhhhh/excel-arena-BMLG  

**Chơi online (GitHub Pages):**  
https://Bachhhhhhhhhhhhhh.github.io/excel-arena-BMLG/

> Sau khi bật Pages + workflow chạy xong (~2–3 phút) link mới mở được.

---

## Deploy trên GitHub Pages (đã cấu hình sẵn)

Repo đã có workflow `.github/workflows/deploy-pages.yml`.

### Bật GitHub Pages (một lần)

1. Mở repo → **Settings** → **Pages**
2. **Source:** GitHub Actions  
3. Push lên `main` (hoặc **Actions** → *Deploy to GitHub Pages* → **Run workflow**)
4. Đợi job xanh → mở:  
   `https://Bachhhhhhhhhhhhhh.github.io/excel-arena-BMLG/`

Mỗi lần push `main`, site tự build & publish lại.

---

## Chạy local

```bash
git clone https://github.com/Bachhhhhhhhhhhhhh/excel-arena-BMLG.git
cd excel-arena-BMLG
npm install
npm run dev
```

http://localhost:3000

```bash
# Build static (giống GitHub Pages)
set GITHUB_PAGES=true
npm run build
# Kết quả nằm trong thư mục out/
```

---

## Cấu trúc chính

- `src/data/functions.ts` — thư viện ≥100 hàm  
- `src/data/questions.ts` — câu hỏi luyện tập  
- `src/components/game/` — màn chơi, mascot  
- `public/mascot/` — ảnh nhân vật anime  
- `google-apps-script/Code.gs` — sync Google Sheets  

---

## Stack

Next.js 14 (static export) · TypeScript · Tailwind · Framer Motion · Zustand · SheetJS
