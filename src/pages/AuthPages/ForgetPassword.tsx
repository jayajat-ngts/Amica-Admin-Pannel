import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgetPasswordForm from "../../components/auth/ForgetPasswordForm";

export default function ForgetPassword() {
  return (
    <>
 <PageMeta
        title="Wizplay | Reset Your Password"
        description="Forgot your password? Reset it easily and securely to continue playing fantasy sports, joining contests, and tracking your rewards on Wizplay."
      />
      <AuthLayout>
        <ForgetPasswordForm />
      </AuthLayout>
    </>
  );
}
