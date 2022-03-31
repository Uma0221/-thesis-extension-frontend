var reviewURL = "";

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
      
      response({ reviewURL: reviewURL });
      reviewURL = ""; // Success!

      break;

    default:
      console.error("Unrecognised message: ", message);
  }
});
