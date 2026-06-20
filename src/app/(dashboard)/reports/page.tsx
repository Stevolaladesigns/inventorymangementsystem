import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";


export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [sales, purchases, products, company] = await Promise.all([
    prisma.sale.findMany({
      include: {
        product: true,
      },
      orderBy: {
        saleDate: "desc",
      },
    }),
    prisma.purchaseOrder.findMany({
      include: {
        product: true,
        supplier: true,
      },
      orderBy: {
        purchaseDate: "desc",
      },
    }),
    prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.company.findFirst(),
  ]);

  return (
    <ReportsClient
      sales={sales}
      purchases={purchases}
      products={products}
      company={company}
    />
  );
}
