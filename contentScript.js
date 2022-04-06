var allReviewsCount = 0;
var newsReviewsAPI = "";
var templateReviewsAPI = "";
// var checkReviewsAPI = "";
var APIReturnCount = 0;
var currentReviewsCount = 0;
var step = 0;
var reviewsArr = [];

// 監聽popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
  // console.log(
  //   sender.tab
  //     ? "from a content script:" + sender.tab.url
  //     : "from the extension"
  // );

  if (request.greeting === "hello") {
    // 初始化
    allReviewsCount = 0;
    newsReviewsAPI = "";
    templateReviewsAPI = "";
    // checkReviewsAPI = "";
    APIReturnCount = 0;
    currentReviewsCount = 0;
    step = 0;
    reviewsArr = [];
    clearInterval(getClickBtn);

    var getClickBtn = setInterval(() => {
      let seeAllReviewsBtn =
        document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

      if (seeAllReviewsBtn[0] != undefined) {
        clearInterval(getClickBtn);

        var allReviewsCountStr = seeAllReviewsBtn[0]
          .getAttribute("aria-label")
          .slice(0, -4)
          .replace(/,/g, "");

        console.log(allReviewsCountStr); // 評論數量
        allReviewsCount = parseInt(allReviewsCountStr);
        // alert("allReviewsCount: " + allReviewsCount);

        if (allReviewsCount > 3) {
          seeAllReviewsBtn[0].click();
          clickMenuBtn();
        }
      } else {
        console.log("等待按鈕生成");
      }
    }, 800);
  }
  // else if (request.reviewsAPI) {
  //   // console.log("currentURL: " + request.currentURL);
  //   // console.log("checkReviewsAPI: " + request.reviewsAPI);
  //   checkReviewsAPI = request.reviewsAPI;
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
      } else if (step == 1) {
        clickRelatedBtn();
      }
    } else {
      // console.log("等待選單按鈕生成");
    }
  }, 800);
}

// 自動點擊最新按鈕
function clickNewsBtn() {
  let newsBtn = document.querySelector('[role="menu"]');

  if (newsBtn && newsBtn.children[1]) {
    // console.log(newsBtn.children[1]);
    newsBtn.children[1].click();

    saveNewsReviewsAPI();
  } else {
    // console.log("等待最新按鈕生成");
    clickMenuBtn();
  }
}

// 讀取最新的API
function saveNewsReviewsAPI() {
  console.log("saveNewsReviewsAPI");
  chrome.runtime.sendMessage({ type: "getReviewsAPI" }, function (response) {
    if (response.reviewsAPI != "" && response.reviewsAPI != "error") {
      newsReviewsAPI = response.reviewsAPI;

      console.log("newsReviewsAPI: " + newsReviewsAPI);
      getAllNewsReviews();

      step = 1;
      clickMenuBtn();
    } else {
      console.log(response);
      newsReviewsAPI = "";

      delay(8);
      window.location.reload();
      clickMenuBtn();
    }
  });
}

// 取得最新的評論時間
function getAllNewsReviews() {
  var time = [];

  var reviewsDecimal = 0;
  if (allReviewsCount > 2000) {
    console.log("太多評論了！");
    reviewsDecimal = 200;
  } else if (allReviewsCount % 10 > 0) {
    reviewsDecimal = parseInt(allReviewsCount / 10) + 1;
  } else {
    reviewsDecimal = parseInt(allReviewsCount / 10);
  }

  for (i = 0; i < reviewsDecimal; i++) {
    let otherNewsReviewsAPI =
      newsReviewsAPI.substring(0, newsReviewsAPI.indexOf("!2m2!") + 7) +
      (i * 10).toString() +
      newsReviewsAPI.substring(
        newsReviewsAPI.indexOf("!2m2!") + 8,
        newsReviewsAPI.length
      );

    // console.log(otherNewsReviewsAPI); // 後續載入的API

    fetch(otherNewsReviewsAPI)
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

        if (APIReturnCount == reviewsDecimal - 1) {
          APIReturnCount = 0;

          console.log(time);

          newsReviewsAPI = "";
        } else {
          APIReturnCount++;
        }
      })
      .catch((rejected) => {
        console.log(rejected);

        time = [];
        newsReviewsAPI = "";
        saveNewsReviewsAPI();
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

    saveTemplateReviewsAPI();
  } else {
    // console.log("等待最相關按鈕生成");
    clickMenuBtn();
  }
}

// 讀取範本的API
function saveTemplateReviewsAPI() {
  console.log("saveTemplateReviewsAPI");
  chrome.runtime.sendMessage({ type: "getReviewsAPI" }, function (response) {
    if (response.reviewsAPI != "" && response.reviewsAPI != "error") {
      templateReviewsAPI = response.reviewsAPI;

      console.log("templateReviewsAPI: " + templateReviewsAPI);

      step = 0;
      reviewsDivShow();
    } else {
      console.log(response);
      templateReviewsAPI = "";

      delay(8);
      window.location.reload();
      clickMenuBtn();
    }
  });
}

