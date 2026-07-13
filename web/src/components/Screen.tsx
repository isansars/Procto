"use client";
import { useAppState } from "@/context/AppState";
import { RequesterList } from "@/components/screens/RequesterList";
import { RequesterCreate } from "@/components/screens/RequesterCreate";
import { PRDetail } from "@/components/screens/PRDetail";
import { PRTable } from "@/components/screens/PRTable";
import { ApprovalTracker } from "@/components/screens/ApprovalTracker";
import { ApproverInbox } from "@/components/screens/ApproverInbox";
import { ApproverReview } from "@/components/screens/ApproverReview";
import { DecisionHistory } from "@/components/screens/DecisionHistory";
import { ProcurementQueue } from "@/components/screens/ProcurementQueue";
import { POForm } from "@/components/screens/POForm";
import { POList } from "@/components/screens/POList";
import { PODetail } from "@/components/screens/PODetail";
import { WarehouseList } from "@/components/screens/WarehouseList";
import { GRForm } from "@/components/screens/GRForm";
import { GRTable } from "@/components/screens/GRTable";
import { ManagementDashboard } from "@/components/screens/ManagementDashboard";
import { AuditTab } from "@/components/screens/AuditTab";
import { MobileApproval } from "@/components/screens/MobileApproval";

export function Screen() {
  const { ui } = useAppState();
  const { role, module: M, reqView, appView, ordView, whView, prDetailId, grForm } = ui;
  const det = !!prDetailId;

  if (role === "mobile") return <MobileApproval />;
  if (det) return <PRDetail />;

  const isReqList = role === "requester" && M === "requests" && reqView === "list";
  const isReqCreate = role === "requester" && M === "requests" && reqView === "create";
  const isPRTable = M === "requests" && ["approver", "management", "procurement"].includes(role);
  const isApprTracker = M === "approvals" && ["requester", "management"].includes(role);
  const isAppInbox = role === "approver" && M === "approvals" && appView === "inbox";
  const isAppReview = role === "approver" && M === "approvals" && appView === "review";
  const isApprHistory = M === "approvals" && ((role === "approver" && appView === "inbox") || role === "management" || role === "requester");
  const isProcQueue = role === "procurement" && M === "orders" && ordView === "list";
  const isPOForm = role === "procurement" && M === "orders" && ordView === "form";
  const isPOList = M === "orders" && ordView === "list";
  const isPODetail = M === "orders" && ordView === "detail";
  const isWhList = role === "warehouse" && M === "receipts" && whView === "list";
  const isGRForm = role === "warehouse" && M === "receipts" && whView === "grform" && !!grForm;
  const isGRTable = M === "receipts" && ((role === "warehouse" && whView === "list") || role === "procurement" || role === "management");
  const isMgmt = role === "management" && M === "dashboard";
  const isAuditTab = role === "management" && M === "audit";

  return (
    <>
      {isReqList && <RequesterList />}
      {isReqCreate && <RequesterCreate />}
      {isPRTable && <PRTable />}
      {isAppInbox && <ApproverInbox />}
      {isAppReview && <ApproverReview />}
      {isApprTracker && <ApprovalTracker />}
      {isApprHistory && <DecisionHistory />}
      {isProcQueue && <ProcurementQueue />}
      {isPOForm && <POForm />}
      {isPOList && <POList showTitle={!isProcQueue} showOrderRecordsHeading={isProcQueue} />}
      {isPODetail && <PODetail />}
      {isWhList && <WarehouseList />}
      {isGRForm && <GRForm />}
      {isGRTable && <GRTable />}
      {isMgmt && <ManagementDashboard />}
      {isAuditTab && <AuditTab />}
    </>
  );
}
