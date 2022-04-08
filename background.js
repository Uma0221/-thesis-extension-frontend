let reviewsAPI = "";

// 網頁url變化
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (
    reviewsAPI != "" &&
    changeInfo.status === "complete" &&
    tab.url.startsWith("https://www.google.com/maps/place")
  ) {
    const currentURLFront = tab.url.slice(34);
    const storeName = currentURLFront.slice(0, currentURLFront.indexOf("/"));

    if (storeName != "") {
      chrome.tabs.sendMessage(
        tab.id,
        {
          reviewsAPI: reviewsAPI,
          storeName: storeName,
        },
        function (response) {
          reviewsAPI = "";
        }
      );
    }
  }
});

// 監聽API
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.startsWith("https://www.google.com/maps/preview/review/")) {
      reviewsAPI = details.url;
      // console.log(reviewsAPI);
    }
  },
  {
    urls: ["https://www.google.com/maps/*"],
  }
);

// // 監聽錯誤
// chrome.webRequest.onErrorOccurred.addListener(
//   function (details) {
//     // console.log(details.error);
//     reviewsAPI = "error";
//   },
//   {
//     urls: ["https://www.google.com/maps/*"],
//   }
// );

// 回傳狀態
chrome.runtime.onMessage.addListener(function (message, sender, response) {
  switch (message.type) {
    //回傳評論的API
    case "getReviewsAPI":
      reviewsAPI = "";

      break;

    default:
      console.error("Unrecognised message: ", message);
  }
});
