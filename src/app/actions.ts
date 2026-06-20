"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ─── Role Guard ────────────────────────────────────────────────────────────
// Reads the stored userId cookie set at login and verifies the role in the DB.
async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("userSession");
  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: No session found.");
  }
  let userId: string | undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
    userId = parsed?.id;
  } catch {
    throw new Error("Unauthorized: Invalid session.");
  }
  if (!userId) throw new Error("Unauthorized: Missing user ID.");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "Admin") {
    throw new Error("Access denied: Admin privileges required.");
  }
  return user;
}

async function requireManagerOrAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("userSession");
  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: No session found.");
  }
  let userId: string | undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
    userId = parsed?.id;
  } catch {
    throw new Error("Unauthorized: Invalid session.");
  }
  if (!userId) throw new Error("Unauthorized: Missing user ID.");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
    throw new Error("Access denied: Admin or Manager privileges required.");
  }
  return user;
}

export async function addProduct(data: {
  name: string;
  sku: string;
  category: string;
  qtyInStock: number;
  minLevel: number;
  unit: string;
  price: number;
  description?: string;
  supplierId?: string;
}) {
  await requireManagerOrAdmin();
  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      qtyInStock: Number(data.qtyInStock),
      minLevel: Number(data.minLevel),
      unit: data.unit,
      price: Number(data.price),
      description: data.description || null,
      supplierId: data.supplierId || null,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    category?: string;
    qtyInStock?: number;
    minLevel?: number;
    unit?: string;
    price?: number;
    description?: string;
    supplierId?: string;
  }
) {
  await requireManagerOrAdmin();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.qtyInStock !== undefined) updateData.qtyInStock = Number(data.qtyInStock);
  if (data.minLevel !== undefined) updateData.minLevel = Number(data.minLevel);
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null;

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.delete({
    where: { id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return product;
}

export async function recordSale(data: {
  productId: string;
  qtySold: number;
  salePrice: number;
  customerName: string;
}) {
  // Staff CAN record sales — no requireAdmin() here
  const qtySold = Number(data.qtySold);
  const result = await prisma.$transaction([
    prisma.sale.create({
      data: {
        productId: data.productId,
        qtySold,
        salePrice: Number(data.salePrice),
        customerName: data.customerName,
      },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data: {
        qtyInStock: {
          decrement: qtySold,
        },
      },
    }),
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/sales");
  revalidatePath("/reports");
  return result[0];
}

export async function recordPurchase(data: {
  supplierId: string;
  productId: string;
  qtyPurchased: number;
  purchasePrice: number;
  status?: string;
}) {
  await requireManagerOrAdmin();
  const qtyPurchased = Number(data.qtyPurchased);
  const status = data.status || "Delivered";

  const purchaseOrder = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        productId: data.productId,
        qtyPurchased,
        purchasePrice: Number(data.purchasePrice),
        status,
      },
    });

    if (status === "Delivered") {
      await tx.product.update({
        where: { id: data.productId },
        data: {
          qtyInStock: {
            increment: qtyPurchased,
          },
        },
      });
    }

    return po;
  });

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/reports");
  return purchaseOrder;
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  await requireManagerOrAdmin();

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Purchase order not found.");
  }

  const oldStatus = existing.status;
  const qtyPurchased = existing.qtyPurchased;
  const productId = existing.productId;

  const updated = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        product: true,
      },
    });

    if (oldStatus !== "Delivered" && status === "Delivered") {
      await tx.product.update({
        where: { id: productId },
        data: {
          qtyInStock: {
            increment: qtyPurchased,
          },
        },
      });
    } else if (oldStatus === "Delivered" && status !== "Delivered") {
      await tx.product.update({
        where: { id: productId },
        data: {
          qtyInStock: {
            decrement: qtyPurchased,
          },
        },
      });
    }

    return po;
  });

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/reports");
  return updated;
}

export async function deletePurchase(id: string) {
  await requireAdmin();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!po) {
    throw new Error("Purchase order not found.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.purchaseOrder.delete({
      where: { id },
    });

    if (po.status === "Delivered") {
      await tx.product.update({
        where: { id: po.productId },
        data: {
          qtyInStock: {
            decrement: po.qtyPurchased,
          },
        },
      });
    }

    return deleted;
  });

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/reports");
  return result;
}

export async function addSupplier(data: {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status?: string;
}) {
  await requireManagerOrAdmin();
  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      category: data.category,
      status: data.status || "Active",
    },
  });
  revalidatePath("/suppliers");
  return supplier;
}

