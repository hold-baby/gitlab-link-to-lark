import { getLarkConfig } from "./store";

main();

async function main() {
  if (!checkCondition()) return;
  const POPOVER_STYLE_ID = "lark-popover-link-style";
  let dom_lark_popover = null;

  const LARK_DOMAIN_HOST = "https://project.feishu.cn";

  let LarkConfig = null;
  const nodeMap = new Map();

  initPopover();
  initPageListener();

  // 检查是否满足条件
  async function checkCondition() {
    const config = await getLarkConfig();
    if (!config) return;
    LarkConfig = config;
    const domains = config.domain.split(",");
    if (domains.length === 0) return false;
    return domains.some((domain) => {
      return window.location.host.includes(domain);
    })
      ? true
      : false;
  }

  // 初始化 popover 节点
  function initPopover() {
    if (document.getElementById(POPOVER_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = POPOVER_STYLE_ID;
    style.innerHTML = `
    .lark-project-link {
      padding: 0 2px;
      text-decoration: none;
      position: relative;
      transition: all .2s;
    }
    .lark-project-link:hover {
      text-decoration: none;
      background-color: #a1d1fc;
    }
    .lark-popover {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      background-color: #000;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .lark-popover-show {
      display: block;
    }
    .lark-popover-hide {
      display: none;
    }
  `;
    document.head.appendChild(style);
    const div = document.createElement("div");
    div.classList.add("lark-popover");
    document.body.appendChild(div);
    dom_lark_popover = div;
  }

  // 初始化页面节点监听
  async function initPageListener() {
    const config = await getLarkConfig();
    if (!config) return;
    const dom_content_wrapper = document.querySelector(".content-wrapper");

    const ro = new ResizeObserver(function () {
      const dom_commits_list = document.getElementById("commits-list");
      if (dom_commits_list) {
        replaceCommitList();
      }

      const dom_tree_holder = document.getElementById("tree-holder");
      if (dom_tree_holder) {
        const dom_project_last_commit = dom_tree_holder.querySelector(
          ".project-last-commit"
        );
        const ro = new ResizeObserver(replaceTreeHolderProjectLastCommit);
        ro.observe(dom_project_last_commit.firstChild);
      }

      const dom_content_body = document.getElementById("content-body");
      if (dom_content_body) {
        const ro = new ResizeObserver(replaceContentBodyCommitList);
        ro.observe(dom_content_body);
      }

      replaceMergeRequestTitle();
    });

    if (dom_content_wrapper) {
      ro.observe(dom_content_wrapper);
    }
  }

  // 鼠标移入事件
  function enterHandler(e) {
    const rect = e.target.getBoundingClientRect();
    dom_lark_popover.classList.remove("lark-popover-hide");
    dom_lark_popover.classList.add("lark-popover-show");
    dom_lark_popover.style.setProperty("top", `${rect.y}px`);
    dom_lark_popover.style.setProperty("left", `${rect.x - 8}px`);
    dom_lark_popover.style.setProperty("transform", `translate(0%, -102%)`);
    dom_lark_popover.innerHTML = "Lark Link";
  }

  // 鼠标移出事件
  function leaveHandler() {
    dom_lark_popover.classList.remove("lark-popover-show");
  }

  // 绑定 popover 事件
  function bindPopoverEvent(dom) {
    dom.addEventListener("mouseenter", enterHandler);
    dom.addEventListener("mouseleave", leaveHandler);
  }

  // 获取 Lark 项目链接
  function getLarkProjectLink(projectId, type = "m") {
    if (type === "f")
      return `${LARK_DOMAIN_HOST}/${LarkConfig.app}/issue/detail/${projectId}`;
    return `${LARK_DOMAIN_HOST}/${LarkConfig.app}/story/detail/${projectId}`;
  }

  // 替换项目 ID 为 Lark 项目链接
  function replaceProjectIdToLarkProjectLink(dom, className) {
    const reg = /(m|f)-\d+/g;
    let isFind = false;
    const content = dom.innerHTML.replace(reg, ($1) => {
      const projectId = $1.split("-")[1];
      const type = $1.split("-")[0];
      isFind = true;
      return `<a class='lark-project-link ${
        className ? className : ""
      }' href='${getLarkProjectLink(
        projectId,
        type
      )}' target='_blank' data-project-id="${projectId}" >${$1}</a>`;
    });
    return [isFind, content];
  }

  // 替换 commit message 中的项目 ID 为 Lark 项目链接
  function replaceCommitList() {
    const dom_commits_rows = document.getElementsByClassName("commits-row");

    Array.from(dom_commits_rows).forEach((item) => {
      const dom_commit_list = item.getElementsByClassName("commit-list")[0];
      const dom_commit_list_item =
        dom_commit_list.getElementsByClassName("commit");
      Array.from(dom_commit_list_item).forEach((row) => {
        const dom_commit_row_message =
          row.getElementsByClassName("commit-row-message")[0];
        if (nodeMap.has(dom_commit_row_message)) return;
        const result = replaceProjectIdToLarkProjectLink(
          dom_commit_row_message
        );
        if (result[0]) {
          nodeMap.set(dom_commit_row_message, true);
          dom_commit_row_message.innerHTML = result[1];
          const link =
            dom_commit_row_message.querySelector(".lark-project-link");
          bindPopoverEvent(link);
        }
      });
    });
  }

  // 替换项目 ID 为 Lark 项目链接
  function replaceTreeHolderProjectLastCommit() {
    const dom_tree_holder = document.getElementById("tree-holder");
    const dom_project_last_commit = dom_tree_holder.querySelector(
      ".project-last-commit"
    );
    const dom_commit_row_message = dom_project_last_commit.querySelector(
      ".commit-row-message"
    );
    if (nodeMap.has(dom_commit_row_message) || !dom_commit_row_message) return;
    const result = replaceProjectIdToLarkProjectLink(dom_commit_row_message);
    if (result[0]) {
      nodeMap.set(dom_commit_row_message, true);
      dom_commit_row_message.innerHTML = result[1];
      const link = dom_commit_row_message.querySelector(".lark-project-link");
      bindPopoverEvent(link);
    }
  }

  // 替换内容区域的 commit list
  function replaceContentBodyCommitList() {
    const rows = document.getElementsByClassName("merge-request-title-text");
    Array.from(rows).forEach((item) => {
      const dom_a = item.querySelector("a");
      if (nodeMap.has(dom_a)) return;
      const result = replaceProjectIdToLarkProjectLink(dom_a);
      if (result[0]) {
        nodeMap.set(dom_a, true);
        dom_a.innerHTML = result[1];
        const link = dom_a.querySelector(".lark-project-link");
        bindPopoverEvent(link);
      }
    });
  }

  // 替换 merge request title
  function replaceMergeRequestTitle() {
    const dom_merge_request_details = document.querySelector(
      ".merge-request-details"
    );
    if (!dom_merge_request_details) return;
    const dom_merge_request_title =
      dom_merge_request_details.querySelector(".title");
    if (!dom_merge_request_title) return;
    if (nodeMap.has(dom_merge_request_title)) return;
    const result = replaceProjectIdToLarkProjectLink(dom_merge_request_title);
    if (result[0]) {
      nodeMap.set(dom_merge_request_title, true);
      dom_merge_request_title.innerHTML = result[1];
      const link = dom_merge_request_title.querySelector(".lark-project-link");
      bindPopoverEvent(link);
    }
  }
}
