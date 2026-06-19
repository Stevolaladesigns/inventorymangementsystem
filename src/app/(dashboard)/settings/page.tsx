import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [userResult, users, companyResult, products] = await Promise.all([
    prisma.user.findFirst({
      where: {
        email: "info@bidwestghana.com",
      },
    }),
    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.company.findFirst(),
    prisma.product.findMany(),
  ]);

  let user = userResult;
  if (!user) {
    user = await prisma.user.findFirst();
  }

  let company = companyResult;
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Bidwest Ghana Ltd",
        address: "Plot 14, Spintex Road, Industrial Area, Accra",
        country: "Ghana",
        currency: "GHS",
      },
    });
  }

  const lowStockCount = products.filter(
    (p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0
  ).length;

  return (
    <SettingsClient
      initialUser={user}
      initialUsers={users}
      initialCompany={company}
      lowStockCount={lowStockCount}
    />
  );
}

