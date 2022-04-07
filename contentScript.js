var storeURL = "";
var allReviewsCount = 0;
var starMean = 0;
var newsReviewsAPI = "";
var templateReviewsAPI = "";
// var checkReviewsAPI = "";
var APIReturnCount = 0;
var currentReviewsCount = 0;
var step = 0;
var reviewsArr = [];
var reliabilityArr = [];

// 監聽popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
  // console.log(
  //   sender.tab
  //     ? "from a content script:" + sender.tab.url
  //     : "from the extension"
  // );

  if (request.greeting === "hello") {
    // 初始化
    storeURL = "";
    allReviewsCount = 0;
    starMean = 0;
    newsReviewsAPI = "";
    templateReviewsAPI = "";
    // checkReviewsAPI = "";
    APIReturnCount = 0;
    currentReviewsCount = 0;
    step = 0;
    reviewsArr = [];
    reliabilityArr = [];
    clearInterval(getClickBtn);

    var getClickBtn = setInterval(() => {
      let seeAllReviewsBtn =
        document.getElementsByClassName("Yr7JMd-pane-hSRGPd");
      let starMeanDiv = document.getElementsByClassName("aMPvhf-fI6EEc-KVuj8d");

      if (seeAllReviewsBtn[0] != undefined && starMeanDiv[0] != undefined) {
        clearInterval(getClickBtn);

        var allReviewsCountStr = seeAllReviewsBtn[0]
          .getAttribute("aria-label")
          .slice(0, -4)
          .replace(/,/g, "");

        storeURL = window.location.href;
        allReviewsCount = parseInt(allReviewsCountStr);
        starMean = parseFloat(starMeanDiv[0].innerHTML);
        // alert("allReviewsCount: " + allReviewsCount);

        console.log("storeURL: " + storeURL); // 商家URL
        console.log("allReviewsCount: " + allReviewsCount); // 評論數量
        console.log("starMean: " + starMean); // 評分平均

        if (allReviewsCount > 3) {
          seeAllReviewsBtn[0].click();
          reviewsDivShow();
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

        saveTemplateReviewsAPI(targetDiv);
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
      }
    } else {
      console.log("目前沒有div");
    }
  }, 800);
}

// 讀取範本的API
function saveTemplateReviewsAPI(targetDiv) {
  chrome.runtime.sendMessage({ type: "getReviewsAPI" }, function (response) {
    if (response.reviewsAPI != "" && response.reviewsAPI != "error") {
      templateReviewsAPI = response.reviewsAPI;
      newsReviewsAPI =
        templateReviewsAPI.substring(
          0,
          templateReviewsAPI.indexOf("!2m2!") + 16
        ) +
        "2" +
        templateReviewsAPI.substring(
          templateReviewsAPI.indexOf("!2m2!") + 17,
          templateReviewsAPI.length
        );

      console.log("templateReviewsAPI: " + templateReviewsAPI);
      console.log("newsReviewsAPI: " + newsReviewsAPI);

      getAllNewsReviews();
      getReviewsArr(targetDiv);
    } else {
      console.log(response);
      templateReviewsAPI = "";
      newsReviewsAPI = "";

      delay(8);
      window.location.href = storeURL;
      reviewsDivShow();
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

        getAllNewsReviews();
      });
  }
}

