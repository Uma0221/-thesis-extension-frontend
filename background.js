var reviewURL = "";
var currentURL = "";

// 網頁url變化
chrome.tabs.onUpdated.addListener(function (changeInfo) {
  if (
    changeInfo.url &&
    changeInfo.url.startsWith("https://www.google.com/maps/")
  ) {
    currentURL = changeInfo.url;
    // console.log(changeInfo.url);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { currentURL: currentURL });
    });
  }
});

// 監聽api
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.startsWith("https://www.google.com/maps/preview/review/")) {
      reviewURL = details.url;
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
      // console.log(reviewURL);
      response({ reviewURL: reviewURL, currentURL: currentURL });

      reviewURL = ""; // Success!
      currentURL = "";

      // console.log(reviewURL);

      // if(reviewURL != ""){
      //     reviewURL = "";
      // }

      break;

    default:
      console.error("Unrecognised message: ", message);
  }
});
