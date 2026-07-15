const accounts = require("../lib/accounts.config");
const { fetchYesterdayCampaignInsights } = require("../lib/metaClient");
const { getResultForCampaign, getPurchaseValue } = require("../lib/objectiveMap");
const { sendTelegramMessage, splitMessage } = require("../lib/telegram");

function fmt(num) {
  if (num === null || num === undefined) return "-";
  return Number(num).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function saranOtomatis(campaign, result) {
  // Rule sederhana Fase 1 -- bukan pengganti rules engine penuh (itu Fase 2),
  // cuma quick-read supaya report tidak sekadar angka mentah.
  const spend = Number(campaign.spend || 0);
  const ctr = Number(campaign.ctr || 0);

  if (spend > 0 && !result.isReachBased && result.value === 0) {
    return "⚠️ Spend jalan tapi hasil nol -- cek tracking/pixel/Events Manager sebelum ubah iklan.";
  }
  if (result.unmapped) {
    return "ℹ️ Objective belum ter-mapping di sistem -- perlu ditambahkan manual.";
  }
  if (!result.isReachBased && ctr > 0 && ctr < 0.5) {
    return "⚠️ CTR di bawah 0.5% -- perhatikan creative/audience.";
  }
  return "🟢 Terlihat normal.";
}

async function buildAccountSection(account, accessToken) {
  let campaigns;
  try {
    campaigns = await fetchYesterdayCampaignInsights(
      account.account_id,
      accessToken
    );
  } catch (err) {
    return `<b>🔴 ${account.label} (${account.business})</b>\nGagal ambil data: ${err.message}\n`;
  }

  if (campaigns.length === 0) {
    return `<b>⚪ ${account.label} (${account.business})</b>\nTidak ada campaign aktif kemarin.\n`;
  }

  let totalSpend = 0;
  let totalRevenue = 0;
  const lines = campaigns.map((c) => {
    const result = getResultForCampaign(c.objective, c.actions);
    const spend = Number(c.spend || 0);
    totalSpend += spend;

    const hasilText = result.isReachBased
      ? `Reach: ${fmt(c.reach)}`
      : `${result.label}: ${fmt(result.value)}${
          result.value > 0
            ? ` (Cost/${result.label}: ${fmt(
                (Number(c.spend) / result.value).toFixed(2)
              )})`
            : ""
        }`;

    let revenueLine = "";
    if (account.trackRevenue) {
      const revenue = getPurchaseValue(c.objective, c.action_values);
      if (revenue !== null) {
        totalRevenue += revenue;
        const roas = spend > 0 ? ` (ROAS: ${(revenue / spend).toFixed(2)})` : "";
        revenueLine = `\n   Revenue: ${fmt(revenue)} ${account.currency}${roas}`;
      }
    }

    return (
      `▪️ <b>${c.campaign_name}</b>\n` +
      `   Spend: ${fmt(c.spend)} ${account.currency} | ${hasilText}\n` +
      `   CTR: ${fmt(c.ctr)}% | CPM: ${fmt(c.cpm)} ${account.currency}${revenueLine}\n` +
      `   ${saranOtomatis(c, result)}`
    );
  });

  const totalRevenueLine =
    account.trackRevenue && totalRevenue > 0
      ? `<i>Total revenue akun: ${fmt(totalRevenue)} ${account.currency} (ROAS: ${(
          totalRevenue / totalSpend
        ).toFixed(2)})</i>\n`
      : "";

  return (
    `<b>${account.label} (${account.business})</b>\n` +
    lines.join("\n\n") +
    `\n\n<i>Total spend akun: ${fmt(totalSpend)} ${account.currency}</i>\n` +
    totalRevenueLine
  );
}

module.exports = async function handler(req, res) {
  // Endpoint ini dipicu external scheduler (cron-job.org), bukan Vercel Cron --
  // jadi kita otentikasi manual pakai secret di header, biar tidak sembarang
  // orang bisa trigger dan menghabiskan quota Meta API kamu.
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!accessToken || !botToken || !chatId) {
    res.status(500).json({ error: "Environment variable belum lengkap" });
    return;
  }

  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let report = `📊 <b>DAILY REPORT -- data kemarin (per ${tanggal})</b>\n━━━━━━━━━━━━━━━━━━\n\n`;

  const sections = [];
  for (const account of accounts) {
    // Sequential (bukan Promise.all) supaya tidak kena rate limit Meta API
    // sekaligus untuk banyak akun.
    const section = await buildAccountSection(account, accessToken);
    sections.push(section);
  }
  report += sections.join("\n━━━━━━━━━━━━━━━━━━\n\n");

  try {
    const messages = splitMessage(report);
    for (const msg of messages) {
      await sendTelegramMessage(botToken, chatId, msg);
    }
    res.status(200).json({ ok: true, accounts_processed: accounts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
