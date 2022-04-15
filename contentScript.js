let errorFlag = false;

let reviewsPosition = -1;
let reviewsAPIsArr = [];
let oldStoreName = "";
let newsReviewsAPI = "";
let lastCurrentReviewsCount = 0;
let currentReviewsCount = 0;

let reviewsDivFlag = false;
let targetDiv = undefined;
let color = "#c7c7cc";
let reliability = "評估中...";

let starMean = 0;
let allReviewsCount = 0;
let monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let reviewsAPI = "";
let currentReviewsPosition = -1;
let reviewsArr = [];
let reliabilityArr = [];

let callReciewsDivFlag = false;
// -------------------------------------------------------------
let waitReviewsDiv;
let waitReviewDivs;
let waitMonthRateArr;
let waitAddDivs;

// 監聽評論API
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  reviewsPosition = parseInt(
    message.reviewsAPI.substring(
      message.reviewsAPI.indexOf("!2m2!") +
        message.reviewsAPI
          .slice(message.reviewsAPI.indexOf("!2m2!") + 4)
          .indexOf("!") +
        7,
      message.reviewsAPI.indexOf("!2m2!") +
        message.reviewsAPI
          .slice(message.reviewsAPI.indexOf("!2m2!") + 5)
          .indexOf("!") +
        5
    )
  );

  if (reviewsPosition == 0) {
    clearTimeout(waitReviewsDiv);
    clearTimeout(waitReviewDivs);
    clearTimeout(waitMonthRateArr);
    clearTimeout(waitAddDivs);

    reviewsAPIsArr = [];
    reviewsAPIsArr.push(message.reviewsAPI);
    if (oldStoreName != message.storeName) {
      // console.log("oldStoreName: " + oldStoreName);
      // console.log("storeName: " + message.storeName);
      oldStoreName = message.storeName;
      sendResponse({ farewell: "goodbye" });

      newsReviewsAPI =
        reviewsAPIsArr[0].substring(
          0,
          reviewsAPIsArr[0].indexOf("!2m2!") +
            reviewsAPIsArr[0]
              .slice(reviewsAPIsArr[0].indexOf("!2m2!") + 4)
              .indexOf("!") +
            16
        ) +
        "2" +
        reviewsAPIsArr[0].substring(
          reviewsAPIsArr[0].indexOf("!2m2!") +
            reviewsAPIsArr[0]
              .slice(reviewsAPIsArr[0].indexOf("!2m2!") + 5)
              .indexOf("!") +
            14,
          reviewsAPIsArr[0].length
        );

      lastCurrentReviewsCount = 0;
      currentReviewsCount = 0;

      // console.log("newsReviewsAPI: " + newsReviewsAPI);
    } else {
      sendResponse({ farewell: "goodbye" });
    }
  } else {
    reviewsAPIsArr.push(message.reviewsAPI);
    sendResponse({ farewell: "goodbye" });
  }

  console.log(reviewsAPIsArr);

  reviewsDivShow();
  // if (reviewsAPIsArr.length == 1) {
  //   getReviewsArr();
  // }
});

// ---------------------------------------------------------------------------------label顯示

