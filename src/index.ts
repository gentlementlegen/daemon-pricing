import { createActionsPlugin } from "npm:@ubiquity-os/plugin-sdk";
import { LOG_LEVEL, LogLevel } from "npm:@ubiquity-os/ubiquity-os-logger";
import { run } from "./run.ts";
import { SupportedEvents } from "./types/context.ts";
import { Env, envSchema } from "./types/env.ts";
import { AssistivePricingSettings, pluginSettingsSchema } from "./types/plugin-input.ts";

// entry
createActionsPlugin<AssistivePricingSettings, Env, null, SupportedEvents>(
  (context) => {
    return run(context);
  },
  {
    envSchema: envSchema,
    postCommentOnError: true,
    settingsSchema: pluginSettingsSchema,
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LOG_LEVEL.INFO,
    kernelPublicKey: process.env.KERNEL_PUBLIC_KEY,
    bypassSignatureVerification: process.env.NODE_ENV === "local",
  }
).catch(console.error);
