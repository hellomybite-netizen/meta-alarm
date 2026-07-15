// Untuk tiap objective campaign, ini daftar kandidat action_type yang dicoba
// berurutan. Meta kadang pakai varian berbeda tergantung setup pixel/SDK klien
// (mis. omni_purchase vs offsite_conversion.fb_pixel_purchase), jadi kita coba
// semua kandidat dan pakai yang pertama ada datanya.
//
// PENTING: mapping ini perlu divalidasi ulang begitu data riil pertama masuk --
// kalau ada campaign yang selalu tampil "0 hasil" padahal spend jalan, kemungkinan
// besar action_type-nya belum ada di daftar kandidat berikut. Tambahkan di sini.

const OBJECTIVE_ACTION_MAP = {
  OUTCOME_APP_PROMOTION: {
    label: "Install",
    candidates: ["mobile_app_install", "omni_app_install"],
  },
  APP_INSTALLS: {
    label: "Install",
    candidates: ["mobile_app_install", "omni_app_install"],
  },
  OUTCOME_SALES: {
    label: "Purchase",
    candidates: [
      "omni_purchase",
      "offsite_conversion.fb_pixel_purchase",
      "app_custom_event.fb_mobile_purchase",
      "onsite_web_purchase",
    ],
  },
  OUTCOME_ENGAGEMENT: {
    label: "Percakapan",
    candidates: [
      "onsite_conversion.messaging_conversation_started_7d",
      "onsite_conversion.total_messaging_connection",
    ],
  },
  OUTCOME_LEADS: {
    label: "Lead",
    candidates: ["lead", "onsite_conversion.lead_grouped"],
  },
  OUTCOME_TRAFFIC: {
    label: "Klik Link",
    candidates: ["link_click"],
  },
  OUTCOME_AWARENESS: {
    label: "Reach",
    candidates: [], // ditangani khusus: pakai field reach, bukan actions[]
  },
};

function getResultForCampaign(objective, actions) {
  const mapping = OBJECTIVE_ACTION_MAP[objective];
  if (!mapping) {
    return { label: "Result (unmapped objective)", value: 0, unmapped: true };
  }
  if (objective === "OUTCOME_AWARENESS") {
    return { label: mapping.label, value: null, isReachBased: true };
  }
  if (!actions || !Array.isArray(actions)) {
    return { label: mapping.label, value: 0 };
  }
  for (const candidate of mapping.candidates) {
    const found = actions.find((a) => a.action_type === candidate);
    if (found && Number(found.value) > 0) {
      return { label: mapping.label, value: Number(found.value) };
    }
  }
  return { label: mapping.label, value: 0 };
}

// Sama seperti getResultForCampaign, tapi baca dari action_values[] (nilai
// uang) alih-alih actions[] (jumlah kejadian). Dipakai untuk akun yang mau
// lihat revenue/purchase value, bukan cuma jumlah purchase.
function getPurchaseValue(objective, actionValues) {
  const mapping = OBJECTIVE_ACTION_MAP[objective];
  if (!mapping || !actionValues || !Array.isArray(actionValues)) {
    return null;
  }
  for (const candidate of mapping.candidates) {
    const found = actionValues.find((a) => a.action_type === candidate);
    if (found && Number(found.value) > 0) {
      return Number(found.value);
    }
  }
  return null;
}

module.exports = { OBJECTIVE_ACTION_MAP, getResultForCampaign, getPurchaseValue };
