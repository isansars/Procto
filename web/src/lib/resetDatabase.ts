import type { PrismaClient } from "@/generated/prisma/client";

// D MMM YYYY[ HH:mm] in local wall-clock time.
function d(y: number, m: number, day: number, h = 9, min = 0) {
  return new Date(y, m - 1, day, h, min);
}

/**
 * Wipes and re-seeds all demo data. Shared by the standalone `prisma db seed`
 * script and the in-app "Reset demo data" API route, so both stay identical.
 */
export async function resetDatabase(prisma: PrismaClient) {

  console.log("Resetting database...");
  await prisma.$transaction([
    prisma.auditLogEntry.deleteMany(),
    prisma.gRLineItem.deleteMany(),
    prisma.goodsReceipt.deleteMany(),
    prisma.pRLineItem.deleteMany(),
    prisma.pOLineItem.deleteMany(),
    prisma.approvalRecord.deleteMany(),
    prisma.purchaseRequest.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.itemCatalogEntry.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.counter.deleteMany(),
  ]);

  // ---------- Branches ----------
  const jkt = await prisma.branch.create({
    data: { name: "Jakarta Pusat", budgetTotal: 180_000_000 },
  });
  const bdg = await prisma.branch.create({
    data: { name: "Bandung", budgetTotal: 120_000_000 },
  });
  const sby = await prisma.branch.create({
    data: { name: "Surabaya", budgetTotal: 90_000_000 },
  });

  // ---------- Departments ----------
  const deptOps = await prisma.department.create({
    data: {
      name: "Operasional",
      branchId: jkt.id,
      costCenter: "CC-JKT-OPS",
      budgetTotal: 60_000_000,
      budgetCommitted: 48_500_000,
    },
  });
  const deptIT = await prisma.department.create({
    data: {
      name: "IT",
      branchId: jkt.id,
      costCenter: "CC-JKT-IT",
      budgetTotal: 200_000_000,
      budgetCommitted: 90_000_000,
    },
  });
  const deptMkt = await prisma.department.create({
    data: {
      name: "Pemasaran",
      branchId: bdg.id,
      costCenter: "CC-BDG-MKT",
      budgetTotal: 80_000_000,
      budgetCommitted: 30_000_000,
    },
  });
  const deptWh = await prisma.department.create({
    data: {
      name: "Gudang",
      branchId: sby.id,
      costCenter: "CC-SBY-WH",
      budgetTotal: 60_000_000,
      budgetCommitted: 20_000_000,
    },
  });

  // ---------- Users (personas) ----------
  const dewi = await prisma.user.create({
    data: { slug: "dewi", name: "Dewi Lestari", role: "REQUESTER", title: "Requester", branchId: jkt.id, departmentId: deptOps.id },
  });
  const siti = await prisma.user.create({
    data: { slug: "siti", name: "Siti Rahma", role: "REQUESTER", title: "Requester", branchId: jkt.id, departmentId: deptIT.id },
  });
  const andi = await prisma.user.create({
    data: { slug: "andi", name: "Andi Wirawan", role: "REQUESTER", title: "Requester", branchId: bdg.id, departmentId: deptMkt.id },
  });
  const rudi = await prisma.user.create({
    data: { slug: "rudi", name: "Rudi Hartono", role: "REQUESTER", title: "Requester", branchId: sby.id, departmentId: deptWh.id },
  });
  const budi = await prisma.user.create({
    data: { slug: "budi", name: "Budi Santoso", role: "DEPT_APPROVER", approvalLevel: "dept", title: "Department Approver", branchId: jkt.id },
  });
  const rina = await prisma.user.create({
    data: { slug: "rina", name: "Rina Wijaya", role: "BRANCH_MANAGER", approvalLevel: "branch", title: "Branch Manager", branchId: jkt.id },
  });
  const agus = await prisma.user.create({
    data: { slug: "agus", name: "Agus Pratama", role: "FINANCE_APPROVER", approvalLevel: "finance", title: "Finance Approver" },
  });
  await prisma.user.create({
    data: { slug: "maya", name: "Maya Anggraini", role: "MANAGEMENT", approvalLevel: "exec", title: "Executive" },
  });
  const sari = await prisma.user.create({
    data: { slug: "sari", name: "Sari Kusuma", role: "PROCUREMENT_OFFICER", title: "Procurement Officer" },
  });
  await prisma.user.create({
    data: { slug: "hendra", name: "Hendra Gunawan", role: "PROCUREMENT_MANAGER", title: "Procurement Manager" },
  });
  const joko = await prisma.user.create({
    data: { slug: "joko", name: "Joko Susilo", role: "WAREHOUSE_STAFF", title: "Warehouse Staff", branchId: jkt.id },
  });
  // Historical-only actors — attributed on past decisions/audit entries but not selectable personas.
  const laksmi = await prisma.user.create({
    data: { slug: "laksmi", name: "Laksmi Dewanti", role: "DEPT_APPROVER", approvalLevel: "dept", title: "Department Approver", branchId: bdg.id },
  });
  const bagus = await prisma.user.create({
    data: { slug: "bagus", name: "Bagus Prasetyo", role: "DEPT_APPROVER", approvalLevel: "dept", title: "Department Approver", branchId: sby.id },
  });

  // ---------- Vendors ----------
  const v1 = await prisma.vendor.create({
    data: { code: "V1", name: "PT Sumber Makmur ATK", category: "ATK & office supplies", paymentTerms: "TOP 30 hari" },
  });
  const v2 = await prisma.vendor.create({
    data: { code: "V2", name: "CV Teknindo Jaya", category: "IT & elektronik", paymentTerms: "TOP 14 hari" },
  });
  await prisma.vendor.create({
    data: { code: "V3", name: "PT Cahaya Abadi Furnitur", category: "Furnitur kantor", paymentTerms: "TOP 30 hari" },
  });

  // ---------- Item catalog ----------
  const k1 = await prisma.itemCatalogEntry.create({
    data: { code: "K1", desc: "Kertas A4 80gsm (Sinar Dunia)", uom: "rim", price: 58_000, category: "ATK" },
  });
  const k2 = await prisma.itemCatalogEntry.create({
    data: { code: "K2", desc: "Toner HP 26A CF226A", uom: "pcs", price: 1_150_000, category: "ATK" },
  });
  const k3 = await prisma.itemCatalogEntry.create({
    data: { code: "K3", desc: "Kursi Kantor Ergonomis", uom: "unit", price: 2_350_000, category: "Furnitur" },
  });
  const k4 = await prisma.itemCatalogEntry.create({
    data: { code: "K4", desc: "Laptop Lenovo ThinkPad E14", uom: "unit", price: 14_500_000, category: "IT" },
  });
  const k5 = await prisma.itemCatalogEntry.create({
    data: { code: "K5", desc: "AC Split 1 PK (Daikin)", uom: "unit", price: 4_200_000, category: "Elektronik" },
  });
  const k6 = await prisma.itemCatalogEntry.create({
    data: { code: "K6", desc: "Rak Gudang Heavy Duty 4 Tingkat", uom: "unit", price: 3_800_000, category: "Gudang" },
  });

  // ---------- Purchase Requests ----------
  await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0012",
      requesterId: dewi.id, branchId: jkt.id, departmentId: deptOps.id,
      createdAt: d(2026, 7, 10), dateNeeded: "2026-07-24", urgency: "NORMAL",
      justification: "Toner cadangan printer lantai 2 hampir habis.",
      status: "DRAFT", level: 0, chain: "dept", levelEnteredAt: d(2026, 7, 10),
      lines: { create: [{ itemId: k2.id, qty: 2, status: "PENDING" }] },
    },
  });

  const pr11 = await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0011",
      requesterId: siti.id, branchId: jkt.id, departmentId: deptIT.id,
      createdAt: d(2026, 7, 9, 10, 30), dateNeeded: "2026-07-30", urgency: "NORMAL",
      justification: "Penggantian 10 laptop tim engineering — unit lama sudah 5 tahun, biaya perbaikan meningkat.",
      status: "PENDING_APPROVAL", level: 3, chain: "dept,branch,finance,exec",
      levelEnteredAt: d(2026, 7, 10, 15, 40),
      lines: { create: [{ itemId: k4.id, qty: 10, status: "PENDING" }] },
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0010",
      requesterId: dewi.id, branchId: jkt.id, departmentId: deptOps.id,
      createdAt: d(2026, 7, 8, 9, 31), dateNeeded: "2026-07-20", urgency: "URGENT",
      justification: "Restock ATK bulanan kantor pusat + 2 kursi pengganti untuk ruang rapat (rusak).",
      status: "PENDING_APPROVAL", level: 0, chain: "dept,branch",
      levelEnteredAt: d(2026, 7, 8, 9, 31),
      lines: {
        create: [
          { itemId: k1.id, qty: 20, status: "PENDING" },
          { itemId: k2.id, qty: 4, status: "PENDING" },
          { itemId: k3.id, qty: 2, status: "PENDING" },
        ],
      },
    },
  });

  const pr9 = await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0009",
      requesterId: siti.id, branchId: jkt.id, departmentId: deptIT.id,
      createdAt: d(2026, 7, 7), dateNeeded: "2026-07-18", urgency: "NORMAL",
      justification: "Kertas untuk printer ruang server + AC pengganti ruang NOC.",
      status: "APPROVED", level: 2, chain: "dept,branch",
      levelEnteredAt: d(2026, 7, 7, 16, 20),
      lines: {
        create: [
          { itemId: k1.id, qty: 10, status: "APPROVED" },
          { itemId: k5.id, qty: 1, status: "APPROVED" },
        ],
      },
    },
  });

  const pr8 = await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0008",
      requesterId: andi.id, branchId: bdg.id, departmentId: deptMkt.id,
      createdAt: d(2026, 7, 6), dateNeeded: "2026-07-17", urgency: "NORMAL",
      justification: "Kertas untuk cetak materi promosi Q3.",
      status: "APPROVED", level: 1, chain: "dept",
      levelEnteredAt: d(2026, 7, 6, 15, 44),
      lines: { create: [{ itemId: k1.id, qty: 30, status: "APPROVED" }] },
    },
  });

  const pr5 = await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0005",
      requesterId: rudi.id, branchId: sby.id, departmentId: deptWh.id,
      createdAt: d(2026, 7, 6, 7, 0), dateNeeded: "2026-07-15", urgency: "NORMAL",
      justification: "Rak tambahan untuk zona penerimaan gudang Surabaya.",
      status: "PENDING_APPROVAL", level: 1, chain: "dept,branch",
      levelEnteredAt: d(2026, 7, 6, 8, 15),
      lines: { create: [{ itemId: k6.id, qty: 2, status: "PENDING" }] },
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0003",
      requesterId: dewi.id, branchId: jkt.id, departmentId: deptOps.id,
      createdAt: d(2026, 6, 24), dateNeeded: "2026-07-01", urgency: "NORMAL",
      justification: "ATK rutin.",
      status: "FULFILLED", level: 1, chain: "dept",
      levelEnteredAt: d(2026, 6, 24),
      lines: { create: [{ id: "PR3-L1", itemId: k1.id, qty: 5, status: "APPROVED" }] },
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      id: "PR-2026-0002",
      requesterId: siti.id, branchId: jkt.id, departmentId: deptIT.id,
      createdAt: d(2026, 7, 2), dateNeeded: "2026-07-10", urgency: "URGENT",
      justification: "Laptop pengganti untuk 5 staf onboarding batch Juli.",
      status: "IN_PROCUREMENT", level: 3, chain: "dept,branch,finance",
      levelEnteredAt: d(2026, 7, 3),
      lines: { create: [{ id: "PR2-L1", itemId: k4.id, qty: 5, status: "APPROVED" }] },
    },
  });

  // ---------- Purchase Orders ----------
  const po21 = await prisma.purchaseOrder.create({
    data: {
      id: "PO-2026-0021", vendorId: v2.id, branchId: jkt.id,
      createdAt: d(2026, 7, 5, 11, 0), expectedDelivery: d(2026, 7, 9, 17, 0),
      status: "PARTIALLY_RECEIVED", createdById: sari.id,
      lines: {
        create: [
          { id: "PO21-L1", itemId: k4.id, qty: 5, price: 14_500_000, received: 3, prRefLabel: "PR-2026-0002 · Siti Rahma" },
        ],
      },
    },
  });
  await prisma.pRLineItem.update({ where: { id: "PR2-L1" }, data: { poLineId: "PO21-L1" } });

  const po18 = await prisma.purchaseOrder.create({
    data: {
      id: "PO-2026-0018", vendorId: v1.id, branchId: jkt.id,
      createdAt: d(2026, 6, 26), expectedDelivery: d(2026, 6, 30, 17, 0),
      status: "FULLY_RECEIVED", createdById: sari.id,
      lines: {
        create: [
          { id: "PO18-L1", itemId: k1.id, qty: 5, price: 58_000, received: 5, prRefLabel: "PR-2026-0003 · Dewi Lestari" },
        ],
      },
    },
  });
  await prisma.pRLineItem.update({ where: { id: "PR3-L1" }, data: { poLineId: "PO18-L1" } });

  // ---------- Goods Receipts ----------
  await prisma.goodsReceipt.create({
    data: {
      id: "GR-2026-0007", poId: po21.id, createdAt: d(2026, 7, 8, 14, 12), recordedById: joko.id, flag: "OK",
      lines: { create: [{ poLineId: "PO21-L1", itemId: k4.id, qty: 3, condition: "GOOD" }] },
    },
  });
  await prisma.goodsReceipt.create({
    data: {
      id: "GR-2026-0004", poId: po18.id, createdAt: d(2026, 6, 30, 10, 0), recordedById: joko.id, flag: "OK",
      lines: { create: [{ poLineId: "PO18-L1", itemId: k1.id, qty: 5, condition: "GOOD" }] },
    },
  });

  // ---------- Approval decision history ----------
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0007", prId: pr11.id, level: "finance", levelName: "Finance Approver", approverId: agus.id, decision: "Approved", comment: "Budget IT masih tersedia.", createdAt: d(2026, 7, 10, 15, 40) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0006", prId: pr11.id, level: "branch", levelName: "Branch Manager", approverId: rina.id, decision: "Approved", createdAt: d(2026, 7, 10, 9, 12) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0005", prId: pr11.id, level: "dept", levelName: "Department Approver", approverId: budi.id, decision: "Approved", createdAt: d(2026, 7, 9, 16, 5) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0004", prId: pr9.id, level: "branch", levelName: "Branch Manager", approverId: rina.id, decision: "Approved", createdAt: d(2026, 7, 7, 16, 20) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0003", prId: pr9.id, level: "dept", levelName: "Department Approver", approverId: budi.id, decision: "Approved", createdAt: d(2026, 7, 7, 10, 5) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0002", prId: pr8.id, level: "dept", levelName: "Department Approver", approverId: laksmi.id, decision: "Approved", createdAt: d(2026, 7, 6, 15, 44) },
  });
  await prisma.approvalRecord.create({
    data: { id: "APV-2026-0001", prId: pr5.id, level: "dept", levelName: "Department Approver", approverId: bagus.id, decision: "Approved", createdAt: d(2026, 7, 6, 8, 15) },
  });

  // ---------- Audit trail ----------
  const audit: { entityId: string; entityType: string; action: string; userName: string; comment?: string; at: Date }[] = [
    { entityId: "PR-2026-0011", entityType: "PR", action: "Approved — Level 3 (Finance Approver) · escalated to Executive", userName: "Agus Pratama", comment: "Budget IT masih tersedia.", at: d(2026, 7, 10, 15, 40) },
    { entityId: "PR-2026-0011", entityType: "PR", action: "Approved — Level 2 (Branch Manager)", userName: "Rina Wijaya", at: d(2026, 7, 10, 9, 12) },
    { entityId: "PR-2026-0011", entityType: "PR", action: "Approved — Level 1 (Department Approver)", userName: "Budi Santoso", at: d(2026, 7, 9, 16, 5) },
    { entityId: "PR-2026-0011", entityType: "PR", action: "Submitted for approval (route: Dept → Branch → Finance → Executive)", userName: "Siti Rahma", at: d(2026, 7, 9, 10, 30) },
    { entityId: "GR-2026-0007", entityType: "GR", action: "Goods receipt submitted — 3 unit received (Good)", userName: "Joko Susilo", at: d(2026, 7, 8, 14, 12) },
    { entityId: "PR-2026-0010", entityType: "PR", action: "Submitted for approval (route: Dept → Branch Manager)", userName: "Dewi Lestari", at: d(2026, 7, 8, 9, 31) },
    { entityId: "PR-2026-0009", entityType: "PR", action: "Approved — final level (Branch Manager)", userName: "Rina Wijaya", at: d(2026, 7, 7, 16, 20) },
    { entityId: "PR-2026-0009", entityType: "PR", action: "Approved — Level 1 (Department Approver)", userName: "Budi Santoso", at: d(2026, 7, 7, 10, 5) },
    { entityId: "PR-2026-0008", entityType: "PR", action: "Approved — final level (Department Approver)", userName: "Laksmi Dewanti", at: d(2026, 7, 6, 15, 44) },
    { entityId: "PO-2026-0021", entityType: "PO", action: "PO issued to CV Teknindo Jaya", userName: "Sari Kusuma", at: d(2026, 7, 5, 11, 0) },
    { entityId: "PR-2026-0005", entityType: "PR", action: "Approved — Level 1 (Department Approver)", userName: "Bagus Prasetyo", at: d(2026, 7, 6, 8, 15) },
  ];
  for (const a of audit) {
    await prisma.auditLogEntry.create({
      data: { entityId: a.entityId, entityType: a.entityType, action: a.action, userName: a.userName, comment: a.comment ?? "", createdAt: a.at },
    });
  }

  // ---------- Counters (next sequence numbers) ----------
  await prisma.counter.createMany({
    data: [
      { name: "PR", value: 13 },
      { name: "PO", value: 22 },
      { name: "GR", value: 8 },
      { name: "APV", value: 8 },
      { name: "ITEM", value: 1 },
    ],
  });

}
