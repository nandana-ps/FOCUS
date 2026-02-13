const API_URL = "http://localhost:3000/api/dashboard";

async function enforceRegulation() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    
    const youtube = data.websites.find(w => w.name === "YouTube");
    
    // Add these logs so you can see the numbers in the Service Worker console
    console.log(`Checking Status... Used: ${youtube.used}m | Limit: ${youtube.limit}m`);
    
    if (youtube && youtube.used >= youtube.limit) {
      console.log("🛑 Limit Exceeded! Redirecting YouTube tabs...");
      chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.update(tab.id, {url: "http://localhost:3000"});
        });
      });
    }
  } catch (e) { 
    console.log("⚠️ Waiting for server... Make sure node server.js is running."); 
  }
}

setInterval(enforceRegulation, 10000);