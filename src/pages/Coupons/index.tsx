import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import CouponsTable from "../../components/coupons/CouponsTable";

export default function Coupons() {
  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Coupons Overview"
        description="Track coupon creation, usage, redemptions, and expirations across platforms."
      />
      <PageBreadcrumb pageTitle="Coupon" />
      <div className="space-y-6">
        <ComponentCard title="All Coupons">
          <CouponsTable />
        </ComponentCard>
      </div>
    </>
  );
}
