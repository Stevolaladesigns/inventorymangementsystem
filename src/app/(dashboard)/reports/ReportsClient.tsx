"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ChevronDown,
  Printer,
  Download,
  Calendar,
  Search,
} from "lucide-react";

interface ReportsClientProps {
  sales: any[];
  purchases: any[];
  products: any[];
}

export default function ReportsClient({ sales, purchases, products }: ReportsClientProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "sales" | "movement" | "purchases">("overview");

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFirstDayOfMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState<string>("");

  const matchFilters = (date: Date | string, name: string, category: string) => {
    const itemDate = new Date(date);
    
    // Date Range Filter
    if (startDate) {
      const start = new Date(startDate + "T00:00:00");
      if (itemDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate + "T23:59:59");
      if (itemDate > end) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = name?.toLowerCase().includes(q);
      const matchesCategory = category?.toLowerCase().includes(q);
      if (!matchesName && !matchesCategory) return false;
    }

    return true;
  };

  // Format date
  const today = new Date();
  const currentYear = today.getFullYear();

  // Metrics
  const lowStockCount = products.filter((p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0).length;

  const totalRevenue = sales.reduce((acc, s) => acc + s.qtySold * s.salePrice, 0);
  const totalSalesCount = sales.reduce((acc, s) => acc + s.qtySold, 0);
  const totalSpend = purchases.reduce((acc, p) => acc + p.qtyPurchased * p.purchasePrice, 0);
  const grossProfit = totalRevenue - totalSpend;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown calculations (Jan - Jun)
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyRevenue = [0, 0, 0, 0, 0, 0];
  const monthlySpend = [0, 0, 0, 0, 0, 0];

  sales.forEach((s) => {
    const d = new Date(s.saleDate);
    if (d.getFullYear() === currentYear) {
      const m = d.getMonth();
      if (m >= 0 && m < 6) {
        monthlyRevenue[m] += s.qtySold * s.salePrice;
      }
    }
  });

  purchases.forEach((p) => {
    const d = new Date(p.purchaseDate);
    if (d.getFullYear() === currentYear) {
      const m = d.getMonth();
      if (m >= 0 && m < 6) {
        monthlySpend[m] += p.qtyPurchased * p.purchasePrice;
      }
    }
  });

  // Calculate Category Sales Breakdowns
  const categoriesMap: { [key: string]: number } = {};
  sales.forEach((s) => {
    const category = s.product?.category || "Other";
    categoriesMap[category] = (categoriesMap[category] || 0) + s.qtySold * s.salePrice;
  });

  const categoryBreakdown = Object.keys(categoriesMap).map((cat) => {
    const rev = categoriesMap[cat];
    const percentage = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
    return {
      category: cat,
      revenue: rev,
      percentage,
    };
  });

  // Sort by revenue descending
  categoryBreakdown.sort((a, b) => b.revenue - a.revenue);

  // Top Products calculations
  const productsMap: { [key: string]: { qty: number; revenue: number; product: any } } = {};
  sales.forEach((s) => {
    const prodId = s.productId;
    if (!productsMap[prodId]) {
      productsMap[prodId] = {
        qty: 0,
        revenue: 0,
        product: s.product,
      };
    }
    productsMap[prodId].qty += s.qtySold;
    productsMap[prodId].revenue += s.qtySold * s.salePrice;
  });

  const topProducts = Object.keys(productsMap).map((prodId) => {
    const item = productsMap[prodId];
    return {
      id: prodId,
      name: item.product?.name || "Deleted Product",
      sku: item.product?.sku || "N/A",
      category: item.product?.category || "N/A",
      qtySold: item.qty,
      revenue: item.revenue,
      qtyInStock: item.product?.qtyInStock || 0,
      minLevel: item.product?.minLevel || 0,
    };
  });

  // Sort top products by revenue descending
  topProducts.sort((a, b) => b.revenue - a.revenue);

  // Maximum value for chart scaling
  const maxChartVal = Math.max(...monthlyRevenue, ...monthlySpend, 100);

  // ================= SALES REPORT TAB LOGIC =================
  const filteredSales = sales.filter((s) =>
    matchFilters(s.saleDate, s.product?.name, s.product?.category)
  );
  const filteredSalesRevenue = filteredSales.reduce((acc, s) => acc + s.qtySold * s.salePrice, 0);
  const filteredSalesCount = filteredSales.reduce((acc, s) => acc + s.qtySold, 0);

  // ================= PURCHASE ANALYSIS TAB LOGIC =================
  const filteredPurchases = purchases.filter((p) =>
    matchFilters(p.purchaseDate, p.product?.name, p.product?.category)
  );
  const filteredPurchasesSpend = filteredPurchases.reduce((acc, p) => acc + p.qtyPurchased * p.purchasePrice, 0);
  const filteredPurchasesCount = filteredPurchases.reduce((acc, p) => acc + p.qtyPurchased, 0);

  // ================= STOCK MOVEMENT LOG LOGIC =================
  const movements = [
    ...sales.map((s) => ({
      id: `sale-${s.id}`,
      date: new Date(s.saleDate),
      productName: s.product?.name || "Deleted Product",
      sku: s.product?.sku || "N/A",
      category: s.product?.category || "N/A",
      type: "OUT",
      quantity: s.qtySold,
      unit: s.product?.unit || "pcs",
      reference: s.customerName || "Cash Customer",
      value: s.qtySold * s.salePrice,
    })),
    ...purchases.map((p) => ({
      id: `purchase-${p.id}`,
      date: new Date(p.purchaseDate),
      productName: p.product?.name || "Deleted Product",
      sku: p.product?.sku || "N/A",
      category: p.product?.category || "N/A",
      type: "IN",
      quantity: p.qtyPurchased,
      unit: p.product?.unit || "pcs",
      reference: p.supplier?.name || "Unknown Supplier",
      value: p.qtyPurchased * p.purchasePrice,
    })),
  ];

  const filteredMovements = movements
    .filter((m) => matchFilters(m.date, m.productName, m.category))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <Header
          title="Reports & Analytics"
          subtitle="Business insights and inventory performance"
          lowStockCount={lowStockCount}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-border bg-card text-foreground text-sm px-3 py-2 rounded-md font-semibold hover:bg-input transition shadow-sm"
              >
                <Printer className="w-4 h-4 text-[#8a8278]" />
                <span>Print</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          }
        />

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            <button
              onClick={() => setActiveSubTab("overview")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSubTab("sales")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "sales"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sales Report
            </button>
            <button
              onClick={() => setActiveSubTab("movement")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "movement"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Stock Movement
            </button>
            <button
              onClick={() => setActiveSubTab("purchases")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "purchases"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchase Analysis
            </button>
          </div>

          {activeSubTab === "overview" && (
            /* ================= OVERVIEW TAB ================= */
            <div className="flex flex-col gap-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Revenue (YTD)"
                  value={`GHS ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  subtitle="+18.4% vs last year"
                  icon={TrendingUp}
                  iconColor="text-primary"
                  iconBg="bg-red-50"
                />
                <StatCard
                  title="Total Sales (YTD)"
                  value={totalSalesCount}
                  subtitle="Units of materials sold"
                  icon={ShoppingCart}
                  iconColor="text-green-600"
                  iconBg="bg-green-50"
                />
                <StatCard
                  title="Cost of Goods Sold"
                  value={`GHS ${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  subtitle="Material purchase expense"
                  icon={DollarSign}
                  iconColor="text-primary"
                  iconBg="bg-red-50"
                />
                <StatCard
                  title="Gross Profit Margin"
                  value={`${profitMargin.toFixed(1)}%`}
                  subtitle="Net margin ratio"
                  icon={ArrowUpRight}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Comparative Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold font-headings text-foreground">
                      Financial Comparison
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Monthly revenue vs procurement spend
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold self-end">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                      <span>Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
                      <span>Spend</span>
                    </div>
                  </div>

                  <div className="flex items-end gap-3 h-56 pt-4 border-b border-border">
                    {monthsList.map((month, idx) => {
                      const revVal = monthlyRevenue[idx];
                      const spVal = monthlySpend[idx];
                      const revHeight = (revVal / maxChartVal) * 100;
                      const spHeight = (spVal / maxChartVal) * 100;

                      return (
                        <div
                          key={month}
                          className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                        >
                          <div className="flex items-end gap-1 w-full justify-center h-[160px]">
                            <div
                              className="w-6 rounded-t-sm bg-primary hover:opacity-90 transition-all duration-300"
                              style={{ height: `${Math.max(revHeight, 3)}%` }}
                              title={`Revenue: GHS ${revVal.toFixed(2)}`}
                            />
                            <div
                              className="w-6 rounded-t-sm bg-secondary hover:opacity-90 transition-all duration-300"
                              style={{ height: `${Math.max(spHeight, 3)}%` }}
                              title={`Spend: GHS ${spVal.toFixed(2)}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-semibold mt-1">
                            {month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Revenue Breakdown */}
                <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold font-headings text-foreground">
                      Revenue by Category
                    </h3>
                    <p className="text-xs text-muted-foreground">Percentage of total revenues</p>
                  </div>

                  <div className="flex flex-col gap-4 overflow-y-auto max-h-56">
                    {categoryBreakdown.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No sales recorded yet.
                      </div>
                    ) : (
                      categoryBreakdown.map((item) => (
                        <div key={item.category} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{item.category}</span>
                            <span className="font-bold text-primary">
                              GHS {item.revenue.toLocaleString()} ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Top Selling Products List */}
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-white rounded-t-lg">
                  <h3 className="text-lg font-bold font-headings text-foreground">
                    Top Selling Products
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-input border-b border-border text-left">
                        <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Category</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Units Sold</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Revenue</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">In Stock</th>
                        <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topProducts.slice(0, 5).map((p, idx) => {
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
                            <td className="px-4 py-3.5 text-muted-foreground font-medium">
                              {p.category}
                            </td>
                            <td className="px-4 py-3.5 text-center text-foreground font-bold">
                              {p.qtySold}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold font-headings text-primary text-base">
                              GHS {p.revenue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-foreground font-semibold">
                              {p.qtyInStock}
                            </td>
                            <td className="px-5 py-3.5 text-center">
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab !== "overview" && (
            <div className="flex flex-col gap-6">
              {/* Filter Toolbar */}
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-muted-foreground w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#8a8278] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by product or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 outline-none w-full text-foreground text-sm font-semibold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5c5450]">
                    <div className="flex items-center gap-1.5 bg-input border border-border rounded-md px-2.5 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none outline-none font-semibold text-foreground text-xs cursor-pointer"
                      />
                    </div>
                    <span>to</span>
                    <div className="flex items-center gap-1.5 bg-input border border-border rounded-md px-2.5 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none outline-none font-semibold text-foreground text-xs cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setStartDate(getTodayString());
                      setEndDate(getTodayString());
                    }}
                    className="text-xs font-bold px-3 py-2 rounded border border-border bg-card text-[#5c5450] hover:bg-input transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setStartDate(getFirstDayOfMonthString());
                      setEndDate(getTodayString());
                    }}
                    className="text-xs font-bold px-3 py-2 rounded border border-border bg-card text-[#5c5450] hover:bg-input transition"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setSearchQuery("");
                    }}
                    className="text-xs font-bold px-3 py-2 rounded border border-border bg-card text-[#5c5450] hover:bg-input hover:text-primary transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* TAB 1: SALES REPORT */}
              {activeSubTab === "sales" && (
                <div className="flex flex-col gap-5">
                  {/* KPI Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Total Revenue (Filtered)</span>
                      <span className="text-2xl font-bold font-headings text-primary">GHS {filteredSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Total Units Sold (Filtered)</span>
                      <span className="text-2xl font-bold font-headings text-foreground">{filteredSalesCount} units</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-input border-b border-border text-left">
                            <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Date</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Category</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Qty Sold</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Unit Price</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Total Revenue</th>
                            <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Customer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredSales.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                                No sales records found for this criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredSales.map((s, idx) => (
                              <tr key={s.id} className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}>
                                <td className="px-5 py-3.5 text-xs text-muted-foreground font-semibold whitespace-nowrap">
                                  {new Date(s.saleDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="font-semibold text-foreground">{s.product?.name || "Deleted Product"}</div>
                                  <div className="text-xs text-muted-foreground">{s.product?.sku || "N/A"}</div>
                                </td>
                                <td className="px-4 py-3.5 text-muted-foreground font-medium">{s.product?.category || "N/A"}</td>
                                <td className="px-4 py-3.5 text-center text-foreground font-bold">{s.qtySold}</td>
                                <td className="px-4 py-3.5 text-right text-muted-foreground">GHS {s.salePrice.toFixed(2)}</td>
                                <td className="px-4 py-3.5 text-right font-bold text-primary">GHS {(s.qtySold * s.salePrice).toFixed(2)}</td>
                                <td className="px-5 py-3.5 font-medium text-foreground">{s.customerName}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STOCK MOVEMENT */}
              {activeSubTab === "movement" && (
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-input border-b border-border text-left">
                          <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Date</th>
                          <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                          <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Category</th>
                          <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Type</th>
                          <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Qty Changed</th>
                          <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Reference</th>
                          <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredMovements.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                              No stock movements found for this criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredMovements.map((m, idx) => (
                            <tr key={m.id} className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground font-semibold whitespace-nowrap">
                                {m.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-foreground">{m.productName}</div>
                                <div className="text-xs text-muted-foreground">{m.sku}</div>
                              </td>
                              <td className="px-4 py-3.5 text-muted-foreground font-medium">{m.category}</td>
                              <td className="px-4 py-3.5 text-center">
                                {m.type === "IN" ? (
                                  <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-green-50 text-success border border-green-100">
                                    IN
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-red-50 text-danger border border-red-100">
                                    OUT
                                  </span>
                                )}
                              </td>
                              <td className={`px-4 py-3.5 text-right font-bold text-base ${m.type === "IN" ? "text-success" : "text-danger"}`}>
                                {m.type === "IN" ? "+" : "-"}{m.quantity} <span className="text-xs text-muted-foreground font-normal">{m.unit}</span>
                              </td>
                              <td className="px-4 py-3.5 font-medium text-foreground">{m.reference}</td>
                              <td className="px-5 py-3.5 text-right font-semibold text-foreground">GHS {m.value.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PURCHASE ANALYSIS */}
              {activeSubTab === "purchases" && (
                <div className="flex flex-col gap-5">
                  {/* KPI Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Total Procurement Spend (Filtered)</span>
                      <span className="text-2xl font-bold font-headings text-[#d42b0f]">GHS {filteredPurchasesSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Total Units Purchased (Filtered)</span>
                      <span className="text-2xl font-bold font-headings text-foreground">{filteredPurchasesCount} units</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-input border-b border-border text-left">
                            <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Date</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Category</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Qty Purchased</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Unit Cost</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Total Cost</th>
                            <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Supplier</th>
                            <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredPurchases.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                                No purchases found for this criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredPurchases.map((p, idx) => (
                              <tr key={p.id} className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}>
                                <td className="px-5 py-3.5 text-xs text-muted-foreground font-semibold whitespace-nowrap">
                                  {new Date(p.purchaseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="font-semibold text-foreground">{p.product?.name || "Deleted Product"}</div>
                                  <div className="text-xs text-muted-foreground">{p.product?.sku || "N/A"}</div>
                                </td>
                                <td className="px-4 py-3.5 text-muted-foreground font-medium">{p.product?.category || "N/A"}</td>
                                <td className="px-4 py-3.5 text-center text-foreground font-bold">{p.qtyPurchased}</td>
                                <td className="px-4 py-3.5 text-right text-muted-foreground">GHS {p.purchasePrice.toFixed(2)}</td>
                                <td className="px-4 py-3.5 text-right font-bold text-foreground">GHS {(p.qtyPurchased * p.purchasePrice).toFixed(2)}</td>
                                <td className="px-4 py-3.5 font-medium text-foreground">{p.supplier?.name || "Unknown Supplier"}</td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-xl text-xs font-semibold ${
                                    p.status === "Delivered"
                                      ? "bg-green-50 text-success border border-green-100"
                                      : p.status === "Pending"
                                      ? "bg-amber-50 text-secondary border border-amber-100"
                                      : "bg-red-50 text-danger border border-red-100"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </>
  );
}
