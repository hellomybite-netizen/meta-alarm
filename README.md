# Meta Ads Daily Report → Telegram (Fase 1)

Report harian otomatis untuk **Remitgo, Telin Taiwan, Sim Taiwan, Nusa, M21, Telin HK App**, dikirim ke Telegram jam **08:00 WIB** tiap hari. Ini Fase 1 (report saja) — belum termasuk rules engine/alarm (Fase 2).

## Cara kerja singkat

```
cron-job.org (08:00 WIB / 01:00 UTC)
        │  HTTP GET + header Authorization
        ▼
Vercel Function: /api/daily-report
        │
        ├─ tarik insight kemarin per akun dari Meta Graph API
        ├─ ambil metrik hasil sesuai objective tiap campaign
        └─ kirim ringkasan ke Telegram
```

Kenapa bukan Vercel Cron bawaan? Karena akun Vercel gratis (Hobby) cuma boleh 1x run/hari dengan waktu yang tidak presisi (bisa meleset sampai 59 menit). Solusinya: fungsi tetap di Vercel, tapi yang "memicu" jam 08:00-nya pakai scheduler eksternal gratis (cron-job.org), yang tinggal HTTP request ke endpoint kita.

## Langkah setup

### 1. Deploy ke Vercel

1. Push folder ini ke repo GitHub kamu.
2. Import repo itu di [vercel.com/new](https://vercel.com/new).
3. Deploy — Vercel otomatis mendeteksi folder `api/` sebagai serverless function, tidak perlu konfigurasi framework apa pun.

### 2. Siapkan 3 kredensial, lalu isi di Vercel → Project Settings → Environment Variables

Isi sesuai `.env.example`:

- **`META_ACCESS_TOKEN`** — buat System User di Meta Business Manager (Business Settings → Users → System Users), beri akses **read** ke 6 ad account di `lib/accounts.config.js`, generate token long-lived.
- **`TELEGRAM_BOT_TOKEN`** — chat ke [@BotFather](https://t.me/BotFather) di Telegram, ketik `/newbot`, ikuti instruksinya.
- **`TELEGRAM_CHAT_ID`** — chat bot kamu sekali (apa saja), lalu buka:
  `https://api.telegram.org/bot<TOKEN>/getUpdates`
  cari `"chat":{"id": ...}` di response-nya. Atau pakai [@userinfobot](https://t.me/userinfobot).
- **`CRON_SECRET`** — bikin string acak sendiri (contoh: `openssl rand -hex 16` di terminal), simpan, dipakai lagi di langkah 3.

Setelah isi env vars, **redeploy** project dari Vercel dashboard biar env vars ke-load.

### 3. Daftarkan jadwal di cron-job.org (gratis)

1. Daftar di [cron-job.org](https://cron-job.org).
2. Buat cronjob baru:
   - **URL**: `https://<project-kamu>.vercel.app/api/daily-report`
   - **Schedule**: setiap hari jam `01:00` (UTC — ini setara 08:00 WIB)
   - **Request method**: GET
   - **Custom header**: `Authorization: Bearer <CRON_SECRET yang sama seperti di Vercel>`
3. Simpan. cron-job.org akan menembak endpoint itu tiap hari jam segitu.

### 4. Tes manual dulu sebelum menunggu besok pagi

Dari terminal:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<project-kamu>.vercel.app/api/daily-report
```

Cek Telegram — kalau pesan masuk, semua sudah tersambung dengan benar.

## Yang perlu divalidasi setelah data riil pertama masuk

- **`lib/objectiveMap.js`** — daftar `action_type` di sana adalah kandidat umum. Kalau ada campaign yang terus muncul "hasil: 0" padahal spend jalan normal, kemungkinan besar action_type akun tersebut belum ada di daftar → tambahkan manual (cek response mentah `actions[]` dari campaign itu untuk tahu action_type yang benar).
- **Nusa** — akun ini masih baru; pastikan System User token kamu benar-benar sudah dikasih akses ke akun ini di Business Manager.
- **Telin HK App** — saat ini semua campaign-nya PAUSED, jadi report untuk akun ini akan selalu "tidak ada campaign aktif" sampai ada campaign baru yang dijalankan.

## Rencana lanjutan (belum termasuk di kode ini)

- **Fase 2**: rules engine (tracking suspect, CPR spike) + alarm real-time — butuh baseline 30 hari, sebaiknya disimpan di Postgres (bukan file lokal — Vercel serverless tidak punya filesystem persisten).
- **Dashboard custom** — begitu Postgres masuk untuk baseline, data yang sama bisa langsung jadi sumber dashboard, tanpa tarik ulang dari Meta API.
