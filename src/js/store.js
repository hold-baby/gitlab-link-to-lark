// 配置存储 key
const GITLAB_LINK_TO_LARK = "GITLAB_LINK_TO_LARK";

// 缓存配置
let _GITLAB_LINK_TO_LARK_OPTIONS = null;

export const isDev = process.env.isDev === "1";

// 获取配置
export const getLarkConfig = async () => {
  if (_GITLAB_LINK_TO_LARK_OPTIONS) return _GITLAB_LINK_TO_LARK_OPTIONS;

  if (isDev) {
    _GITLAB_LINK_TO_LARK_OPTIONS = {
      app: process.env.app,
      domain: process.env.domain,
    };
    return _GITLAB_LINK_TO_LARK_OPTIONS;
  }

  const resp = await chrome.storage.sync.get(GITLAB_LINK_TO_LARK);
  if (resp && resp[GITLAB_LINK_TO_LARK]) {
    _GITLAB_LINK_TO_LARK_OPTIONS = JSON.parse(resp[GITLAB_LINK_TO_LARK]);
  }
  return _GITLAB_LINK_TO_LARK_OPTIONS;
};

// 设置配置
export const setLarkConfig = async (value) => {
  const dataString = JSON.stringify(value);
  if (isDev) return;
  await chrome.storage.sync.set({ [GITLAB_LINK_TO_LARK]: dataString });
};
