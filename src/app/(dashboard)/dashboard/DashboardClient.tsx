"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import {
  Package,
  AlertCircle,
  TrendingDown,
  ArrowUpRight,
  Search,
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  TrendingUp,
} from "lucide-react";
import { recordSale, recordPurchase, addProduct, updateProduct } from "../../actions";

interface DashboardClientProps {
  initialProducts: any[];
  initialSuppliers: any[];
  initialSales: any[];
  initialPurchases: any[];
}

export default function DashboardClient({
  initialProducts,
  initialSuppliers,
  initialSales,
  initialPurchases,
}: DashboardClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [suppliers] = useState(initialSuppliers);
  const [sales, setSales] = useState(initialSales);
  const [purchases, setPurchases] = useState(initialPurchases);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Form states
  const [saleProduct, setSaleProduct] = useState("");
  const [saleQty, setSaleQty] = useState(1);
  const [saleCustomer, setSaleCustomer] = useState("Cash Customer");
  const [saleError, setSaleError] = useState<string | null>(null);

  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockPrice, setRestockPrice] = useState(50);

  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodCategory, setProdCategory] = useState("Building Materials");
  const [prodQty, setProdQty] = useState(50);
  const [prodMin, setProdMin] = useState(10);
  const [prodUnit, setProdUnit] = useState("pcs");
  const [prodPrice, setProdPrice] = useState(10);
  const [prodDesc, setProdDesc] = useState("");
  const [prodSupplier, setProdSupplier] = useState("");

  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Stats Calculations
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p: any) => p.qtyInStock === 0).length;
  const lowStockCount = products.filter((p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0).length;
  const needsAttentionCount = outOfStockCount + lowStockCount;

  // Filter products by search
  const filteredProducts = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Low Stock Alerts (max 4)
  const lowStockAlerts = products
    .filter((p: any) => p.qtyInStock <= p.minLevel)
    .slice(0, 4);

  // Chart data calculations (Jan - Jun)
  const monthlyData = [
    { name: "Jan", stockIn: 100, stockOut: 50 },
    { name: "Feb", stockIn: 80, stockOut: 40 },
    { name: "Mar", stockIn: 15, stockOut: 10 },
    { name: "Apr", stockIn: 50, stockOut: 30 },
    { name: "May", stockIn: 20, stockOut: 15 },
    { name: "Jun", stockIn: 175, stockOut: 30 }, // populated with seed + recent
  ];

  // Recalculate based on live purchases and sales
  const currentYear = new Date().getFullYear();
  sales.forEach((s) => {
    const d = new Date(s.saleDate);
    if (d.getFullYear() === currentYear) {
      const monthIndex = d.getMonth();
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].stockOut += s.qtySold;
      }
    }
  });

  purchases.forEach((p) => {
    const d = new Date(p.purchaseDate);
    if (d.getFullYear() === currentYear) {
      const monthIndex = d.getMonth();
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].stockIn += p.qtyPurchased;
      }
    }
  });

  // Actions
  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);
    const p = products.find((prod) => prod.id === saleProduct);
    if (!p) return;
    if (p.qtyInStock < saleQty) {
      setSaleError(`Insufficient stock! Only ${p.qtyInStock} ${p.unit} remaining.`);
      return;
    }

    try {
      const result = await recordSale({
        productId: saleProduct,
        qtySold: saleQty,
        salePrice: p.price,
        customerName: saleCustomer,
      });

      // Update state local
      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === saleProduct
            ? { ...prod, qtyInStock: prod.qtyInStock - saleQty }
            : prod
        )
      );
      setSales((prev) => [result, ...prev]);
      setIsSaleModalOpen(false);
      // Reset form
      setSaleQty(1);
    } catch (err: any) {
      setSaleError(err.message || "Failed to record sale");
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    try {
      const result = await recordPurchase({
        supplierId: restockItem.supplierId || suppliers[0]?.id,
        productId: restockItem.id,
        qtyPurchased: restockQty,
        purchasePrice: restockPrice,
      });

      // Update local state
      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === restockItem.id
            ? { ...prod, qtyInStock: prod.qtyInStock + restockQty }
            : prod
        )
      );
      setPurchases((prev) => [result, ...prev]);
      setIsRestockModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Edit mode
        const result = await updateProduct(editingProduct.id, {
          name: prodName,
          sku: prodSku,
          category: prodCategory,
          qtyInStock: prodQty,
          minLevel: prodMin,
          unit: prodUnit,
          price: prodPrice,
          description: prodDesc,
          supplierId: prodSupplier || undefined,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...result } : p))
        );
      } else {
        // Add mode
        const result = await addProduct({
          name: prodName,
          sku: prodSku,
          category: prodCategory,
          qtyInStock: prodQty,
          minLevel: prodMin,
          unit: prodUnit,
          price: prodPrice,
          description: prodDesc,
          supplierId: prodSupplier || undefined,
        });
        setProducts((prev) => [...prev, result]);
      }
      setIsProductModalOpen(false);
      resetProductForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetProductForm = () => {
    setProdName("");
    setProdSku("");
    setProdCategory("Building Materials");
    setProdQty(50);
    setProdMin(10);
    setProdUnit("pcs");
    setProdPrice(10);
    setProdDesc("");
    setProdSupplier(suppliers[0]?.id || "");
    setEditingProduct(null);
  };

  const triggerEdit = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCategory(p.category);
    setProdQty(p.qtyInStock);
    setProdMin(p.minLevel);
    setProdUnit(p.unit);
    setProdPrice(p.price);
    setProdDesc(p.description || "");
    setProdSupplier(p.supplierId || "");
    setIsProductModalOpen(true);
  };

  const triggerSell = (p: any) => {
    setSaleProduct(p.id);
    setIsSaleModalOpen(true);
  };

  const triggerRestock = (p: any) => {
    setRestockItem(p);
    setRestockPrice(Math.round(p.price * 0.75));
    setIsRestockModalOpen(true);
  };

  // Max value in chart for scale calculation
  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.stockIn, d.stockOut)), 1);

  return (
    <>
      <Header
          title="Inventory Dashboard"
          subtitle=""
          lowStockCount={lowStockCount}
          actions={
            <>
              <button
                onClick={() => {
                  if (products.length > 0) {
                    setSaleProduct(products[0].id);
                  }
                  setIsSaleModalOpen(true);
                }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground text-sm px-4 py-2 rounded-md font-semibold hover:bg-amber-600 transition"
              >
                <TrendingDown className="w-4 h-4 flex-shrink-0" />
                <span>Record Sale</span>
              </button>
            </>
          }
        />

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Products"
              value={totalProducts}
              subtitle="+5 added this week"
              icon={Package}
              iconColor="text-primary"
              iconBg="bg-red-50"
            />
            <StatCard
              title="Needs Attention"
              value={needsAttentionCount}
              subtitle="Stock running low"
              icon={AlertCircle}
              iconColor="text-secondary"
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Out of Stock"
              value={outOfStockCount}
              subtitle="Immediate reorder needed"
              icon={AlertCircle}
              iconColor="text-red-600"
              iconBg="bg-red-100"
            />
            <StatCard
              title="Spend MTD"
              value={`GHS ${purchases.reduce((acc, p) => acc + p.qtyPurchased * p.purchasePrice, 0).toLocaleString()}`}
              subtitle="Material restock cost"
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
          </div>

          {/* Charts & Alerts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-headings text-foreground">
                    Stock Movement
                  </h3>
                  <p className="text-xs text-muted-foreground">Monthly aggregate quantities</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    <span>Stock In</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
                    <span>Stock Out</span>
                  </div>
                </div>
              </div>

              {/* Chart Graphics */}
              <div className="flex items-end gap-3 h-48 pt-4">
                {monthlyData.map((month) => {
                  const inHeight = (month.stockIn / maxVal) * 100;
                  const outHeight = (month.stockOut / maxVal) * 100;

                  return (
                    <div
                      key={month.name}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    >
                      <div className="flex items-end gap-1 w-full justify-center h-[140px]">
                        <div
                          className="w-5 rounded-t-sm bg-primary transition-all duration-500"
                          style={{ height: `${Math.max(inHeight, 4)}%` }}
                          title={`Stock In: ${month.stockIn}`}
                        />
                        <div
                          className="w-5 rounded-t-sm bg-secondary transition-all duration-500"
                          style={{ height: `${Math.max(outHeight, 4)}%` }}
                          title={`Stock Out: ${month.stockOut}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {month.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Alerts Side Column */}
            <div className="bg-card rounded-lg border border-border p-5 flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold font-headings text-foreground">
                  Low Stock Alerts
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-xl bg-danger text-white">
                  {needsAttentionCount} items
                </span>
              </div>

              <div className="flex flex-col divide-y divide-border">
                {lowStockAlerts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    All stock levels are above threshold!
                  </div>
                ) : (
                  lowStockAlerts.map((p) => {
                    const ratio = p.qtyInStock / p.minLevel;
                    const percent = Math.min(ratio * 100, 100);
                    const isCritical = p.qtyInStock === 0;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isCritical ? "bg-danger" : "bg-secondary"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {p.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {p.sku}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.category}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 w-24">
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <span
                              className={`font-bold ${
                                isCritical ? "text-danger" : "text-secondary"
                              }`}
                            >
                              {p.qtyInStock}
                            </span>
                            <span>/{p.minLevel} {p.unit}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCritical ? "bg-danger" : "bg-secondary"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => triggerRestock(p)}
                          className="flex items-center gap-0.5 text-xs text-primary font-bold px-2 py-1 border border-primary rounded-md hover:bg-red-50 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Product Inventory Table block */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border gap-3 bg-white">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Product Inventory
              </h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-input rounded-md px-3 py-2 text-sm text-muted-foreground flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-[#8a8278] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none w-full sm:w-48 font-medium text-foreground text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    resetProductForm();
                    setIsProductModalOpen(true);
                  }}
                  className="flex items-center gap-1 bg-primary text-white text-sm px-3 py-2 rounded-md font-medium hover:bg-[#b0220a] transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-input border-b border-border text-left">
                    <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">
                      Qty In Stock
                    </th>
                    <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">
                      Min Level
                    </th>
                    <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                        No products found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const isOutOfStock = p.qtyInStock === 0;
                      const isLowStock = p.qtyInStock <= p.minLevel;

                      return (
                        <tr
                          key={p.id}
                          className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.sku}</div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">{p.category}</td>
                          <td className="px-4 py-3.5 text-right font-headings font-bold text-foreground text-base">
                            {p.qtyInStock} {p.unit}
                          </td>
                          <td className="px-4 py-3.5 text-right text-muted-foreground">
                            {p.minLevel} {p.unit}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-red-50 text-danger border border-red-100">
                                Critical
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-secondary border border-amber-100">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-green-50 text-success border border-green-100">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                              <button
                                onClick={() => triggerEdit(p)}
                                className="text-primary hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={() => triggerSell(p)}
                                disabled={isOutOfStock}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                              >
                                Sell
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* MODAL 1: RECORD SALE */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Record New Sale
              </h3>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSale} className="p-5 flex flex-col gap-4">
              {saleError && (
                <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold">
                  {saleError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Select Product
                </label>
                <select
                  value={saleProduct}
                  onChange={(e) => setSaleProduct(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none"
                  required
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.qtyInStock === 0}>
                      {p.name} ({p.sku}) - Qty: {p.qtyInStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Quantity to Sell
                </label>
                <input
                  type="number"
                  min="1"
                  value={saleQty}
                  onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  placeholder="e.g. Kofi Boateng"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings"
              >
                Record Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTOCK / PURCHASE ORDER */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Restock Product
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="p-5 flex flex-col gap-4">
              <div className="bg-muted/40 p-3 rounded-md flex flex-col gap-1 border border-border mb-1 text-xs">
                <div>
                  <span className="font-bold">Product:</span> {restockItem.name} ({restockItem.sku})
                </div>
                <div>
                  <span className="font-bold">Current Stock:</span> {restockItem.qtyInStock} {restockItem.unit}
                </div>
                <div>
                  <span className="font-bold">Supplier:</span> {restockItem.supplier?.name || "None"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Quantity Purchased
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Unit Purchase Cost (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockPrice}
                  onChange={(e) => setRestockPrice(parseFloat(e.target.value) || 0)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-success text-white py-2.5 rounded-md font-bold hover:bg-green-700 transition mt-2 text-sm font-headings"
              >
                Record Restock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full shadow-lg overflow-hidden my-8 flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    placeholder="e.g. PVC Pipe"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    SKU / Code
                  </label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    placeholder="e.g. PVC-075"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  >
                    <option value="Building Materials">Building Materials</option>
                    <option value="Metals">Metals</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Roofing">Roofing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Paints & Finishes">Paints & Finishes</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Supplier
                  </label>
                  <select
                    value={prodSupplier}
                    onChange={(e) => setProdSupplier(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  >
                    <option value="">No Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Initial Stock Level
                  </label>
                  <input
                    type="number"
                    value={prodQty}
                    onChange={(e) => setProdQty(parseInt(e.target.value) || 0)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={prodMin}
                    onChange={(e) => setProdMin(parseInt(e.target.value) || 10)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Stock Unit
                  </label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    placeholder="pcs, bags, rolls..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Selling Price (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Description
                </label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none h-20 focus:bg-white resize-none"
                  placeholder="Product specifications..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings"
              >
                {editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
