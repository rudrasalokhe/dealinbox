function scrapeInstagram() {
  try {
    const username = window.location.pathname.replace(/\//g, "");
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = metaDesc ? metaDesc.content : "";
    const parts = desc.split(" ");
    let followers = "", following = "", posts = "";
    for (let i = 0; i < parts.length; i++) {
      if (parts[i+1] === "Followers") followers = parts[i];
      if (parts[i+1] === "Following") following = parts[i];
      if (parts[i+1] === "Posts") posts = parts[i];
    }
    const bioEl = document.querySelector('meta[property="og:description"]');
    const bio = bioEl ? bioEl.content.split(" - ").pop() : "";
    return { username, followers, following, posts, bio };
  } catch(e) {
    return null;
  }
}
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "scrape") {
    sendResponse(scrapeInstagram());
  }
});
