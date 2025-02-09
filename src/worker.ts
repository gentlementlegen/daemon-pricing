import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { createPlugin } from "@ubiquity-os/plugin-sdk";
import { Manifest } from "@ubiquity-os/plugin-sdk/manifest";
import { LogLevel } from "@ubiquity-os/ubiquity-os-logger";
import type { ExecutionContext } from "hono";
import manifest from "../manifest.json";
import { run } from "./run";
import { Context, SupportedEvents } from "./types/context";
import { Env, envSchema } from "./types/env";
import { AssistivePricingSettings, pluginSettingsSchema } from "./types/plugin-input";

async function startAction(context: Context, inputs: Record<string, unknown>) {
  const { payload, logger, env } = context;

  if (!payload.repository.owner) {
    throw logger.fatal("Owner is missing from payload", { payload });
  }

  if (!env.ACTION_REF) {
    throw logger.fatal("ACTION_REF is missing from the environment");
  }

  const regex = /^([\w-]+)\/([\w.-]+)@([\w./-]+)$/;

  const match = RegExp(regex).exec(env.ACTION_REF);

  if (!match) {
    throw logger.fatal("The ACTION_REF is not in the proper format (owner/repo@ref)");
  }

  const [, owner, repo, ref] = match;

  logger.info(`Will try to dispatch a workflow at ${owner}/${repo}@${ref}`);

  let authOctokit;
  if (!env.APP_ID || !env.APP_INSTALLATION_ID || !env.APP_PRIVATE_KEY) {
    logger.debug("APP_ID, APP_INSTALLATION_ID or APP_PRIVATE_KEY are missing from the env, will use the default Octokit instance.");
    authOctokit = context.octokit;
  } else {
    authOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: context.env.APP_ID,
        privateKey: context.env.APP_PRIVATE_KEY,
        installationId: context.env.APP_INSTALLATION_ID,
      },
    });
  }
  await authOctokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    inputs,
    ref,
    workflow_id: "compute.yml",
  });
}

export default {
  async fetch(request: Request, env: Record<string, string>, executionCtx?: ExecutionContext) {
    // It is important to clone the request because the body is read within createPlugin as well
    const responseClone = request.clone();

    return createPlugin<AssistivePricingSettings, Env, null, SupportedEvents>(
      async (context) => {
        if (context.eventName === "push") {
          const text = (await responseClone.json()) as Record<string, unknown>;
          return startAction(context, text);
        }
        return run(context);
      },
      manifest as Manifest,
      {
        envSchema: envSchema,
        postCommentOnError: true,
        settingsSchema: pluginSettingsSchema,
        logLevel: (env.LOG_LEVEL as LogLevel) ?? "info",
        kernelPublicKey: env.KERNEL_PUBLIC_KEY,
        bypassSignatureVerification: env.NODE_ENV === "local",
      }
    ).fetch(request, env, executionCtx);
  },
};
