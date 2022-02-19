let getReviews = document.getElementById("getReviews");

getReviews.addEventListener("click", async () => {
  await chrome.tabs.query(
    { active: true, currentWindow: true },
    function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { greeting: "hello" });
    }
  );
});
