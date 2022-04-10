let errorFlag = false;

let oldStoreName = "";
let monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let reviewsAPI = "";

let starMean = 0;
let allReviewsCount = 0;

let oldReviewsCount = 0;
let currentReviewsCount = 0;

let newsReviewsAPI = "";
let reviewsArr = [];
let reliabilityArr = [];

let color = "#c7c7cc";
let reliability = "評估中...";

let waitReviewsDiv;
let waitReviewDivs;
let waitMonthRateArr;
let waitAddDivs;

// 監聽評論API
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // 初始化-------------------------------
  reviewsAPI = "";

  starMean = 0;
  allReviewsCount = 0;

  oldReviewsCount = 0;
  currentReviewsCount = 0;

  newsReviewsAPI = "";
  reviewsArr = [];
  reliabilityArr = [];

  color = "#c7c7cc";
  reliability = "評估中...";

  // clearTimeout(waitReviewsDiv);
  // clearTimeout(waitReviewDivs);
  // clearTimeout(waitMonthRateArr);
  // clearTimeout(waitAddDivs);
  // 初始化-------------------------------
  reviewsAPI = message.reviewsAPI;
  console.log("reviewsAPI: " + reviewsAPI);

  console.log("oldStoreName: " + oldStoreName);
  console.log("storeName: " + message.storeName);

  if (oldStoreName != message.storeName) {
    oldStoreName = message.storeName;
    newsReviewsAPI =
      reviewsAPI.substring(
        0,
        reviewsAPI.indexOf("!2m2!") +
          reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 4).indexOf("!") +
          16
      ) +
      "2" +
      reviewsAPI.substring(
        reviewsAPI.indexOf("!2m2!") +
          reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 5).indexOf("!") +
          14,
        reviewsAPI.length
      );

    // console.log("newsReviewsAPI: " + newsReviewsAPI);
  }
  sendResponse({ farewell: "goodbye" });
  reviewsDivShow();
});

// 等待評論顯示
function reviewsDivShow() {
  if (
    // 確認標題為"所有評論"
    document.getElementsByClassName("iD2gKb")[0] &&
    document.getElementsByClassName("iD2gKb")[0].innerHTML == "所有評論" &&
    // 確認有卷軸
    document.getElementsByClassName("section-scrollbox")[0] &&
    document.getElementsByClassName("section-scrollbox")[0].children.length <=
      10 &&
    // 確認有商家評分資訊
    document.getElementsByClassName("jANrlb")[0] &&
    document.getElementsByClassName("jANrlb")[0].children.length == 4
  ) {
    const targetDiv =
      document.getElementsByClassName("section-scrollbox")[0].children[
        document.getElementsByClassName("section-scrollbox")[0].children
          .length - 2
      ];

    let loadReviewsCount = 0;
    if (allReviewsCount < 10) {
      loadReviewsCount = allReviewsCount * 3 - 1;
    } else {
      loadReviewsCount = 29;
    }

    if (
      targetDiv.children.length >= loadReviewsCount &&
      targetDiv.children[0] &&
      targetDiv.children[0].getAttribute("data-review-id")
    ) {
      starMean = parseFloat(
        document.getElementsByClassName("jANrlb")[0].children[0].innerHTML
      );
      allReviewsCount = parseInt(
        document
          .getElementsByClassName("jANrlb")[0]
          .children[3].innerHTML.slice(0, -4)
          .replace(/,/g, "")
      );

      addReviewsLabel(targetDiv);

      if (newsReviewsAPI != "") {
        getMonthRate();
        console.log(
          "starMean: " + starMean + ", allReviewsCount: " + allReviewsCount
        );
      }
    } else {
      waitReviewsDiv = setTimeout(reviewsDivShow, 500);
    }
  } else if (
    document.getElementsByClassName("section-scrollbox")[0] &&
    document.getElementsByClassName("section-scrollbox")[0].children.length > 10
  ) {
    newsReviewsAPI = "";
    console.log("這是飯店");
  } else {
    waitReviewsDiv = setTimeout(reviewsDivShow, 500);
  }
}

