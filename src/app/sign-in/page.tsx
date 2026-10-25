import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { SignInForm } from "@/ui/auth/SignInForm";
import { Wordmark } from "@/ui/Wordmark";

export default function SignInPage() {
  return (
    <Center mih="100vh" p="md">
      <Paper withBorder radius="lg" p="xl" w="100%" maw={420}>
        <Stack>
          <div>
            <Title order={1}>
              <Wordmark size={40} />
            </Title>
            <Text c="dimmed">Say it like a local, in your own languages.</Text>
          </div>
          <SignInForm
            showPasswordForm={process.env.NODE_ENV !== "production"}
          />
        </Stack>
      </Paper>
    </Center>
  );
}
