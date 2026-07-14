async function sendTelegramMessage(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram API error: ${json.description}`);
  }
  return json;
}

// Telegram batasi ~4096 karakter per pesan. Kalau report kepanjangan (banyak
// akun/campaign), pecah jadi beberapa pesan biar tidak terpotong/gagal kirim.
function splitMessage(text, maxLen = 3500) {
  if (text.length <= maxLen) return [text];
  const parts = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf("\n\n", maxLen);
    if (cut === -1) cut = maxLen;
    parts.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  if (remaining) parts.push(remaining);
  return parts;
}

module.exports = { sendTelegramMessage, splitMessage };
