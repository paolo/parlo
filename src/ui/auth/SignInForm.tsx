"use client";

import {
  Alert,
  Button,
  Divider,
  Group,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/ui/auth-client";
import { GoogleSignInButton } from "./GoogleSignInButton";

type Mode = "sign-in" | "sign-up";

export function SignInForm({
  showPasswordForm,
}: {
  showPasswordForm: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Mode | null>(null);

  async function submit(mode: Mode) {
    setError(null);
    setPending(mode);
    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: email.split("@")[0],
          });
    setPending(null);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      return;
    }
    router.push("/");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit("sign-in");
  }

  return (
    <Stack>
      <GoogleSignInButton />

      {showPasswordForm && (
        <form onSubmit={onSubmit}>
          <Stack>
            <Divider label="or, in development only" labelPosition="center" />
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}
            <TextInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Group grow>
              <Button
                type="submit"
                loading={pending === "sign-in"}
                disabled={pending !== null}
              >
                Sign in
              </Button>
              <Button
                variant="default"
                loading={pending === "sign-up"}
                disabled={pending !== null}
                onClick={() => void submit("sign-up")}
              >
                Create account
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Stack>
  );
}
