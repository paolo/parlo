import { notifications } from "@mantine/notifications";
import { authClient } from "@/ui/auth-client";

/** Signs the user out and reloads the home page, so no signed-in client state is reused. */
export async function signOut() {
  try {
    // better-auth reports a refusal (a rejected origin, say) as `error`, it does not throw.
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message);
  } catch {
    notifications.show({
      color: "red",
      title: "Couldn't sign out",
      message: "Please try again.",
    });
    return;
  }
  // A full page load, so the proxy shows the landing page.
  window.location.assign("/");
}
