import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.purchaseOrder.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.category.deleteMany();

  console.log("Creating default Categories...");
  const defaultCategories = [
    "Building Materials",
    "Metals",
    "Plumbing",
    "Electrical",
    "Roofing",
    "Hardware",
    "Paints & Finishes",
  ];
  for (const cat of defaultCategories) {
    await prisma.category.create({
      data: { name: cat }
    });
  }

  console.log("Creating default Company details...");
  await prisma.company.create({
    data: {
      name: "Bidwest Ghana Ltd",
      address: "Plot 14, Spintex Road, Industrial Area, Accra",
      country: "Ghana",
      currency: "GHS",
    },
  });

  console.log("Creating Admin User...");
  const admin = await prisma.user.create({
    data: {
      email: "info@bidwestghana.com",
      name: "Admin Kwame",
      password: "BidVEST@26",
      role: "Admin",
    },
  });

  console.log("Creating Suppliers...");
  const accraBuilding = await prisma.supplier.create({
    data: {
      name: "Accra Building Supplies",
      contactPerson: "Kweku Antwi",
      phone: "+233 24 412 3456",
      email: "info@accrabuilding.gh",
      category: "Building Materials",
      status: "Active",
    },
  });

  const temaSteel = await prisma.supplier.create({
    data: {
      name: "Tema Steel Works",
      contactPerson: "Emmanuel Mensah",
      phone: "+233 30 298 7654",
      email: "sales@temasteel.gh",
      category: "Metals",
      status: "Active",
    },
  });

  const kumasiPlastics = await prisma.supplier.create({
    data: {
      name: "Kumasi Plastics",
      contactPerson: "Ama Serwaa",
      phone: "+233 20 811 2233",
      email: "info@kumasiplastics.gh",
      category: "Plumbing",
      status: "Active",
    },
  });

  const ghanaCables = await prisma.supplier.create({
    data: {
      name: "Ghana Cables Ltd",
      contactPerson: "John Lamptey",
      phone: "+233 24 399 8877",
      email: "orders@ghanacables.gh",
      category: "Electrical",
      status: "Active",
    },
  });

  const accraPaint = await prisma.supplier.create({
    data: {
      name: "Accra Paint Depot",
      contactPerson: "Ebo Mensah",
      phone: "+233 24 555 1212",
      email: "sales@accrapaint.gh",
      category: "Paints & Finishes",
      status: "Active",
    },
  });

  const kwameSand = await prisma.supplier.create({
    data: {
      name: "Kwame Sand Quarry",
      contactPerson: "Kwame Boateng",
      phone: "+233 20 999 8888",
      email: "kwame@sandquarry.gh",
      category: "Building Materials",
      status: "Active",
    },
  });

  console.log("Creating Products...");
  const cement = await prisma.product.create({
    data: {
      name: "Cement (50kg bag)",
      sku: "CEM-001",
      category: "Building Materials",
      qtyInStock: 245,
      minLevel: 50,
      unit: "bags",
      price: 62.00,
      description: "Standard grade building cement (50kg)",
      supplierId: accraBuilding.id,
    },
  });

  const steelRods = await prisma.product.create({
    data: {
      name: "Steel Rods (12mm)",
      sku: "STL-012",
      category: "Metals",
      qtyInStock: 180,
      minLevel: 40,
      unit: "pcs",
      price: 85.00,
      description: "Reinforcement high-tensile steel rods (12mm)",
      supplierId: temaSteel.id,
    },
  });

  const pvcPipe = await prisma.product.create({
    data: {
      name: "PVC Pipe (3/4\")",
      sku: "PVC-075",
      category: "Plumbing",
      qtyInStock: 8,
      minLevel: 30,
      unit: "pcs",
      price: 25.00,
      description: "Durability-rated 3/4 inch plumbing PVC pipes",
      supplierId: kumasiPlastics.id,
    },
  });

  const paint = await prisma.product.create({
    data: {
      name: "Paint (White 20L)",
      sku: "PNT-W20",
      category: "Paints & Finishes",
      qtyInStock: 2,
      minLevel: 15,
      unit: "cans",
      price: 380.00,
      description: "Premium interior/exterior white emulsion paint",
      supplierId: accraPaint.id,
    },
  });

  const roofingSheets = await prisma.product.create({
    data: {
      name: "Roofing Sheets",
      sku: "ROF-002",
      category: "Roofing",
      qtyInStock: 94,
      minLevel: 20,
      unit: "pcs",
      price: 150.00,
      description: "Aluzinc corrugated roofing sheets (0.45mm)",
      supplierId: accraBuilding.id,
    },
  });

  const electricalWire = await prisma.product.create({
    data: {
      name: "Electrical Wire (2.5mm)",
      sku: "ELC-025",
      category: "Electrical",
      qtyInStock: 14,
      minLevel: 25,
      unit: "rolls",
      price: 220.00,
      description: "Single core copper wire 2.5mm for house wiring",
      supplierId: ghanaCables.id,
    },
  });

  const sand = await prisma.product.create({
    data: {
      name: "Sand (1 Ton)",
      sku: "SND-001",
      category: "Building Materials",
      qtyInStock: 310,
      minLevel: 100,
      unit: "tons",
      price: 550.00,
      description: "High quality river sand for concrete mixing",
      supplierId: kwameSand.id,
    },
  });

  const nails = await prisma.product.create({
    data: {
      name: "Nails (3 inch)",
      sku: "NL-003",
      category: "Hardware",
      qtyInStock: 1,
      minLevel: 20,
      unit: "boxes",
      price: 8.50,
      description: "Standard wire nails (3 inch)",
      supplierId: temaSteel.id,
    },
  });

  console.log("Creating Sales and Purchase Orders (Historical & Current)...");

  // Create date sequences for reports charts (Jan - Jun)
  const now = new Date();
  const months = [0, 1, 2, 3, 4, 5]; // 0: Jan, 1: Feb, 2: Mar, 3: Apr, 4: May, 5: Jun
  const year = now.getFullYear();

  // Jan
  await prisma.sale.create({
    data: {
      productId: cement.id,
      qtySold: 50,
      salePrice: 62.00,
      customerName: "Kofi Boateng",
      saleDate: new Date(year, 0, 15),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: accraBuilding.id,
      productId: cement.id,
      qtyPurchased: 100,
      purchasePrice: 48.00,
      status: "Delivered",
      purchaseDate: new Date(year, 0, 5),
    },
  });

  // Feb
  await prisma.sale.create({
    data: {
      productId: steelRods.id,
      qtySold: 40,
      salePrice: 85.00,
      customerName: "Osei Yaw",
      saleDate: new Date(year, 1, 12),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: temaSteel.id,
      productId: steelRods.id,
      qtyPurchased: 80,
      purchasePrice: 65.00,
      status: "Delivered",
      purchaseDate: new Date(year, 1, 2),
    },
  });

  // Mar
  await prisma.sale.create({
    data: {
      productId: sand.id,
      qtySold: 10,
      salePrice: 550.00,
      customerName: "Ama Serwah",
      saleDate: new Date(year, 2, 20),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: kwameSand.id,
      productId: sand.id,
      qtyPurchased: 15,
      purchasePrice: 420.00,
      status: "Delivered",
      purchaseDate: new Date(year, 2, 10),
    },
  });

  // Apr
  await prisma.sale.create({
    data: {
      productId: roofingSheets.id,
      qtySold: 30,
      salePrice: 150.00,
      customerName: "Kwesi Appiah",
      saleDate: new Date(year, 3, 24),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: accraBuilding.id,
      productId: roofingSheets.id,
      qtyPurchased: 50,
      purchasePrice: 110.00,
      status: "Delivered",
      purchaseDate: new Date(year, 3, 14),
    },
  });

  // May
  await prisma.sale.create({
    data: {
      productId: electricalWire.id,
      qtySold: 15,
      salePrice: 220.00,
      customerName: "Ebenezer Mensah",
      saleDate: new Date(year, 4, 18),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: ghanaCables.id,
      productId: electricalWire.id,
      qtyPurchased: 20,
      purchasePrice: 175.00,
      status: "Delivered",
      purchaseDate: new Date(year, 4, 8),
    },
  });

  // Jun (Current Month Sales / Purchases)
  await prisma.sale.create({
    data: {
      productId: cement.id,
      qtySold: 20,
      salePrice: 62.00,
      customerName: "Yaw Boateng",
      saleDate: new Date(year, 5, 2),
    },
  });
  await prisma.sale.create({
    data: {
      productId: pvcPipe.id,
      qtySold: 10,
      salePrice: 25.00,
      customerName: "Kofi Boateng",
      saleDate: new Date(year, 5, 10),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: accraBuilding.id,
      productId: cement.id,
      qtyPurchased: 150,
      purchasePrice: 48.00,
      status: "Delivered",
      purchaseDate: new Date(year, 5, 1),
    },
  });
  await prisma.purchaseOrder.create({
    data: {
      supplierId: kumasiPlastics.id,
      productId: pvcPipe.id,
      qtyPurchased: 25,
      purchasePrice: 18.00,
      status: "Delivered",
      purchaseDate: new Date(year, 5, 5),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
