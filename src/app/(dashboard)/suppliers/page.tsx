import { prisma } from "@/lib/prisma";
import SuppliersClient from "./SuppliersClient";


export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [suppliers, products, purchaseOrders, categories] = await Promise.all([
    prisma.supplier.findMany({
      include: {
        products: true,
        purchaseOrders: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        product: true,
      },
      orderBy: {
        purchaseDate: "desc",
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <SuppliersClient
      initialSuppliers={suppliers}
      products={products}
      initialPurchases={purchaseOrders}
      initialCategories={categories.map((c) => c.name)}
    />
  );
}
