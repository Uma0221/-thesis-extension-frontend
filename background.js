var reviewsAPI = "";
// var currentURL = "";

// // 網頁url變化
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   console.log(changeInfo);
//   if (
//     changeInfo.url &&
//     changeInfo.url.startsWith("https://www.google.com/maps/place")
//   ) {
//     var backURL = changeInfo.url.slice(34);
//     currentURL = backURL.slice(0, backURL.indexOf("/"));
//     // console.log(changeInfo.url.slice(33))
//   }
// });

// 監聽API
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.startsWith("https://www.google.com/maps/preview/review/")) {
      reviewsAPI = details.url;
      // console.log("reviewsAPI: " + reviewsAPI);

      // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      //   chrome.tabs.sendMessage(tabs[0].id, {
      //     reviewsAPI: reviewsAPI,
      //   });
      // });
    }
  },
  {
    urls: ["https://www.google.com/maps/*"],
  }
);

// 監聽錯誤
chrome.webRequest.onErrorOccurred.addListener(
  function (details) {
    console.log(details.error);
    reviewsAPI = "error";
  },
  {
    urls: ["https://www.google.com/maps/*"],
  }
);

// 回傳狀態
chrome.runtime.onMessage.addListener(function (message, sender, response) {
  switch (message.type) {
    
    //回傳評論的API
    case "getReviewsAPI":
      response({ reviewsAPI: reviewsAPI });

      reviewsAPI = ""; // Success!

      // console.log(reviewsAPI);

      // if(reviewsAPI != ""){
      //     reviewsAPI = "";
      // }

      break;

    default:
      console.error("Unrecognised message: ", message);
  }
});
