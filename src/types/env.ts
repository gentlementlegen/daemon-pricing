import { StaticDecode, Type as T } from "npm:@sinclair/typebox@0.34.3"; // Add npm: and version specifier
import { LOG_LEVEL } from "npm:@ubiquity-os/ubiquity-os-logger@^1.4.0"; // Add npm: and version specifier

export const envSchema = T.Object({
  LOG_LEVEL: T.Optional(T.Enum(LOG_LEVEL)),
  KERNEL_PUBLIC_KEY: T.Optional(T.String()),
  ACTION_REF: T.Optional(T.String()),
  APP_ID: T.Optional(T.String()),
  APP_PRIVATE_KEY: T.Optional(T.String()),
  APP_INSTALLATION_ID: T.Optional(T.String()),
});

export type Env = StaticDecode<typeof envSchema>;
