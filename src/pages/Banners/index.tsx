import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BannersTable from "../../components/banners/BannersTable";

export default function Banners() {
  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Banner Management"
        description="Manage promotional banners for the application."
      />
      <PageBreadcrumb pageTitle="Banners" />
      <div className="space-y-6">
        <ComponentCard title="All Banners">
          <BannersTable />
        </ComponentCard>
      </div>
    </>
  );
}