// ---------------------------------------------------------------------------------畫面顯示

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
            reviewsArr.push(dataProcessing(soup[2][j]));

            if (reviewsArr.length == soup[2].length) {
              // console.log(reviewsArr);
              modelPredict(targetDiv, oldReviewsCount);
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

// 目前評論資料特徵處理
function dataProcessing(soupArr) {
  if (soupArr[1].indexOf("年") < 0) {
    var content_length = 0;
    var photos_count = 0;
    var content = "";
    var reply = false;
    var reviewer_rank = 0;

    let star_gap = Math.abs(parseInt(soupArr[4]) * 10 - starMean * 10) / 10;
    let date = soupArr[1];
    let like_count = soupArr[16];
    // let reviewer_count = soupArr[12][1][1]

    if (soupArr[3]) {
      if (
        soupArr[3].indexOf("(由 Google 提供翻譯)") == 0 &&
        soupArr[3].indexOf("(原始評論)") > 0
      ) {
        content_length = soupArr[3].length;
        content = soupArr[3].substring(
          16,
          soupArr[3].indexOf("(原始評論)") - 2
        );
      } else {
        content = soupArr[3];
      }

      content_length = content.length;
    }
    if (Array.isArray(soupArr[14])) {
      photos_count = soupArr[14].length;
    }
    if (soupArr[9]) {
      reply = true;
    }
    if (soupArr[12][1][0]) {
      reviewer_rank = soupArr[12][1][0][0];
    }

    return [
      content_length,
      photos_count,
      `"${content}"`,
      star_gap,
      date,
      like_count,
      reply,
      reviewer_rank,
    ];
  } else {
    return [];
  }
}

// 回傳模型預測可靠度
function modelPredict(targetDiv, oldReviewsCount) {
  reliabilityArr = [];
  for (i = 0; i < reviewsArr.length; i++) {
    if (reviewsArr[i].length == 0) {
      reliabilityArr.push([i, -1]);

      if (reliabilityArr.length == reviewsArr.length) {
        console.log(reliabilityArr);
        showReliability(targetDiv, oldReviewsCount);
      }
    } else {
      // model測試
      var url = "https://thesis-model-backend.herokuapp.com/predict";
      var data = {
        index: i,
        content_length: reviewsArr[i][0],
        photos_count: reviewsArr[i][1],
        star_gap: reviewsArr[i][3],
        like_count: reviewsArr[i][5],
        reply: reviewsArr[i][6],
        reviewer_rank: reviewsArr[i][7],
      };

      // console.log(data);
      fetch(url, {
        method: "POST", // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      })
        .then((res) => res.json())
        .catch((error) => console.error("Error:", error))
        .then((response) => {
          // console.log("Success:", response);
          reliabilityArr.push([
            parseInt(response.index),
            parseInt(response.predict),
          ]);

          if (reliabilityArr.length == reviewsArr.length) {
            // console.log(reliabilityArr);
            showReliability(targetDiv, oldReviewsCount);
          }
        });
      // // model測試
    }
  }
}

// 顯示可靠度標籤
function showReliability(targetDiv, oldReviewsCount) {
  for (
    reviewIndex = parseInt((oldReviewsCount + 1) / 3);
    reviewIndex < parseInt((currentReviewsCount + 1) / 3);
    reviewIndex++
  ) {
    // console.log(reviewIndex - parseInt((oldReviewsCount + 1) / 3));
    let targetReview = targetDiv.children[reviewIndex * 3];

    if (targetReview.getAttribute("aria-label")) {
      let reviewDiv =
        targetReview.children[0].children[2].children[3].children[0];

      // console.log(reviewDiv);

      let reviewStar = reviewDiv.children[1].getAttribute("aria-label");

      // console.log(reviewStar);

      let color = "#ffcc00";
      let reliability = "中立";

      for (
        predictElement = 0;
        predictElement < reliabilityArr.length;
        predictElement++
      ) {
        if (
          reliabilityArr[predictElement][0] ==
          reviewIndex - parseInt((oldReviewsCount + 1) / 3)
        ) {
          console.log(reliabilityArr[predictElement]);
          switch (reliabilityArr[predictElement][1]) {
            case -1:
              color = "#ff3a30";
              reliability = "非常不可靠";
              break;
            case 1:
              color = "#ff9500";
              reliability = "不可靠";
              break;
            case 2:
              color = "#00c7be";
              reliability = "可靠";
              break;
            // case 5:
            //   color = "#34c759";
            //   reliability = "非常可靠";
            //   break;
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
          predictElement = reliabilityArr.length;
        }
      }
    }
  }
}

function delay(n) {
  return new Promise(function (resolve) {
    setTimeout(resolve, n * 100);
  });
}
