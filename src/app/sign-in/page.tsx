import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { SignInForm } from "@/ui/auth/SignInForm";

export default function SignInPage() {
  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={420}>
        <Stack>
          <div>
            <Title order={2}>Parlo</Title>
            <Text c="dimmed">
              Say it like a local, in Spanish, English and French.
            </Text>
          </div>
          <SignInForm
            showPasswordForm={process.env.NODE_ENV !== "production"}
          />
        </Stack>
      </Paper>
    </Center>
  );
}