export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    category?: string;
    status?: string;
  }
) {
  await requireManagerOrAdmin();
  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });
  revalidatePath("/suppliers");
  return supplier;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function updateUserProfile(
  id: string,
  data: { name?: string; email?: string; password?: string }
) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Your session is stale or your user account was not found. Please log out and log in again.");
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function updateCompanyDetails(data: {
  id?: string;
  name: string;
  address: string;
  country: string;
  currency: string;
}) {
  await requireManagerOrAdmin();
  if (data.id) {
    const company = await prisma.company.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address,
        country: data.country,
        currency: data.currency,
      },
    });
    revalidatePath("/settings");
    return company;
  } else {
    const existing = await prisma.company.findFirst();
    if (existing) {
      const company = await prisma.company.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          address: data.address,
          country: data.country,
          currency: data.currency,
        },
      });
      revalidatePath("/settings");
      return company;
    } else {
      const company = await prisma.company.create({
        data: {
          name: data.name,
          address: data.address,
          country: data.country,
          currency: data.currency,
        },
      });
      revalidatePath("/settings");
      return company;
    }
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const currentUser = await requireManagerOrAdmin();
  if (data.role === "Admin" && currentUser.role !== "Admin") {
    throw new Error("Access denied: Managers cannot create Admin accounts.");
  }
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("A user with this email address already exists.");
  }
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || "Staff",
    },
  });
  revalidatePath("/settings");
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function addCategory(name: string) {
  await requireManagerOrAdmin();
  const existing = await prisma.category.findUnique({
    where: { name },
  });
  if (existing) {
    throw new Error("Category already exists.");
  }
  const category = await prisma.category.create({
    data: { name },
  });
  revalidatePath("/products");
  revalidatePath("/suppliers");
  return category;
}

export async function updateCategory(id: string, newName: string) {
  await requireManagerOrAdmin();
  if (!newName || newName.trim() === "") {
    throw new Error("Category name cannot be empty.");
  }
  const name = newName.trim();
  
  const currentCategory = await prisma.category.findUnique({
    where: { id },
  });
  if (!currentCategory) {
    throw new Error("Category not found.");
  }
  
  const oldName = currentCategory.name;
  if (oldName.toLowerCase() === name.toLowerCase()) {
    const updated = await prisma.category.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/products");
    revalidatePath("/suppliers");
    return updated;
  }

  const existing = await prisma.category.findUnique({
    where: { name },
  });
  if (existing) {
    throw new Error("A category with this name already exists.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id },
      data: { name },
    });
    
    await tx.product.updateMany({
      where: { category: oldName },
      data: { category: name },
    });

    await tx.supplier.updateMany({
      where: { category: oldName },
      data: { category: name },
    });

    return updated;
  });

  revalidatePath("/products");
  revalidatePath("/suppliers");
  return result;
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    throw new Error("Category not found.");
  }
  
  const oldName = category.name;
  if (oldName === "Uncategorized") {
    throw new Error("The default 'Uncategorized' category cannot be deleted.");
  }

  const result = await prisma.$transaction(async (tx) => {
    let uncategorized = await tx.category.findUnique({
      where: { name: "Uncategorized" },
    });
    if (!uncategorized) {
      uncategorized = await tx.category.create({
        data: { name: "Uncategorized" },
      });
    }

    await tx.product.updateMany({
      where: { category: oldName },
      data: { category: "Uncategorized" },
    });

    await tx.supplier.updateMany({
      where: { category: oldName },
      data: { category: "Uncategorized" },
    });

    const deleted = await tx.category.delete({
      where: { id },
    });
    return deleted;
  });

  revalidatePath("/products");
  revalidatePath("/suppliers");
  return result;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: string;
    password?: string;
  }
) {
  const currentUser = await requireManagerOrAdmin();
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error("User not found.");
  }

  if (data.role === "Admin" && user.role !== "Admin" && currentUser.role !== "Admin") {
    throw new Error("Access denied: Managers cannot promote users to Admin.");
  }

  if (user.role === "Admin" && currentUser.role !== "Admin") {
    throw new Error("Access denied: Managers cannot modify Admin accounts.");
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }
  }

  if (data.role && data.role !== "Admin" && user.role === "Admin") {
    const adminCount = await prisma.user.count({
      where: { role: "Admin" },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot demote the only remaining Admin in the system.");
    }
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password !== undefined && data.password !== "") {
    updateData.password = data.password;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/settings");
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
  };
}

export async function deleteUser(id: string) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role === "Admin") {
    const adminCount = await prisma.user.count({
      where: { role: "Admin" },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the only remaining Admin user.");
    }
  }

  const deleted = await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/settings");
  return {
    id: deleted.id,
    email: deleted.email,
    name: deleted.name,
    role: deleted.role,
  };
}

export async function deleteSale(id: string) {
  await requireAdmin();
  const sale = await prisma.sale.findUnique({
    where: { id },
  });
  if (!sale) {
    throw new Error("Sale not found.");
  }
  const result = await prisma.$transaction([
    prisma.sale.delete({
      where: { id },
    }),
    prisma.product.update({
      where: { id: sale.productId },
      data: {
        qtyInStock: {
          increment: sale.qtySold,
        },
      },
    }),
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/sales");
  revalidatePath("/reports");
  return result[0];
}

export async function deleteSupplier(id: string) {
  await requireAdmin();
  const supplier = await prisma.supplier.findUnique({
    where: { id },
  });
  if (!supplier) {
    throw new Error("Supplier not found.");
  }
  const deleted = await prisma.supplier.delete({
    where: { id },
  });
  revalidatePath("/suppliers");
  revalidatePath("/dashboard");
  return deleted;
}
