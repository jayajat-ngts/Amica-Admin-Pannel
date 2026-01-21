import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ContestsTable from "../../components/contest/ContestsTable.tsx";
import { useParams } from "react-router";

export default function Contests() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;
  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Contests Overview"
        description="Manage all contests, view active and completed contests, and monitor participation trends."
      />
      <PageBreadcrumb pageTitle="Contest" />
      <div className="space-y-6">
        <ComponentCard title="Contest List">
          <ContestsTable matchId={matchId} />
        </ComponentCard>
      </div>
    </>
  );
}
