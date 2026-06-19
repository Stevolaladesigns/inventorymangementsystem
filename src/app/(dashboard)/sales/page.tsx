import { prisma } from "@/lib/prisma";
import SalesClient from "./SalesClient";


export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      include: {
        product: true,
      },
      orderBy: {
        saleDate: "desc",
      },
    }),
    prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return <SalesClient initialSales={sales} products={products} />;
}
