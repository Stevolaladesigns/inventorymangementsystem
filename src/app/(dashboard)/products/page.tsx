import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";


export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, suppliers, categories] = await Promise.all([
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
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      initialSuppliers={suppliers}
      initialCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
