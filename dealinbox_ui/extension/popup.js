const DEALINBOX_URL = "https://www.dealsinbox.in/api/instagram-sync";

document.getElementById("syncBtn").addEventListener("click", async () => {
  const btn    = document.getElementById("syncBtn");
  const status = document.getElementById("status");
  const preview = document.getElementById("dataPreview");

  btn.disabled = true;
  status.textContent = "Reading Instagram profile...";
  status.className = "status";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes("instagram.com")) {
      status.textContent = "Please open your Instagram profile page first.";
      status.className = "status error";
      btn.disabled = false;
      return;
    }

    const data = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });

    if (!data || !data.username) {
      status.textContent = "Could not read profile. Make sure you are on your Instagram profile page.";
      status.className = "status error";
      btn.disabled = false;
      return;
    }

    preview.textContent = `@${data.username} · ${data.followers} followers · ${data.posts} posts`;

    status.textContent = "Syncing to DealInbox...";

    const res = await fetch(DEALINBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    });

    if (res.ok) {
      status.textContent = "✓ Synced successfully!";
    } else {
      status.textContent = "Sync failed. Make sure you are logged into DealInbox.";
      status.className = "status error";
    }
  } catch(e) {
    status.textContent = "Error: " + e.message;
    status.className = "status error";
  }

  btn.disabled = false;
});
