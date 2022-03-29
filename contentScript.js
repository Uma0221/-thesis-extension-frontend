var reviewsCount = 0;
var newsReviewURL = "";
var relatedReviewURL = "";
var apiReturnCount = 0;
var lastVisibleReviewIndex = 0;
var step = 0;

// 監聽popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
  // console.log(
  //   sender.tab
  //     ? "from a content script:" + sender.tab.url
  //     : "from the extension"
  // );

  if (request.greeting === "hello") {
    // 初始化
    reviewsCount = 0;
    newsReviewURL = "";
    relatedReviewURL = "";
    apiReturnCount = 0;
    lastVisibleReviewIndex = 0;
    step = 0;

    var getClickBtn = setInterval(() => {
      let reviewsBtn = document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

      if (reviewsBtn[0] != undefined) {
        clearInterval(getClickBtn);

        var countStr = reviewsBtn[0]
          .getAttribute("aria-label")
          .slice(0, -4)
          .replace(/,/g, "");

        console.log(countStr); // 評論數量
        reviewsCount = Number(countStr);
        alert("reviewsCount: " + reviewsCount);

        if (reviewsCount > 3) {
          reviewsBtn[0].click();
          clickMenuBtn();
        }
      } else {
        console.log("等待按鈕生成");
      }
    }, 500);
  } 
  // else if (request.reviewURL) {
  //   // console.log("currentStore: " + request.currentStore);
  //   // console.log(request.reviewURL);
  // }

  response({});
});

// 自動點擊排序按鈕
function clickMenuBtn() {
  clearInterval(getMenuBtn);

  var getMenuBtn = setInterval(() => {
    let mainDiv = document.querySelector('[role="main"]');
    let menuBtn = document.querySelector('[aria-label="排序評論"]');

    // console.log(mainDiv.getAttribute("aria-label"));

    if (menuBtn && mainDiv.getAttribute("aria-label").includes("所有評論")) {
      clearInterval(getMenuBtn);
      menuBtn.click();

      if (step == 0) {
        clickNewsBtn();
      } else if (step == 2) {
        clickRelatedBtn();
      }
    } else {
      // console.log("等待選單按鈕生成");
    }
  }, 500);
}

// 自動點擊最新按鈕
function clickNewsBtn() {
  let newsBtn = document.querySelector('[role="menu"]');

  if (newsBtn && newsBtn.children[1]) {
    // console.log(newsBtn.children[1]);
    step = 1;

    newsBtn.children[1].click();
    saveNewsReviewURL();
  } else {
    // console.log("等待最新按鈕生成");
    clickMenuBtn();
  }
}

// 讀取最新的api
function saveNewsReviewURL() {
  clearInterval(getNewsReviewURL);

  var getNewsReviewURL = setInterval(() => {
    chrome.runtime.sendMessage({ type: "getreviewURL" }, function (response) {
      if (response.reviewURL == "error") {
        clearInterval(getNewsReviewURL);
        console.log("回傳錯誤");
        newsReviewURL = "";
        window.location.reload();

        saveNewsReviewURL();
      } else if (response.reviewURL != "") {
        newsReviewURL = response.reviewURL;
        clearInterval(getNewsReviewURL);
        step = 2;

        console.log("newsReviewURL: " + newsReviewURL);

        getALLReviews();
        clickMenuBtn();
      }
    });
  }, 500);
}

// 取得最新的評論時間
function getALLReviews() {
  var time = [];

  var decade = 0;
  if (reviewsCount > 2000) {
    console.log("太多評論了！");
    decade = 200;
  } else if (reviewsCount % 10 > 0) {
    decade = parseInt(reviewsCount / 10) + 1;
  } else {
    decade = parseInt(reviewsCount / 10);
  }

  for (i = 0; i < decade; i++) {
    let otherNewsReviewURL =
      newsReviewURL.substring(0, newsReviewURL.indexOf("!2m2!") + 7) +
      (i * 10).toString() +
      newsReviewURL.substring(
        newsReviewURL.indexOf("!2m2!") + 8,
        newsReviewURL.length
      );

    // console.log(otherNewsReviewURL); // 後續載入的URL

    fetch(otherNewsReviewURL)
      .then(function (response) {
        return response.text();
      })
      .then(function (requests_result) {
        let pretext = ")]}'";
        let text = requests_result.replace(pretext, "");
        let soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            time.push(soup[2][j][1]);
          }
        }

        if (apiReturnCount == decade - 1) {
          apiReturnCount = 0;

          console.log(time);

          newsReviewURL = "";
        } else {
          apiReturnCount++;
        }
      })
      .catch((rejected) => {
        console.log(rejected);

        var time = [];
        newsReviewURL = "";
        saveNewsReviewURL();
      });
  }
}

