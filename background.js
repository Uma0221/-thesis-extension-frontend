let reviewsAPI = "";
let changeFlag = false;

// 網頁url變化
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (
    changeFlag &&
    changeInfo.status === "complete" &&
    (tab.url.startsWith("https://www.google.com/maps/place") ||
      tab.url.startsWith("https://www.google.com.tw/maps/place"))
  ) {
    let currentURLFront;
    if (tab.url.startsWith("https://www.google.com/maps/place")) {
      currentURLFront = tab.url.slice(34);
    } else {
      currentURLFront = tab.url.slice(37);
    }

    const storeName = currentURLFront.slice(0, currentURLFront.indexOf("/"));

    if (storeName != "") {
      console.log(reviewsAPI);
      chrome.tabs.sendMessage(
        tab.id,
        {
          reviewsAPI: reviewsAPI,
          storeName: storeName,
        },
        function (response) {
          changeFlag = false;
        }
      );
    }
  }
});

// 監聽API
chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (
      (details.url.startsWith("https://www.google.com/maps/preview/review/") ||
        details.url.startsWith(
          "https://www.google.com.tw/maps/preview/review/"
        )) &&
      !details.url.endsWith("&extension")
    ) {
      reviewsAPI = details.url;
      changeFlag = true;
      console.log(reviewsAPI);

      // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      //   if (
      //     tabs[0].url.startsWith("https://www.google.com/maps/place") ||
      //     tabs[0].url.startsWith("https://www.google.com.tw/maps/place")
      //   ) {
      //     console.log(tabs[0])
      //     let currentURLFront;
      //     if (tabs[0].url.startsWith("https://www.google.com/maps/place")) {
      //       currentURLFront = tabs[0].url.slice(34);
      //     } else {
      //       currentURLFront = tabs[0].url.slice(37);
      //     }

      //     const storeName = currentURLFront.slice(
      //       0,
      //       currentURLFront.indexOf("/")
      //     );

      //     if (storeName != "") {
      //       chrome.tabs.sendMessage(
      //         tabs[0].id,
      //         {
      //           reviewsAPI: details.url,
      //           storeName: storeName,
      //         },
      //         function (response) {
      //           // reviewsAPI = "";
      //         }
      //       );
      //     }
      //   }
      // });
    }
  },
  {
    urls: ["https://www.google.com/maps/*", "https://www.google.com.tw/maps/*"],
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
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    //回傳評論的API
    case "getReviewsAPI":
      // console.log(reviewsAPI)
      sendResponse({ farewell: "goodbye" });

      break;

    default:
      console.error("Unrecognised message: ", message);
      sendResponse({ farewell: "goodbye" });
  }
});
