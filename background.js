// 監聽API回傳成功
chrome.webRequest.onCompleted.addListener(
  function (details) {
    // 若API是評論API 且 結尾沒有&extension
    if (
      (details.url.startsWith("https://www.google.com/maps/preview/review/") ||
        details.url.startsWith(
          "https://www.google.com.tw/maps/preview/review/"
        )) &&
      !details.url.endsWith("&extension")
    ) {
      console.log(details);
      // 傳reviewsAPI到contentScript
      chrome.tabs.sendMessage(
        details.tabId,
        {
          reviewsAPI: details.url,
        },
        function (response) {
        }
      );
    }
  },
  {
    // 網頁在google map時才監聽API
    urls: ["https://www.google.com/maps/*", "https://www.google.com.tw/maps/*"],
  }
);
