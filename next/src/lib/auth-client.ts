import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  plugins: [
    sentinelClient(),
    adminClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