// ---------------------------------------------------------------------------------畫面顯示

// 自動點擊最相關按鈕
function clickRelatedBtn() {
  let relatedBtn = document.querySelector('[role="menu"]');

  if (relatedBtn && relatedBtn.children[0]) {
    // console.log(relatedBtn.children[0]);
    relatedBtn.children[0].click();
    saveRelatedReviewURL();  
    step = 0;

    ReviewsShow();
  } else {
    // console.log("等待最相關按鈕生成");
    clickMenuBtn();
  }
}

// 讀取最新的api
function saveRelatedReviewURL() {
  clearInterval(getRelatedReviewURL);

  var getRelatedReviewURL = setInterval(() => {
    chrome.runtime.sendMessage({ type: "getreviewURL" }, function (response) {
      if (response.reviewURL == "error") {
        clearInterval(getRelatedReviewURL);
        console.log("回傳錯誤");
        relatedReviewURL = "";
        window.location.reload();

        saveRelatedReviewURL();
      } else if (response.reviewURL != "") {
        relatedReviewURL = response.reviewURL;
        clearInterval(getRelatedReviewURL);
        step = 2;

        console.log("relatedReviewURL: " + relatedReviewURL);
      }
    });
  }, 500);
}

// 等待評論顯示
function ReviewsShow() {
  clearInterval(waitReviewsShow);

  var waitReviewsShow = setInterval(() => {
    if (
      document.getElementsByClassName("section-scrollbox")[0] &&
      document.getElementsByClassName("section-scrollbox")[0].children.length >
        1
    ) {
      console.log(
        "目前div數量: " +
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ].children.length
      );

      var waitCount = 0;
      if (reviewsCount < 10) {
        waitCount = reviewsCount * 3 - 1;
      } else {
        waitCount = 29;
      }
      if (
        document.getElementsByClassName("section-scrollbox")[0].children[
          document.getElementsByClassName("section-scrollbox")[0].children
            .length - 2
        ].children.length >= waitCount
      ) {
        clearInterval(waitReviewsShow);
        let targetDiv =
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ];

        showReliability(targetDiv);
        createReviewsObserver();
      }
    } else {
      console.log("目前沒有div");
    }
  }, 500);
}

function createReviewsObserver() {

  let reviewsDiv = document.getElementsByClassName("section-scrollbox");

  const targetNode = reviewsDiv[0].children[reviewsDiv[0].children.length - 2];

  const config = { childList: true };

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for (const mutation of mutationsList) {
      if (
        mutation.type === "childList" &&
        mutation.target.children.length - 1 != lastVisibleReviewIndex
      ) {
        showReliability(mutation.target);
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);

  // Later, you can stop observing
  // observer.disconnect();
}

function showReliability(targetDiv) {
  for (
    reviewIndex = lastVisibleReviewIndex;
    reviewIndex < targetDiv.children.length - 1;
    reviewIndex++
  ) {
    let currentReview = targetDiv.children[reviewIndex];

    if (currentReview.getAttribute("aria-label")) {
      let reviewDiv =
        currentReview.children[0].children[2].children[3].children[0];

      // console.log(reviewDiv);

      let reviewStar = reviewDiv.children[1].getAttribute("aria-label");

      // console.log(reviewStar);

      let color = "#ffcc00";
      let reliability = "中立";

      switch (Number(reviewStar[1])) {
        case 1:
          color = "#ff3a30";
          reliability = "非常不可靠";
          break;
        case 2:
          color = "#ff9500";
          reliability = "不可靠";
          break;
        case 4:
          color = "#00c7be";
          reliability = "可靠";
          break;
        case 5:
          color = "#34c759";
          reliability = "非常可靠";
          break;
        default:
          break;
      }

      var innerDiv = document.createElement("div");
      innerDiv.className = "add-div";
      innerDiv.textContent = reliability;

      innerDiv.style.fontSize = "12px";
      innerDiv.style.color = "#ffffff";
      innerDiv.style.backgroundColor = color;
      innerDiv.style.margin = "1px 8px";
      innerDiv.style.padding = "2px 8px";
      innerDiv.style.borderRadius = "20px";

      reviewDiv.appendChild(innerDiv);
    }
  }
  lastVisibleReviewIndex = targetDiv.children.length - 1;
  console.log("目前div數量: " + lastVisibleReviewIndex);
}

// function delay(n){
//   return new Promise(function(resolve){
//       setTimeout(resolve,n*100);
//   });
// }
