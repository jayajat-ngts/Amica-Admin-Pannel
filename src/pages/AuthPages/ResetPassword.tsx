import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function ResetPassword() {
  return (
    <>
    <PageMeta
        title="Wizplay | Create a New Password"
        description="Securely reset your Wizplay account password to continue playing fantasy sports, joining contests, and tracking your rewards."
      />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