// 等待評論顯示
function reviewsDivShow() {
  clearInterval(waitReviewsDivShow);

  var waitReviewsDivShow = setInterval(() => {
    if (
      document.getElementsByClassName("section-scrollbox")[0] &&
      document.getElementsByClassName("section-scrollbox")[0].children.length >
        1
    ) {
      console.log(
        "currentReviewsCount: " +
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ].children.length
      );

      var loadReviewsCount = 0;
      if (allReviewsCount < 10) {
        loadReviewsCount = allReviewsCount * 3 - 1;
      } else {
        loadReviewsCount = 29;
      }

      if (
        document.getElementsByClassName("section-scrollbox")[0].children[
          document.getElementsByClassName("section-scrollbox")[0].children
            .length - 2
        ].children.length >= loadReviewsCount
      ) {
        clearInterval(waitReviewsDivShow);
        let targetDiv =
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ];

        getReviewsArr(targetDiv);
        createReviewsObserver();

        // // 情緒測試
        // var url =
        //   "https://thesis-sentiment-analysis.cognitiveservices.azure.com//text/analytics/v3.0/sentiment";
        // var data = {
        //   documents: [
        //     {
        //       language: "zh-hant",
        //       id: "1",
        //       text: "和朋友導航來到了敲我，我們點了\n\n📍籽籽百香果塔\n草莓點綴於像是雲朵般的百香果鮮奶油上方，內餡百香果原汁原味的籽保留，口感更添滋味溫和順口，塔殼部份酥脆有香氣，讓我吃了不停默默點頭。\n\n📍雙重人格檸檬塔\n檸檬皮刨成絲於最頂端接著檸檬鮮奶油，內餡滿滿檸檬酸酸但爽口香氣四溢，搭配塔殼一起吃層次更是豐富！\n\n📍香橙拿鐵（含酒精 君度橙酒）\n一入口淡淡橙香的味道用咖啡巧妙結合，當然意外順口，咖啡介於不酸不苦之間，這我給過！ 對了～點咖啡或茶品會有小餅乾。\n\n時間的關係沒辦法好好聊天，有機會在一起喝咖啡，然後這間甜點沒有讓人失望，反而感受很用心，但是店家人手不足，來到這兒的各位需要耐心等待。",
        //     },
        //   ],
        // };

        // fetch(url, {
        //   method: "POST", // or 'PUT'
        //   body: JSON.stringify(data), // data can be `string` or {object}!
        //   headers: new Headers({
        //     "Content-Type": "application/json",
        //     "Ocp-apim-subscription-key": "50d636d9e4844528bd878b47e8c694bd",
        //   }),
        // })
        //   .then((res) => res.json())
        //   .catch((error) => console.error("Error:", error))
        //   .then((response) => console.log("Success:", response));

        // // 情緒測試

        // // model測試
        // var url = "https://thesis-model-backend.herokuapp.com/predict";
        // var data = {
        //   content_length: 30,
        //   photos_count: 0,
        //   star_gap: 0.6,
        //   like_count: 0,
        //   reply: false,
        //   reviewer_rank: 0,
        // };

        // fetch(url, {
        //   method: "POST", // or 'PUT'
        //   body: JSON.stringify(data), // data can be `string` or {object}!
        //   headers: new Headers({
        //     "Content-Type": "application/json",
        //   }),
        // })
        //   .then((res) => res.json())
        //   .catch((error) => console.error("Error:", error))
        //   .then((response) => console.log("Success:", response));

        // // model測試
      }
    } else {
      console.log("目前沒有div");
    }
  }, 800);
}

// 監聽評論Div的變化
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
        mutation.target.children.length != currentReviewsCount
      ) {
        // console.log("api: " + checkReviewsAPI);
        getReviewsArr(mutation.target);
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

// 取得評論內容
function getReviewsArr(targetDiv) {
  if (templateReviewsAPI != "") {
    let oldReviewsCount = currentReviewsCount;
    currentReviewsCount = targetDiv.children.length;
    console.log("currentReviewsCount: " + currentReviewsCount);

    var reviewsDecimal = 0;
    if (((currentReviewsCount + 1) / 3) % 10 > 0) {
      reviewsDecimal = parseInt((currentReviewsCount + 1) / 30) + 1;
    } else {
      reviewsDecimal = parseInt((currentReviewsCount + 1) / 30);
    }

    let reviewsAPI =
      templateReviewsAPI.substring(0, templateReviewsAPI.indexOf("!2m2!") + 7) +
      ((reviewsDecimal - 1) * 10).toString() +
      templateReviewsAPI.substring(
        templateReviewsAPI.indexOf("!2m2!") + 8,
        templateReviewsAPI.length
      );

    reviewsArr = [];

    fetch(reviewsAPI)
      .then(function (response) {
        return response.text();
      })
      .then(function (requests_result) {
        console.log("reviewsAPI: " + reviewsAPI);

        let pretext = ")]}'";
        let text = requests_result.replace(pretext, "");
        let soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            reviewsArr.push(soup[2][j]);

            if (j == soup[2].length - 1) {
              console.log(reviewsArr);
              showReliability(targetDiv, oldReviewsCount);
            }
          }
        }
      })
      .catch((rejected) => {
        console.log(rejected);

        reviewsArr = [];
        getReviewsArr(targetDiv);
      });
  }
}

// 顯示可靠度標籤
function showReliability(targetDiv, oldReviewsCount) {
  for (
    reviewIndex = parseInt((oldReviewsCount + 1) / 3);
    reviewIndex < parseInt((currentReviewsCount + 1) / 3);
    reviewIndex++
  ) {
    let targetReview = targetDiv.children[reviewIndex * 3];

    if (targetReview.getAttribute("aria-label")) {
      let reviewDiv =
        targetReview.children[0].children[2].children[3].children[0];

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
}

function delay(n) {
  return new Promise(function (resolve) {
    setTimeout(resolve, n * 100);
  });
}
