import { globalLabelUpdate } from "./handlers/global-config-update.ts";
import { onLabelChangeSetPricing } from "./handlers/pricing-label.ts";
import { syncPriceLabelsToConfig } from "./handlers/sync-labels-to-config.ts";
import { Context } from "./types/context.ts";
import { isIssueLabelEvent } from "./types/typeguards.ts";

export function isLocalEnvironment() {
  return Deno.env.get("NODE_ENV") === "local";
}

export function isGithubOrLocalEnvironment() {
  return isLocalEnvironment() || !!Deno.env.get("GITHUB_ACTIONS");
}

export function isWorkerOrLocalEnvironment() {
  return isLocalEnvironment() || !Deno.env.get("GITHUB_ACTIONS");
}

export async function run(context: Context) {
  const { eventName, logger } = context;

  switch (eventName) {
    case "issues.opened":
    case "repository.created":
      if (isGithubOrLocalEnvironment()) {
        await syncPriceLabelsToConfig(context);
      }
      break;
    case "issues.labeled":
    case "issues.unlabeled":
      if (isIssueLabelEvent(context) && isWorkerOrLocalEnvironment()) {
        await onLabelChangeSetPricing(context);
      }
      break;
    case "push":
      if (isGithubOrLocalEnvironment()) {
        await globalLabelUpdate(context);
      }
      break;
    default:
      logger.error(`Event ${eventName} is not supported`);
  }
  return { message: "OK" };
}
