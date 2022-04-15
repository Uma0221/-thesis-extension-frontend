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
      // 若網頁url是評論頁面
      chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
          if (
            tabs[0].url.startsWith("https://www.google.com/maps/place") ||
            tabs[0].url.startsWith("https://www.google.com.tw/maps/place")
          ) {
            // console.log(tabs[0]);
            // 取得商家名稱
            let currentURLFront;
            if (tabs[0].url.startsWith("https://www.google.com/maps/place")) {
              currentURLFront = tabs[0].url.slice(34);
            } else {
              currentURLFront = tabs[0].url.slice(37);
            }
            const storeName = currentURLFront.slice(
              0,
              currentURLFront.indexOf("/")
            );

            if (storeName != "") {
              console.log(details.url);
              // 傳reviewsAPI跟商家名稱到contentScript
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  reviewsAPI: details.url,
                  storeName: storeName,
                },
                function (response) {
                  // reviewsAPI = "";
                }
              );
            }
          }
        }
      );
    }
  },
  {
    // 網頁在google map時才監聽API
    urls: ["https://www.google.com/maps/*", "https://www.google.com.tw/maps/*"],
  }
);