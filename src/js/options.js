import { getLarkConfig, setLarkConfig, isDev } from "./store";

function main() {
  if (isDev) {
    document.getElementById("dev-inject").style.display = "block";
  }

  const errMsgDom = document.getElementById("error");
  const successMsgDom = document.getElementById("success");
  const loadingDom = document.getElementById("loading");
  const form = document.getElementById("form");
  let formData = new FormData();
  document
    .getElementById("button")
    .addEventListener("click", async function () {
      formData = new FormData(form);
      loadingDom.style.display = "block";
      errMsgDom.style.display = "none";
      // 获取用户输入的内容
      const app = formData.get("app");
      const domain = formData.get("domain");
      const data = { app, domain };
      if (!data.app) {
        return toggleError("Lark app name is required");
      }
      if (!data.domain) {
        return toggleError("Gitlab domain is required");
      }
      toggleError();
      await setLarkConfig(data);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      successMsgDom.style.display = "block";
      loadingDom.style.display = "none";
    });
  function toggleError(msg) {
    if (msg) {
      errMsgDom.innerText = msg;
      errMsgDom.style.display = "block";
      loadingDom.style.display = "none";
      successMsgDom.style.display = "none";
    } else {
      errMsgDom.style.display = "none";
    }
  }
  getLarkConfig().then((config) => {
    updateFormData(config);
  });

  function updateFormData(data) {
    if (!data) return;
    Object.keys(data).forEach((key) => {
      const target = form.querySelector(`[name="${key}"]`);
      if (target) {
        target.value = data[key];
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", main);
