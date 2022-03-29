var reviewURL = "";
// var currentStore = "";

// // 網頁url變化
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   console.log(changeInfo);
//   if (
//     changeInfo.url &&
//     changeInfo.url.startsWith("https://www.google.com/maps/place")
//   ) {
//     var backURL = changeInfo.url.slice(34);
//     currentStore = backURL.slice(0, backURL.indexOf("/"));
//     // console.log(changeInfo.url.slice(33))
//   }
// });

// 監聽api
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.startsWith("https://www.google.com/maps/preview/review/")) {
      reviewURL = details.url;
      // console.log("api: " + reviewURL);

      // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      //   chrome.tabs.sendMessage(tabs[0].id, {
      //     reviewURL: reviewURL,
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
    reviewURL = "error";
  },
  {
    urls: ["https://www.google.com/maps/*"],
  }
);

// 回傳狀態
chrome.runtime.onMessage.addListener(function (message, sender, response) {
  switch (message.type) {
    //回傳評論的URL
    case "getreviewURL":
      response({ reviewURL: reviewURL });

      reviewURL = ""; // Success!

      // console.log(reviewURL);

      // if(reviewURL != ""){
      //     reviewURL = "";
      // }

      break;

    default:
      console.error("Unrecognised message: ", message);
  }
});
