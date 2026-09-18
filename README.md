# Project Plan Pro (MS Project & Google Sheets Real-Time)

ເວັບແອັບພລິເຄຊັນຄຸ້ມຄອງໂຄງການຄ້າຍຄື Microsoft Project ພ້ອມຕາຕະລາງ WBS, Gantt Chart, Resource Management ແລະ ການເຊື່ອມຕໍ່ Google Sheets ແບບ Real-time.

---

## 🚀 ວິທີ Deploy ແລະ ແກ້ໄຂບັນຫາເມື່ອເອົາຂຶ້ນ GitHub (Deployment Guide)

### 1. ບັນຫາທີ່ພົບບ່ອຍເມື່ອ Deploy ແລ້ວເຂົ້າບໍ່ໄດ້:

#### 🔹 ບັນຫາທີ 1: ໜ້າຈໍຂາວ (Blank White Screen 404) ເທິງ GitHub Pages
- **ສາເຫດ:** ຕາມປົກກະຕິ Vite ຈະອ້າງອີງ path ແບບ Absolute `/assets/...` ເຮັດໃຫ້ GitHub Pages (ເຊັ່ນ: `https://username.github.io/repo-name/`) ຫາໄຟລ໌ JS/CSS ບໍ່ເຫັນ.
- **ການແກ້ໄຂ:** ໂຄງການນີ້ໄດ້ຕັ້ງຄ່າ `base: './'` ໃນ `vite.config.ts` ແລ້ວ ເພື່ອໃຫ້ໂຫຼດໄຟລ໌ແບບ Relative path ໄດ້ທຸກເວັບໄຊ.
- **ວິທີເປີດ GitHub Pages:**
  1. ເຂົ້າໄປທີ່ GitHub Repository -> **Settings** -> **Pages**.
  2. ພາກສ່ວນ **Build and deployment**:
     - ເລືອກ Source: **GitHub Actions** (ແນະນຳ) ຫຼື Deploy from a branch (ເລືອກໂຟນເດີ `dist` ຫຼື `gh-pages`).

#### 🔹 ບັນຫາທີ 2: ເຂົ້າສູ່ລະບົບ Google ບໍ່ໄດ້ (`auth/unauthorized-domain`)
- **ສາເຫດ:** Firebase Authentication ຈະປົກປ້ອງຄວາມປອດໄພ ໂດຍອະນຸຍາດສະເພາະໂດເມນທີ່ລະບຸໄວ້ເທົ່ານັ້ນ. ເມື່ອ deploy ຂຶ້ນ domain ໃໝ່ (ເຊັ່ນ: `xxx.vercel.app`, `xxx.netlify.app`, `xxx.github.io`), Google ຈະບລັອກການ Login.
- **ວິທີແກ້ໄຂ (ໃຊ້ເວລາ 1 ນາທີ):**
  1. ເຂົ້າໄປທີ່ [Firebase Console](https://console.firebase.google.com/).
  2. ເລືອກ Project: **car-loan-c692c**.
  3. ໄປທີ່ເມນູ **Authentication** -> **Settings** -> **Authorized domains**.
  4. ກົດ **Add domain** ແລ້ວໃສ່ຊື່ Domain ທີ່ທ່ານ deploy (ຕົວຢ່າງ: `your-username.github.io` ຫຼື `your-app.vercel.app`).
  5. ກົດ **Save** — ຫຼັງຈາກນັ້ນຈະສາມາດ Login ດ້ວຍບັນຊີ Google ແລະ ເຊື່ອມຕໍ່ Google Sheets ໄດ້ທັນທີ!

---

## 🛠️ ວິທີ Deploy ງ່າຍໆໄປຍັງ Vercel / Netlify

### Deploy ໄປຍັງ Vercel:
1. ເຂົ້າ [vercel.com](https://vercel.com) ແລະ Import Repository ນີ້ຈາກ GitHub.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. ກົດ **Deploy** (ລະບົບມີ `vercel.json` ຮອງຮັບ SPA routing ໃຫ້ຮຽບຮ້ອຍ).

### Deploy ໄປຍັງ Netlify:
1. ເຂົ້າ [netlify.com](https://netlify.com) ແລະ Import Repository ຈາກ GitHub.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. ກົດ **Deploy** (ລະບົບມີ `public/_redirects` ຮອງຮັບໃຫ້ຮຽບຮ້ອຍ).

---

## 💻 ການ Run ໃນເຄື່ອງ local (Development):

```bash
# ຕິດຕັ້ງ dependencies
npm install

# ເປີດ dev server
npm run dev

# ທົດສອບ build ສຳລັບ production
npm run build
npm run preview
```
