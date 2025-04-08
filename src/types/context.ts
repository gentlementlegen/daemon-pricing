import { Context as PluginContext } from "npm:@ubiquity-os/plugin-sdk@^3.0.0"; // Add npm: and version specifier
import { Env } from "./env.ts"; // Add .ts extension
import { AssistivePricingSettings } from "./plugin-input.ts"; // Add .ts extension

export type SupportedEvents =
  | "repository.created"
  | "issues.labeled"
  | "issues.unlabeled"
  | "issues.opened"
  | "label.edited"
  | "issue_comment.created"
  | "push";

export type Context<T extends SupportedEvents = SupportedEvents> = PluginContext<AssistivePricingSettings, Env, null, T>;
