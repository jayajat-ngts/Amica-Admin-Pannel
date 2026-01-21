import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/users/UsersTable";

export default function Users() {
  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Users Overview"
        description="Monitor registered users, activity, and engagement across Wizplay."
      />
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="User List">
          <UsersTable />
        </ComponentCard>
      </div>
    </>
  );
}