// 等待評論顯示
function reviewsDivShow() {
  clearTimeout(waitReviewsDiv);
  // 初始化-------------------------------
  reviewsDivFlag = false;
  targetDiv = undefined;
  color = "#c7c7cc";
  reliability = "評估中...";
  // 初始化-------------------------------

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
    targetDiv =
      document.getElementsByClassName("section-scrollbox")[0].children[
        document.getElementsByClassName("section-scrollbox")[0].children
          .length - 2
      ];

    if (
      targetDiv.children.length > 1 &&
      targetDiv.children[0].getAttribute("data-review-id")
    ) {
      // currentReviewsCount = (targetDiv.children.length + 1) / 3;
      addReviewsLabel();

      if (newsReviewsAPI != "") {
        // createReviewsObserver();
        getMonthRate();
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

// 新增評論標籤
function addReviewsLabel() {
  clearTimeout(waitReviewDivs);

  if (targetDiv && targetDiv.children) {
    currentReviewsCount = (targetDiv.children.length + 1) / 3;

    if (lastCurrentReviewsCount % 10 > 0) {
      lastCurrentReviewsCount = 0;
    } else if (currentReviewsCount <= lastCurrentReviewsCount) {
      if (currentReviewsCount % 10 > 0) {
        lastCurrentReviewsCount = parseInt(currentReviewsCount / 10) * 10;
      } else {
        lastCurrentReviewsCount = currentReviewsCount - 10;
      }
    }

    console.log("lastCurrentReviewsCount: " + lastCurrentReviewsCount);
    console.log("currentReviewsCount: " + currentReviewsCount);

    if (Number.isInteger(currentReviewsCount)) {
      for (
        reviewIndex = lastCurrentReviewsCount;
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
            document
              .getElementById("add-div-" + reviewIndex.toString())
              .remove();
            console.log("removeDiv");
          }
          reviewDiv.appendChild(innerDiv);
        } else {
          reviewIndex = currentReviewsCount;
          waitReviewDivs = setTimeout(addReviewsLabel, 500);
        }

        if (
          reviewIndex == currentReviewsCount - 1 &&
          document.getElementById("add-div-" + reviewIndex.toString())
        ) {
          lastCurrentReviewsCount = currentReviewsCount;
          reviewsDivFlag = true;
          targetDiv = undefined;
          if (!callReciewsDivFlag && reviewsAPIsArr.length == 1) {
            getReviewsArr();
          }

          callReciewsDivFlag = false;
        }
      }
    } else {
      waitReviewDivs = setTimeout(addReviewsLabel, 500);
    }
  } else {
    waitReviewDivs = setTimeout(addReviewsLabel, 500);
  }
}

// ---------------------------------------------------------------------------------取得近一年的時間密度

// 取得最新的評論時間
function getMonthRate() {
  // 初始化-------------------------------
  starMean = 0;
  allReviewsCount = 0;
  monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // 初始化-------------------------------

  let reviewsDecimal = 0;
  let APIReturnCount = 0;
  let timeCount = 0;

  starMean = parseFloat(
    document.getElementsByClassName("jANrlb")[0].children[0].innerHTML
  );
  allReviewsCount = parseInt(
    document
      .getElementsByClassName("jANrlb")[0]
      .children[3].innerHTML.slice(0, -4)
      .replace(/,/g, "")
  );
  console.log(
    "starMean: " + starMean + ", allReviewsCount: " + allReviewsCount
  );

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

    fetch(otherNewsReviewsAPI + "&extension")
      .then(function (response) {
        chrome.runtime.sendMessage({ type: "getReviewsAPI" });
        return response.text();
      })
      .catch((error) => {
        clearInterval(newsgeting);
        errorFlag = true;

        console.log("newsget error");
        console.error("error: " + error);

        starMean = 0;
        allReviewsCount = 0;
        monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // getMonthRate();
      })
      .then(function (requests_result) {
        if (!errorFlag) {
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
            newsReviewsAPI = "";

            reviewsDecimal = 0;
            APIReturnCount = 0;

            for (i = 0; i < monthRateArr.length; i++) {
              monthRateArr[i] = (monthRateArr[i] / timeCount).toFixed(2);
            }
            console.log(monthRateArr); // 前2000筆的評論時

            timeCount = 0;
          } else {
            APIReturnCount++;
          }
        }
      });
  }
}

// // 監聽評論Div的變化
// function createReviewsObserver() {
//   const targetNode =
//     document.getElementsByClassName("section-scrollbox")[0].children[
//       document.getElementsByClassName("section-scrollbox")[0].children.length -
//         2
//     ];

//   const config = { childList: true };

//   // Callback function to execute when mutations are observed
//   const callback = function (mutationsList, observer) {
//     // Use traditional 'for loops' for IE 11
//     for (const mutation of mutationsList) {
//       if (
//         mutation.type === "childList" &&
//         mutation.target.children.length != currentReviewsCount * 3 - 1
//       ) {
//         // 初始化-------------------------------
//         color = "#c7c7cc";
//         reliability = "評估中...";
//         // 初始化-------------------------------
//         currentReviewsCount = (mutation.target.children.length + 1) / 3;
//         addReviewsLabel();
//       }
//     }
//   };

//   // Create an observer instance linked to the callback function
//   const observer = new MutationObserver(callback);

//   // Start observing the target node for configured mutations
//   observer.observe(targetNode, config);

//   // Later, you can stop observing
//   // observer.disconnect();
// }

// ---------------------------------------------------------------------------------predict顯示

// 取得評論內容
function getReviewsArr() {
  // 初始化-------------------------------
  currentReviewsPosition = -1;
  reviewsAPI = "";
  reviewsArr = [];
  reliabilityArr = [];
  // 初始化-------------------------------

  reviewsAPI = reviewsAPIsArr[0];

  currentReviewsPosition = parseInt(
    reviewsAPI.substring(
      reviewsAPI.indexOf("!2m2!") +
        reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 4).indexOf("!") +
        7,
      reviewsAPI.indexOf("!2m2!") +
        reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 5).indexOf("!") +
        5
    )
  );

  console.log("reviewsAPI: " + reviewsAPI);
  console.log("currentReviewsPosition: " + currentReviewsPosition);
  console.log(reviewsAPIsArr);

  if (!(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)) {
    console.log("currentgeting...");
    const currentgeting = setInterval(
      () => console.log("currentgeting..."),
      1000
    );

    fetch(reviewsAPI + "&extension")
      .then(function (response) {
        chrome.runtime.sendMessage({ type: "getReviewsAPI" });
        return response.text();
      })
      .catch((error) => {
        clearInterval(currentgeting);
        errorFlag = true;
        showReliability();

        console.log("currentget error");
        console.error("error: " + error);

        // getReviewsArr();
      })
      .then(function (requests_result) {
        clearInterval(currentgeting);
        console.log("currentget complete");
        if (
          !(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)
        ) {
          const pretext = ")]}'";
          const text = requests_result.replace(pretext, "");
          const soup = JSON.parse(text);

          if (soup[2]) {
            getUsefulData(soup[2]);
          }
        }
      });
  }
}

