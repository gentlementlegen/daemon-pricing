import { createAppAuth } from "https://esm.sh/@octokit/auth-app?dts";
import { Octokit } from "https://esm.sh/@octokit/rest?dts";
import { createPlugin } from "npm:@ubiquity-os/plugin-sdk@^3.0.0";
import { Manifest } from "npm:@ubiquity-os/plugin-sdk@^3.0.0/manifest";
import { customOctokit } from "npm:@ubiquity-os/plugin-sdk@^3.0.0/octokit";
import { LOG_LEVEL, LogLevel } from "npm:@ubiquity-os/ubiquity-os-logger@^1.4.0";
import type { ExecutionContext } from "npm:hono@^4.6.7";
import manifest from "../manifest.json" with { type: "json" };
import { isLocalEnvironment, run } from "./run.ts";
import { Context, SupportedEvents } from "./types/context.ts";
import { Env, envSchema } from "./types/env.ts";
import { AssistivePricingSettings, pluginSettingsSchema } from "./types/plugin-input.ts";

async function startAction(context: Context, inputs: Record<string, unknown>) {
  const { payload, logger, env } = context;

  if (!payload.repository.owner) {
    throw logger.fatal("Owner is missing from payload", { payload });
  }

  // Use Deno.env.get() for environment variables
  const actionRef = Deno.env.get("ACTION_REF");
  if (!actionRef) {
    throw logger.fatal("ACTION_REF is missing from the environment");
  }

  const regex = /^([\w-]+)\/([\w.-]+)@([\w./-]+)$/;

  // Use the variable fetched with Deno.env.get()
  const match = RegExp(regex).exec(actionRef);

  if (!match) {
    throw logger.fatal("The ACTION_REF is not in the proper format (owner/repo@ref)");
  }

  const [, owner, repo, ref] = match;

  logger.info(`Will try to dispatch a workflow at ${owner}/${repo}@${ref}`);

  const appOctokit = new customOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: context.env.APP_ID,
      privateKey: context.env.APP_PRIVATE_KEY,
    },
  });

  let authOctokit;
  // Use Deno.env.get()
  if (!Deno.env.get("APP_ID") || !Deno.env.get("APP_PRIVATE_KEY")) {
    logger.debug("APP_ID or APP_PRIVATE_KEY are missing from the env, will use the default Octokit instance.");
    authOctokit = context.octokit;
  } else {
    const installation = await appOctokit.rest.apps.getRepoInstallation({
      owner,
      repo,
    });
    authOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: context.env.APP_ID,
        privateKey: context.env.APP_PRIVATE_KEY,
        installationId: installation.data.id,
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
        switch (context.eventName) {
          case "issues.opened":
          case "repository.created":
          case "push": {
            if (isLocalEnvironment()) {
              return run(context);
            } else {
              const text = (await responseClone.json()) as Record<string, unknown>;
              return startAction(context, text);
            }
          }
          case "issues.labeled":
          case "issues.unlabeled": {
            return run(context);
          }
          default: {
            return run(context);
          }
        }
      },
      manifest as Manifest,
      {
        envSchema: envSchema,
        postCommentOnError: true,
        settingsSchema: pluginSettingsSchema,
        logLevel: (Deno.env.get("LOG_LEVEL") as LogLevel) || LOG_LEVEL.INFO,
        kernelPublicKey: Deno.env.get("KERNEL_PUBLIC_KEY"),
        bypassSignatureVerification: Deno.env.get("NODE_ENV") === "local",
      }
    ).fetch(request, env, executionCtx);
  },
};
