import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Wizplay | Sign In to Your Sports Gaming Dashboard"
        description="Login to Wizplay and access your personalized fantasy sports contests, rewards, and live updates. Play, compete, and win on India's trusted sports gaming platform."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