function getUsefulData(oriArr) {
  clearTimeout(waitMonthRateArr);

  if (!(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)) {
    if (typeof monthRateArr[0] == "string") {
      for (j = 0; j < oriArr.length; j++) {
        reviewsArr.push(dataProcessing(oriArr[j]));

        if (reviewsArr.length == oriArr.length) {
          console.log(reviewsArr); //目前的評論內容
          modelPredict();
          reviewsAPIsArr.shift();
        }
      }
    } else if (errorFlag) {
      showReliability();
    } else {
      waitMonthRateArr = setTimeout(getUsefulData, 500, oriArr);
    }
  }
}

// 目前評論資料特徵處理
function dataProcessing(soupArr) {
  if (!(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)) {
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
        month_rate = parseFloat(
          monthRateArr[parseInt(soupArr[1].slice(0, -4))]
        );
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
  } else {
    return null;
  }
}

// 回傳模型預測可靠度
function modelPredict() {
  if (!(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)) {
    let sendModelArr = [];
    const url = "https://thesis-model-backend.herokuapp.com/predict";
    let data = {};

    for (i = 0; i < reviewsArr.length; i++) {
      if (reviewsArr[i].length == 0) {
        data = {
          index: currentReviewsPosition + i,
        };
      } else {
        data = {
          index: currentReviewsPosition + i,
          content_length: reviewsArr[i][0],
          photos_count: reviewsArr[i][1],
          content_positive: 0.33, //正向情緒
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
        showReliability();

        console.log("predict error");
        console.error("Error:", error);
      })
      .then((response) => {
        clearInterval(predicting);
        if (
          !(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)
        ) {
          console.log("predict complete");
          reliabilityArr = response;
          // for (j = 0; j < response.length; j++) {
          //   if (reliabilityArr[parseInt(response[j].index)]) {
          //     reliabilityArr[parseInt(response[j].index)] = response[j];
          //   } else {
          //     reliabilityArr.push(response[j]);
          //   }

          //   if (reliabilityArr.length > parseInt(response[j].index)) {
          //     reliabilityArr.length = parseInt(response[j].index) + 1;
          //   }
          // }
          console.log(reliabilityArr); //回傳的預測結果
          showReliability();
        }
      });
  }
}

// 顯示可靠度標籤
function showReliability() {
  clearTimeout(waitAddDivs);
  if (!(reviewsPosition == 0 && reviewsPosition != currentReviewsPosition)) {
    let startReviewsCount = 0;
    if (
      Number.isInteger(currentReviewsCount) &&
      reviewsDivFlag &&
      reliabilityArr &&
      reliabilityArr[0] &&
      reliabilityArr[0].index
    ) {
      const reviewsPosition2 = parseInt(reliabilityArr[0].index);
      if (!errorFlag) {
        console.log(reviewsPosition2);
        console.log(reliabilityArr.length);
        console.log(currentReviewsCount);
        console.log(reliabilityArr);
        if (reviewsPosition2 + reliabilityArr.length <= currentReviewsCount) {
          for (
            reviewIndex = reviewsPosition2;
            reviewIndex < reviewsPosition2 + reliabilityArr.length;
            reviewIndex++
          ) {
            if (document.getElementById("add-div-" + reviewIndex.toString())) {
              const targetReview = document.getElementById(
                "add-div-" + reviewIndex.toString()
              );

              switch (
                parseInt(reliabilityArr[reviewIndex - reviewsPosition2].predict)
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

              targetReview.textContent = reliability;
              targetReview.style.backgroundColor = color;
            } else {
              reviewIndex = reliabilityArr.length;
              // reviewsDivShow()
              waitAddDivs = setTimeout(showReliability, 500);
            }

            if (reviewIndex == reliabilityArr.length - 1) {
              // reliabilityArr = [];

              reviewsAPIsArr.shift();
              if (reviewsDivFlag && reviewsAPIsArr.length > 0) {
                getReviewsArr();
              }
            }
          }
        } else {
          console.log("div還沒更新");
          callReciewsDivFlag = true;
          reviewsDivShow();
          waitAddDivs = setTimeout(showReliability, 500);
        }
      } else {
        color = "#ff3a30";
        reliability = "評估失敗";

        for (
          reviewIndex = 0;
          reviewIndex < currentReviewsCount;
          reviewIndex++
        ) {
          if (document.getElementById("add-div-" + reviewIndex.toString())) {
            const targetReview = document.getElementById(
              "add-div-" + reviewIndex.toString()
            );

            targetReview.textContent = reliability;
            targetReview.style.backgroundColor = color;
          } else {
            reviewIndex = currentReviewsCount;
            // reviewsDivShow()
            waitAddDivs = setTimeout(showReliability, 500);
          }

          // if (reviewIndex == currentReviewsCount - 1) {
          //   reliabilityArr = [];
          // }
        }
      }
    } else {
      waitAddDivs = setTimeout(showReliability, 500);
    }
  }
}