// 取得最新的評論時間
function getMonthRate() {
  monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let APIReturnCount = 0;
  let timeCount = 0;

  let reviewsDecimal = 0;
  if (allReviewsCount > 2000) {
    console.log("太多評論了！");
    reviewsDecimal = 200;
  } else if (allReviewsCount % 10 > 0) {
    reviewsDecimal = parseInt(allReviewsCount / 10) + 1;
  } else {
    reviewsDecimal = parseInt(allReviewsCount / 10);
  }

  console.log("newsgeting...");
  const newsgeting = setInterval(() => console.log("newsgeting..."), 1000);

  for (i = 0; i < reviewsDecimal; i++) {
    const otherNewsReviewsAPI =
      newsReviewsAPI.substring(
        0,
        newsReviewsAPI.indexOf("!2m2!") +
          newsReviewsAPI
            .slice(newsReviewsAPI.indexOf("!2m2!") + 4)
            .indexOf("!") +
          7
      ) +
      (i * 10).toString() +
      newsReviewsAPI.substring(
        newsReviewsAPI.indexOf("!2m2!") +
          newsReviewsAPI
            .slice(newsReviewsAPI.indexOf("!2m2!") + 5)
            .indexOf("!") +
          5,
        newsReviewsAPI.length
      );

    // console.log("otherNewsReviewsAPI: " + otherNewsReviewsAPI); // 後續載入的API

    fetch(otherNewsReviewsAPI)
      .then(function (response) {
        chrome.runtime.sendMessage({ type: "getReviewsAPI" });
        return response.text();
      })
      .catch((error) => {
        clearInterval(newsgeting);
        errorFlag = true;

        console.log("newsget error");
        console.error("error: " + error);

        monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        timeCount = 0;

        // getMonthRate();
      })
      .then(function (requests_result) {
        const pretext = ")]}'";
        const text = requests_result.replace(pretext, "");
        const soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            if (soup[2][j][1].indexOf("年") < 0) {
              timeCount++;
              if (soup[2][j][1].indexOf("月") < 0) {
                monthRateArr[0]++;
              } else {
                monthRateArr[parseInt(soup[2][j][1].slice(0, -4))]++;
              }
            }
          }
        }

        if (APIReturnCount == reviewsDecimal - 1) {
          clearInterval(newsgeting);
          console.log("newsget complete");
          APIReturnCount = 0;
          newsReviewsAPI = "";

          for (i = 0; i < monthRateArr.length; i++) {
            monthRateArr[i] = (monthRateArr[i] / timeCount).toFixed(2);
          }
          console.log(monthRateArr); // 前2000筆的評論時
          timeCount = 0;
        } else {
          APIReturnCount++;
        }
      });
  }
}

// ---------------------------------------------------------------------------------畫面顯示
// 新增評論標籤
function addReviewsLabel(targetDiv) {
  clearTimeout(waitReviewDivs);

  if (((targetDiv.children.length + 1) / 3) % 10 > 0) {
    oldReviewsCount = parseInt((targetDiv.children.length + 1) / 30) * 10;
  } else {
    oldReviewsCount = (targetDiv.children.length + 1) / 3 - 10;
  }
  currentReviewsCount = (targetDiv.children.length + 1) / 3;

  console.log("oldReviewsCount: " + oldReviewsCount);
  console.log("currentReviewsCount: " + currentReviewsCount);

  if (Number.isInteger(currentReviewsCount)) {
    for (
      reviewIndex = oldReviewsCount;
      reviewIndex < currentReviewsCount;
      reviewIndex++
    ) {
      const targetReview = targetDiv.children[reviewIndex * 3];

      if (targetReview && targetReview.getAttribute("aria-label")) {
        const reviewDiv =
          targetReview.children[0].children[2].children[3].children[0];

        let innerDiv = document.createElement("div");
        innerDiv.id = "add-div-" + reviewIndex.toString();
        innerDiv.className = "add-div";
        innerDiv.textContent = reliability;

        innerDiv.style.fontSize = "12px";
        innerDiv.style.color = "#ffffff";
        innerDiv.style.backgroundColor = color;
        innerDiv.style.margin = "1px 8px";
        innerDiv.style.padding = "2px 8px";
        innerDiv.style.borderRadius = "20px";

        if (document.getElementById("add-div-" + reviewIndex.toString())) {
          document.getElementById("add-div-" + reviewIndex.toString()).remove();
          console.log("removeDiv");
        }
        reviewDiv.appendChild(innerDiv);
      } else {
        reviewIndex = currentReviewsCount;
        waitReviewDivs = setTimeout(addReviewsLabel, 500, targetDiv);
      }

      if (
        reviewIndex == currentReviewsCount - 1 &&
        document.getElementById("add-div-" + reviewIndex.toString())
      ) {
        getReviewsArr(targetDiv);
      }
    }
  } else {
    waitReviewDivs = setTimeout(addReviewsLabel, 500, targetDiv);
  }
}

// 取得評論內容
function getReviewsArr(targetDiv) {
  reviewsArr = [];

  console.log("currentgeting...");
  const currentgeting = setInterval(
    () => console.log("currentgeting..."),
    1000
  );

  fetch(reviewsAPI)
    .then(function (response) {
      chrome.runtime.sendMessage({ type: "getReviewsAPI" });
      return response.text();
    })
    .catch((error) => {
      clearInterval(currentgeting);
      errorFlag = true;
      showReliability(targetDiv);

      console.log("currentget error");
      console.error("error: " + error);
      reviewsArr = [];

      // getReviewsArr(targetDiv);
    })
    .then(function (requests_result) {
      clearInterval(currentgeting);
      console.log("currentget complete");
      // console.log("reviewsAPI: " + reviewsAPI);
      const pretext = ")]}'";
      const text = requests_result.replace(pretext, "");
      const soup = JSON.parse(text);

      if (soup[2]) {
        getUsefulData(soup[2], targetDiv);
      }
    });
}

