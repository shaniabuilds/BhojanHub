
import { notFound } from "next/navigation";

import { features, FeatureSlug } from "../data";
import { PosApp } from "@/components/pos/PosApp";
import InventoryDashboard from "@/components/inventory/InventoryDashboard";
import { OnlineOrderingApp } from "@/components/ordering/OnlineOrderingApp";
import { TableManagementApp } from "@/components/tables/TableManagementApp";
import { ReportingDashboard } from "@/components/reports/ReportingDashboard";
import { CrmDashboard } from "@/components/crm/CrmDashboard";

export function generateStaticParams() {
  return Object.keys(features).map((slug) => ({ slug }));
}

export default function FeaturePage({
  params,
}: {
  params: { slug: string };
}) {
  const feature = features[params.slug as FeatureSlug];

  if (!feature) {
    notFound();
  }

  if (params.slug === "billing-pos") {
    return <PosApp />;
  }

  const isFullScreenApp =
    params.slug === "inventory-management" ||
    params.slug === "online-ordering" ||
    params.slug === "table-management" ||
    params.slug === "reporting-analytics" ||
    params.slug === "crm";

  if (isFullScreenApp) {
    return (
      <div className="min-h-screen w-full overflow-hidden bg-[#F3E9DC]">
        {params.slug === "inventory-management" ? (
          <InventoryDashboard />
        ) : params.slug === "online-ordering" ? (
          <OnlineOrderingApp />
        ) : params.slug === "table-management" ? (
          <TableManagementApp />
        ) : params.slug === "reporting-analytics" ? (
          <ReportingDashboard />
        ) : (
          <CrmDashboard />
        )}
      </div>
    );
  }

}