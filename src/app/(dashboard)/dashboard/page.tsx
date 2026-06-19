import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";


export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [products, suppliers, sales, purchases] = await Promise.all([
    prisma.product.findMany({
      include: {
        supplier: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.supplier.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.sale.findMany({
      orderBy: {
        saleDate: "desc",
      },
    }),
    prisma.purchaseOrder.findMany({
      orderBy: {
        purchaseDate: "desc",
      },
    }),
  ]);

  return (
    <DashboardClient
      initialProducts={products}
      initialSuppliers={suppliers}
      initialSales={sales}
      initialPurchases={purchases}
    />
  );
}
