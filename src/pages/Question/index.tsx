import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import PageMeta from "../../components/common/PageMeta.tsx";
import { useParams } from "react-router";
import QuestionTable from "../../components/questions/QuestionTable.tsx";

export default function Questions() {
  const params = useParams<{ id: string }>();
  const contestId = params.id;
  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Questions Overview"
        description="Manage all questions, view active and completed questions, and monitor participation trends."
      />
      <PageBreadcrumb pageTitle="Questions" />
      <div className="space-y-6">
        <ComponentCard title="Questions List">
          <QuestionTable contestId={contestId} />
        </ComponentCard>
      </div>
    </>
  );
}
