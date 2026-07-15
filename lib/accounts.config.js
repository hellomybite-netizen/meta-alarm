// Daftar akun yang dimonitor di Fase 1.
// Tambah/hapus akun di sini kapan pun tanpa perlu ubah logic lain.
// account_id ditulis TANPA prefix "act_" -- kode yang menambahkan otomatis.

module.exports = [
  {
    label: "Remitgo",
    business: "BRI Global Financial",
    account_id: "1337999464660892",
    currency: "HKD",
  },
  {
    label: "Telin Taiwan",
    business: "Telin Taiwan",
    account_id: "872167371628666",
    currency: "TWD",
    trackRevenue: true,
  },
  {
    label: "Sim Taiwan",
    business: "Telin Taiwan",
    account_id: "1067121371558169",
    currency: "TWD",
  },
  {
    label: "Nusa",
    business: "Telin Taiwan",
    account_id: "1510110790350509",
    currency: "TWD",
  },
  {
    label: "M21",
    business: "Telin HK",
    account_id: "880966717384375",
    currency: "HKD",
  },
  {
    label: "Telin HK App",
    business: "Telin HK",
    account_id: "707361895034982",
    currency: "HKD",
  },
];
