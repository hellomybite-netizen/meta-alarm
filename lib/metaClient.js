const GRAPH_VERSION = "v20.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Ambil insight level-campaign untuk "kemarin" (mengikuti timezone ad account
 * masing-masing, karena kita pakai date_preset bawaan Meta, bukan hitung manual).
 * Hanya mengambil campaign yang statusnya ACTIVE.
 */
async function fetchYesterdayCampaignInsights(accountId, accessToken) {
  const fields = [
    "campaign_name",
    "campaign_id",
    "objective",
    "spend",
    "reach",
    "impressions",
    "ctr",
    "cpm",
    "actions",
    "action_values",
  ].join(",");

  const filtering = encodeURIComponent(
    JSON.stringify([
      { field: "campaign.effective_status", operator: "IN", value: ["ACTIVE"] },
    ])
  );

  const url =
    `${GRAPH_BASE}/act_${accountId}/insights` +
    `?level=campaign&date_preset=yesterday&fields=${fields}` +
    `&filtering=${filtering}&limit=200` +
    `&access_token=${accessToken}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.error) {
    throw new Error(
      `Meta API error untuk act_${accountId}: ${json.error.message} (code ${json.error.code})`
    );
  }

  return json.data || [];
}

module.exports = { fetchYesterdayCampaignInsights };
