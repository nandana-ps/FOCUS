import { supabase, USER_ID } from './supabaseClient';

// --- STATE ---
let localUsage = {};
let limits = {};
let initDone = false;

// --- INITIALIZATION ---
async function init() {
  if (initDone) return;
  console.log("FocusLock: Initializing...");

  // Fetch limits from Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', USER_ID)
    .single();

  if (error) {
    console.error("FocusLock: Failed to fetch profile:", error.message);
    return;
  }

  if (data && data.settings) {
    const normalLimit = data.settings.normal_limit || 60;
    limits['YouTube'] = { limit: normalLimit };
    limits['Instagram'] = { limit: normalLimit };
    console.log("FocusLock: Limits loaded:", JSON.stringify(limits));
  }

  initDone = true;
}

// Ensure alarms exist on install AND on every service worker startup
function ensureAlarms() {
  chrome.alarms.get("trackingTick", (alarm) => {
    if (!alarm) {
      chrome.alarms.create("trackingTick", { periodInMinutes: 1 });
      console.log("FocusLock: Created trackingTick alarm");
    }
  });
  chrome.alarms.get("syncTick", (alarm) => {
    if (!alarm) {
      chrome.alarms.create("syncTick", { periodInMinutes: 1 });
      console.log("FocusLock: Created syncTick alarm");
    }
  });
}

// Run on every service worker wake-up
ensureAlarms();
init();

// Also run on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("FocusLock: Extension installed/updated");
  ensureAlarms();
  init();
});


// --- ALARM HANDLER ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Make sure init has run
  if (!initDone) await init();

  if (alarm.name === "trackingTick") {
    await checkActiveTabAndTrack();
  }
  if (alarm.name === "syncTick") {
    await syncWithSupabase();
  }
});


// --- TRACKING ---
async function checkActiveTabAndTrack() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;

  const tab = tabs[0];
  if (!tab.url) return;

  let siteName = null;
  if (tab.url.includes("youtube.com")) siteName = "YouTube";
  else if (tab.url.includes("instagram.com")) siteName = "Instagram";

  if (siteName) {
    localUsage[siteName] = (localUsage[siteName] || 0) + 1;
    console.log(`FocusLock: Tracked ${siteName} +1m (local total: ${localUsage[siteName]}m)`);

    // Check limits immediately
    await checkLimits(siteName);
  }
}


// --- SYNC ---
async function syncWithSupabase() {
  if (Object.keys(localUsage).length === 0) return;

  const today = new Date().toISOString().split('T')[0];

  // Get current server usage
  const { data: existing } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .single();

  let updates = {
    user_id: USER_ID,
    date: today,
    youtube_mins: (existing?.youtube_mins || 0) + (localUsage['YouTube'] || 0),
    instagram_mins: (existing?.instagram_mins || 0) + (localUsage['Instagram'] || 0)
  };

  const { error } = await supabase
    .from('usage_logs')
    .upsert(updates, { onConflict: 'user_id, date' });

  if (!error) {
    console.log("FocusLock: Synced to Supabase:", JSON.stringify(updates));
    localUsage = {};
  } else {
    console.error("FocusLock: Sync error:", error.message);
  }
}


// --- BLOCKING ---
async function checkLimits(siteName) {
  const today = new Date().toISOString().split('T')[0];

  // Always fetch the LATEST limit from Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', USER_ID)
    .single();

  const siteLimit = profile?.settings?.normal_limit || 60;

  // Also update the cached limits
  limits[siteName] = { limit: siteLimit };

  // Get latest server usage
  const { data: usage } = await supabase
    .from('usage_logs')
    .select('youtube_mins, instagram_mins')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .single();

  const serverUsage = usage
    ? (siteName === 'YouTube' ? usage.youtube_mins : usage.instagram_mins)
    : 0;

  const totalUsed = serverUsage + (localUsage[siteName] || 0);

  console.log(`FocusLock: ${siteName} — ${totalUsed}m used / ${siteLimit}m limit`);

  if (totalUsed >= siteLimit) {
    console.log(`FocusLock: 🚫 BLOCKING ${siteName}!`);

    const redirectUrl = chrome.runtime.getURL("blocked.html");
    const pattern = siteName === 'YouTube' ? '*://*.youtube.com/*' : '*://*.instagram.com/*';

    const tabs = await chrome.tabs.query({ url: pattern });
    for (const t of tabs) {
      chrome.tabs.update(t.id, { url: redirectUrl });
    }
  }
}