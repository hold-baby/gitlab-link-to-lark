import { MSG_EVENT } from "./event";
import { LARK_DOMAIN_HOST } from "./utils";

main();

async function main() {
  chrome.runtime.onMessage.addListener(function (e, sender, sendResponse) {
    const { message, data } = e;
    const tabId = sender.tab.id;
    switch (message) {
      case MSG_EVENT.INIT:
        chrome.tabs.sendMessage(tabId, {
          message: MSG_EVENT.INIT,
          data: {
            msg: "init",
          },
        });
        break;
      case MSG_EVENT.GET_LARK_PROJECT_INFO:
        getLarkProjectInfo(data).then((resData) => {
          if (!resData) return;
          chrome.tabs.sendMessage(tabId, {
            message: MSG_EVENT.GET_LARK_PROJECT_INFO,
            data: resData,
          });
        });
        break;
    }
  });
}

const extractScriptContent = (text) => {
  // 使用正则表达式匹配 script 标签内的内容
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/;
  const match = text.match(scriptRegex);

  if (match && match[1]) {
    // 返回标签内的内容
    return match[1].trim();
  }

  return ""; // 如果没有找到匹配，返回空字符串
};

const getLarkProjectInfoByDetail = (text) => {
  const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const scripts = text.match(reg);
  let content = "";
  for (let i = 0; i < scripts.length; i++) {
    const text = scripts[i];
    const isContain =
      text.includes("window.detail") &&
      text.includes(`/work_item/${type}/${id}`);

    if (isContain) {
      content = text;
      break;
    }
  }
  if (!content)
    return {
      error: true,
      data: null,
    };
  content = content.replace(/\n/g, "");
  content = content.replace(new RegExp("\\\\x3C", "g"), "<");
  content = content.replace(new RegExp("\x3C", "g"), "<");
  content = content.replace(new RegExp("\\x3C", "g"), "<");
  content = content.split("};\x3C/script>")[0];
  content = content.replace("<script>", "");
  content = content.replace("}</script>", "");
  content = content.replace("window.detail = {", "");
  content = content.replace("...window.detail,", "");
  content = content.replace("...{", "{");
  content = content.replace("};", "}");
  content = content.replace(/\\'/g, "'");
  const obj = JSON.parse(content);
  let data = null;
  const key = Object.keys(obj)[0];
  data = obj[key].data;
  return {
    error: false,
    data,
  };
};

const getLarkProjectInfoByPrefetchList = (text) => {
  const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const scripts = text.match(reg);
  let content = "";
  for (let i = 0; i < scripts.length; i++) {
    const text = scripts[i];
    const isContain =
      text.includes('...{"APIDemandFetchWorkItem":') &&
      text.includes(`window.prefetch_list`);

    if (isContain) {
      content = text;
      break;
    }
  }
  if (!content)
    return {
      error: true,
      data: null,
    };
  content = content.replace(/\n/g, "");
  content = content.replace(new RegExp("\\\\x3C", "g"), "<");
  content = content.replace(new RegExp("\x3C", "g"), "<");
  content = content.replace(new RegExp("\\x3C", "g"), "<");
  const noScriptContent = extractScriptContent(content);
  if (noScriptContent) {
    content = noScriptContent;
  }
  content = content.replace("window.prefetch_list = {", "");
  content = content.replace("...window.prefetch_list,", "");
  content = content.replace("...{", "{");
  content = content.replace("} };", "}");
  content = content.replace(/\\'/g, "'");
  const obj = JSON.parse(content);
  const biz_data = obj.APIDemandFetchWorkItem.data.data.biz_data;
  const target = biz_data.find((item) => item.key === "workitem");
  if (!target) {
    return {
      error: true,
      data: null,
    };
  }
  return {
    error: false,
    data: {
      data: target.value,
    },
  };
};

async function getLarkProjectInfo({ tid, app }) {
  const [t, id] = tid.split("-");
  const type = t === "m" ? "story" : "issue";
  let url = `${LARK_DOMAIN_HOST}/${app}/${type}/detail/${id}`;
  const res = await fetch(url);
  const text = await res.text();
  let info = { tid };
  const detailInfo = getLarkProjectInfoByDetail(text);
  if (detailInfo.data) {
    info = {
      ...info,
      ...detailInfo.data,
    };
  } else {
    const prefetchListInfo = getLarkProjectInfoByPrefetchList(text);
    info = {
      ...info,
      ...prefetchListInfo.data,
    };
  }
  return info;
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // 打开选项页
    chrome.runtime.openOptionsPage();
  }
});