function getUsefulData(oriArr, targetDiv) {
  clearTimeout(waitMonthRateArr);

  if (typeof monthRateArr[0] == "string") {
    for (j = 0; j < oriArr.length; j++) {
      reviewsArr.push(dataProcessing(oriArr[j]));

      if (reviewsArr.length == oriArr.length) {
        console.log(reviewsArr); //目前的評論內容
        modelPredict(targetDiv);
      }
    }
  } else if (errorFlag) {
    showReliability(targetDiv);
  } else {
    waitMonthRateArr = setTimeout(getUsefulData, 500, oriArr);
  }
}

// 目前評論資料特徵處理
function dataProcessing(soupArr) {
  if (soupArr[1].indexOf("年") < 0) {
    let content_length = 0;
    let photos_count = 0;
    let content = "";
    let month_rate = 0;
    let reply = false;
    let reviewer_rank = 0;

    const star_gap = Math.abs(parseInt(soupArr[4]) * 10 - starMean * 10) / 10;
    const like_count = soupArr[16];
    // const reviewer_count = soupArr[12][1][1]

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

    if (soupArr[1].indexOf("月") < 0) {
      month_rate = parseFloat(monthRateArr[0]);
    } else {
      month_rate = parseFloat(monthRateArr[parseInt(soupArr[1].slice(0, -4))]);
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
      month_rate,
      like_count,
      reply,
      reviewer_rank,
    ];
  } else {
    return [];
  }
}

// 回傳模型預測可靠度
function modelPredict(targetDiv) {
  let sendModelArr = [];
  reliabilityArr = [];
  const url = "https://thesis-model-backend.herokuapp.com/predict";
  let data = {};

  for (i = 0; i < reviewsArr.length; i++) {
    if (reviewsArr[i].length == 0) {
      data = {
        index: i,
      };
    } else {
      data = {
        index: i,
        content_length: reviewsArr[i][0],
        photos_count: reviewsArr[i][1],
        content_positive: 0.33, //正向情緒
        content_neutral: 0.34,  //中立情緒
        content_negative: 0.33, //負向情緒
        star_gap: reviewsArr[i][3],
        month_rate: reviewsArr[i][4],
        like_count: reviewsArr[i][5],
        reply: reviewsArr[i][6],
        reviewer_rank: reviewsArr[i][7],
      };
    }

    sendModelArr.push(data);
  }

  console.log("predicting...");
  const predicting = setInterval(() => console.log("predicting..."), 1000);

  // console.log("sendModelArr: "+sendModelArr); //傳給模型的資料
  fetch(url, {
    method: "POST", // or 'PUT'
    body: JSON.stringify(sendModelArr), // data can be `string` or {object}!
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => {
      clearInterval(predicting);
      errorFlag = true;
      showReliability(targetDiv);

      console.log("predict error");
      console.error("Error:", error);
    })
    .then((response) => {
      clearInterval(predicting);
      console.log("predict complete");
      reliabilityArr = response;
      console.log(reliabilityArr); //回傳的預測結果
      if (reviewsArr != []) {
        showReliability(targetDiv);
      }
    });
}

// 顯示可靠度標籤
function showReliability(targetDiv) {
  clearTimeout(waitAddDivs);
  if (Number.isInteger(currentReviewsCount)) {
    if (reliabilityArr.length == currentReviewsCount - oldReviewsCount) {
      for (
        reviewIndex = oldReviewsCount;
        reviewIndex < currentReviewsCount;
        reviewIndex++
      ) {
        if (document.getElementById("add-div-" + reviewIndex.toString())) {
          const targetReview = document.getElementById(
            "add-div-" + reviewIndex.toString()
          );

          if (errorFlag) {
            color = "#ff3a30";
            reliability = "評估失敗";
          } else {
            switch (
              parseInt(reliabilityArr[reviewIndex - oldReviewsCount].predict)
            ) {
              case -1:
                color = "#636366";
                reliability = "一年前的資料";
                break;
              case 1:
                color = "#ffcc00";
                reliability = "不可靠";
                break;
              case 0:
                color = "#ff9500";
                reliability = "中立";
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
          }

          targetReview.textContent = reliability;
          targetReview.style.backgroundColor = color;
        } else {
          reviewIndex = currentReviewsCount;
          waitAddDivs = setTimeout(showReliability, 500, targetDiv);
        }

        if (reviewIndex == currentReviewsCount - 1) {
          oldReviewsCount = 0;
          currentReviewsCount = 0;
          reliabilityArr = [];
          reviewsArr = [];
        }
      }
    } else {
      console.log("預測結果與評論長度不同");
      // modelPredict(targetDiv);
    }
  } else {
    waitAddDivs = setTimeout(showReliability, 500, targetDiv);
  }
}
