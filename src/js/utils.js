import { getLarkConfig } from "./store";

export const LARK_DOMAIN_HOST = "https://project.feishu.cn";

// 检查是否满足条件
export async function checkCondition() {
  const config = await getLarkConfig();
  if (!config) return;
  const domains = config.domain.split(",");
  if (domains.length === 0) return false;
  return domains.some((domain) => {
    return window.location.host.includes(domain);
  })
    ? true
    : false;
}
