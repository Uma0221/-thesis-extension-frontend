let lifeline;

keepAlive();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keepAlive") {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); // 5 minutes minus 5 seconds
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: "*://*/*" })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: "keepAlive" }),
        // `function` will become `func` in Chrome 93+
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}
// -------------------------------------------------------------

// 回傳成功時監聽API
chrome.webRequest.onCompleted.addListener(
  function (details) {
    // 若評論API結尾沒有&extension
    if (
      !details.url.endsWith("&extension")
    ) {
      // console.log(details);
      // 傳reviewsAPI到contentScript
      chrome.tabs.sendMessage(
        details.tabId,
        {
          reviewsAPI: details.url,
        },
        function (response) {}
      );
    }
  },
  {
    // 若API是評論API時才監聽
    urls: [
      "https://www.google.com/maps/preview/review/*",
      "https://www.google.com.tw/maps/preview/review/*",
    ],
  }
);
