import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@test.com",
      passwordHash,
      name: "Arun Sharma",
      role: "BUYER",
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@test.com",
      passwordHash,
      name: "Priya Patel",
      role: "SELLER",
    },
  });

  const bank = await prisma.user.create({
    data: {
      email: "bank@test.com",
      passwordHash,
      name: "Vikram Mehta",
      role: "BANK",
    },
  });

  const lawyer = await prisma.user.create({
    data: {
      email: "lawyer@test.com",
      passwordHash,
      name: "Ananya Gupta",
      role: "LAWYER",
    },
  });

  const broker = await prisma.user.create({
    data: {
      email: "broker@test.com",
      passwordHash,
      name: "Rajesh Kumar",
      role: "BROKER",
    },
  });

  const property1 = await prisma.property.create({
    data: {
      address: "B-201, Sunshine Apartments, Off Linking Road",
      city: "Mumbai",
      state: "Maharashtra",
      surveyNumber: "CTS No. 1234/5678",
      ownershipHistory: [
        {
          transferDate: "2019-03-15",
          previousOwner: "Sunita Developers Pvt. Ltd.",
          newOwner: "Priya Patel",
          considerationAmount: 12500000,
          deedType: "Sale Deed",
          registrationNumber: "MBH-2019-88472",
          subRegistrarOffice: "Bandra, Mumbai",
        },
        {
          transferDate: "2015-08-22",
          previousOwner: "Rajeshwar Constructions",
          newOwner: "Sunita Developers Pvt. Ltd.",
          considerationAmount: 8750000,
          deedType: "Sale Deed",
          registrationNumber: "MBH-2015-44231",
          subRegistrarOffice: "Bandra, Mumbai",
        },
        {
          transferDate: "2010-01-10",
          previousOwner: "Fernandes Family Trust",
          newOwner: "Rajeshwar Constructions",
          considerationAmount: 5200000,
          deedType: "Sale Deed",
          registrationNumber: "MBH-2010-12890",
          subRegistrarOffice: "Bandra, Mumbai",
        },
      ],
      encumbranceStatus: {
        hasExistingLoan: true,
        loans: [
          {
            lenderName: "State Bank of India",
            loanType: "Home Loan",
            loanSanctionNumber: "SBI-HL-2022-45678",
            sanctionedAmount: 8000000,
            outstandingAmount: 6200000,
            sanctionDate: "2022-06-01",
            isNOCReceived: false,
            remarks: "Loan account is regular with EMI deductions auto-debit",
          },
        ],
        hasLitigation: false,
        litigationDetails: null,
        isEncumbered: true,
        encumbranceCertificateReference: "EC-MBH-2026-00341",
        encumbrancePeriod: "2015-01-01 to 2025-12-31",
      },
      taxRecords: {
        propertyTaxId: "MCBM-PT-2024-00987",
        annualTaxAmount: 28450,
        lastPaymentDate: "2026-03-20",
        lastPaymentReceiptNo: "MCBM-REC-2026-1423",
        taxDue: 0,
        taxArrears: 0,
        taxAssessmentYear: "2025-2026",
        taxPaidUpTo: "2026-03-31",
        propertyTaxHistory: [
          { year: "2024-2025", amount: 26800, paidOn: "2025-03-15", receiptNo: "MCBM-REC-2025-9876" },
          { year: "2023-2024", amount: 25500, paidOn: "2024-03-28", receiptNo: "MCBM-REC-2024-8123" },
          { year: "2022-2023", amount: 24200, paidOn: "2023-04-02", receiptNo: "MCBM-REC-2023-7654" },
        ],
        waterTaxId: "MCBM-WT-2024-00452",
        waterTaxDue: 0,
        approvedBuildingPlanRef: "BMC-BP-2018-4421",
        occupancyCertificateRef: "BMC-OC-2019-3310",
      },
      titleChain: {
        summary: "Title is clear and marketable. Property originated from a 99-year lease converted to freehold in 2008.",
        chain: [
          {
            deedType: "Sale Deed",
            date: "2019-03-15",
            parties: ["Sunita Developers Pvt. Ltd. (Transferor)", "Priya Patel (Transferee)"],
            documentNumber: "MBH-2019-88472",
            notaryName: "Nitin Desai, Notary Public",
            remarks: "Registered sale deed. Stamp duty paid at 5% of consideration.",
          },
          {
            deedType: "Sale Deed",
            date: "2015-08-22",
            parties: ["Rajeshwar Constructions (Transferor)", "Sunita Developers Pvt. Ltd. (Transferee)"],
            documentNumber: "MBH-2015-44231",
            notaryName: "Meera Joshi, Notary Public",
            remarks: "Registered sale deed. Property was part of a larger development parcel.",
          },
          {
            deedType: "Sale Deed",
            date: "2010-01-10",
            parties: ["Fernandes Family Trust (Transferor)", "Rajeshwar Constructions (Transferee)"],
            documentNumber: "MBH-2010-12890",
            notaryName: "Sanjay Rane, Notary Public",
            remarks: "Registered sale deed. Property was bequeathed to trust by will probated in 2008.",
          },
          {
            deedType: "Deed of Declaration",
            date: "2008-06-30",
            parties: ["Fernandes Family Trust"],
            documentNumber: "MBH-2008-7721",
            notaryName: "Sanjay Rane, Notary Public",
            remarks: "Probate of Will granted by Bombay High Court in Probate Petition No. 442 of 2008.",
          },
        ],
        titleOpinion: "Title is clear, valid, and marketable subject to confirmation of loan closure from SBI.",
        titleInsuranceRef: "TI-POL-2026-MBH-0987",
      },
    },
  });

  const property2 = await prisma.property.create({
    data: {
      address: "Plot No. 42, Electronic City Phase 2, Hosur Road",
      city: "Bangalore",
      state: "Karnataka",
      surveyNumber: "Sy. No. 89/12, Hadosiddapura Village",
      ownershipHistory: [
        {
          transferDate: "2021-11-20",
          previousOwner: "Greenfield Industrial Parks LLP",
          newOwner: "Arun Sharma",
          considerationAmount: 18500000,
          deedType: "Sale Deed",
          registrationNumber: "BLR-2021-119283",
          subRegistrarOffice: "Electronic City, Bangalore",
        },
        {
          transferDate: "2017-04-05",
          previousOwner: "Mysore Silk Weavers Cooperative",
          newOwner: "Greenfield Industrial Parks LLP",
          considerationAmount: 9200000,
          deedType: "Sale Deed",
          registrationNumber: "BLR-2017-55412",
          subRegistrarOffice: "Anekal, Bangalore",
        },
      ],
      encumbranceStatus: {
        hasExistingLoan: false,
        loans: [],
        hasLitigation: false,
        litigationDetails: null,
        isEncumbered: false,
        encumbranceCertificateReference: "EC-BLR-2026-00872",
        encumbrancePeriod: "2017-01-01 to 2025-12-31",
      },
      taxRecords: {
        propertyTaxId: "BBMP-PT-2021-33221",
        annualTaxAmount: 18750,
        lastPaymentDate: "2026-04-10",
        lastPaymentReceiptNo: "BBMP-REC-2026-2341",
        taxDue: 0,
        taxArrears: 0,
        taxAssessmentYear: "2025-2026",
        taxPaidUpTo: "2026-03-31",
        propertyTaxHistory: [
          { year: "2024-2025", amount: 17500, paidOn: "2025-04-05", receiptNo: "BBMP-REC-2025-1987" },
          { year: "2023-2024", amount: 16200, paidOn: "2024-04-12", receiptNo: "BBMP-REC-2024-1654" },
        ],
        waterTaxId: "BWSSB-WT-2021-00981",
        waterTaxDue: 0,
        approvedBuildingPlanRef: "BBMP-BP-2021-8832",
        occupancyCertificateRef: null,
      },
      titleChain: {
        summary: "Title is clear and marketable. Property is freehold agricultural land converted to industrial use.",
        chain: [
          {
            deedType: "Sale Deed",
            date: "2021-11-20",
            parties: ["Greenfield Industrial Parks LLP (Transferor)", "Arun Sharma (Transferee)"],
            documentNumber: "BLR-2021-119283",
            notaryName: "K. Venkatesh, Notary Public",
            remarks: "Registered sale deed. Land use conversion approved by KIADB.",
          },
          {
            deedType: "Sale Deed",
            date: "2017-04-05",
            parties: ["Mysore Silk Weavers Cooperative (Transferor)", "Greenfield Industrial Parks LLP (Transferee)"],
            documentNumber: "BLR-2017-55412",
            notaryName: "Lakshmi Narayan, Notary Public",
            remarks: "Registered sale deed. Cooperative dissolution approved by Registrar of Societies.",
          },
          {
            deedType: "Grant Certificate",
            date: "1965-08-15",
            parties: ["Government of Mysore (Grantor)", "Mysore Silk Weavers Cooperative (Grantee)"],
            documentNumber: "GOM-LSG-1965-221",
            notaryName: null,
            remarks: "Original grant of land for silk weaving industrial cooperative. 99-year lease converted to freehold under Karnataka Land Reforms Act.",
          },
        ],
        titleOpinion: "Title is clear, valid, and marketable. No encumbrances or litigation reported.",
        titleInsuranceRef: "TI-POL-2026-BLR-0543",
      },
    },
  });

  const demoRoom = await prisma.room.create({
    data: {
      name: "Demo Deal - Sunshine Apartments",
      propertyId: property1.id,
      status: "DRAFT",
      createdByUserId: broker.id,
    },
  });

  await prisma.participant.createMany({
    data: [
      { roomId: demoRoom.id, userId: buyer.id, role: "BUYER" },
      { roomId: demoRoom.id, userId: seller.id, role: "SELLER" },
      { roomId: demoRoom.id, userId: bank.id, role: "BANK" },
      { roomId: demoRoom.id, userId: lawyer.id, role: "LAWYER" },
      { roomId: demoRoom.id, userId: broker.id, role: "BROKER" },
    ],
  });

  const now = new Date();

  await prisma.activityLog.create({
    data: {
      roomId: demoRoom.id,
      userId: broker.id,
      action: "ROOM_CREATED",
      details: { message: "Demo Deal room created by broker Rajesh Kumar with all 5 participants" },
      timestamp: new Date(now.getTime() - 86400000 * 3),
    },
  });

  await prisma.activityLog.create({
    data: {
      roomId: demoRoom.id,
      userId: lawyer.id,
      action: "NOTE",
      details: { message: "Started reviewing the title chain. Initial findings look positive — need to verify the 2008 probate order." },
      timestamp: new Date(now.getTime() - 86400000 * 2),
    },
  });

  await prisma.activityLog.create({
    data: {
      roomId: demoRoom.id,
      userId: bank.id,
      action: "NOTE",
      details: { message: "Verified encumbrance certificate. Existing SBI loan of Rs. 62L needs NOC before closure. No other charges." },
      timestamp: new Date(now.getTime() - 86400000 * 1),
    },
  });

  await prisma.activityLog.create({
    data: {
      roomId: demoRoom.id,
      userId: buyer.id,
      action: "NOTE",
      details: { message: "Reviewed tax records. Property taxes are paid up to March 2026. No arrears." },
      timestamp: new Date(now.getTime() - 43200000),
    },
  });

  await prisma.activityLog.create({
    data: {
      roomId: demoRoom.id,
      userId: broker.id,
      action: "NOTE",
      details: { message: "All parties confirmed. Ready to move to In Review once everyone has completed their initial checks." },
      timestamp: new Date(now.getTime() - 21600000),
    },
  });

  console.log("Seed completed successfully");
  console.log('  Users:       5 created (all passwords: "password123")');
  console.log("  Properties:  2 created (Mumbai apartment, Bangalore industrial plot)");
  console.log('  Room:        "Demo Deal - Sunshine Apartments" (DRAFT)');
  console.log("  Activities:  5 seed entries (room creation, lawyer review, bank check, buyer review, broker summary)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
