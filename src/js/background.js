chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // 打开选项页
    chrome.runtime.openOptionsPage();
  }
});
