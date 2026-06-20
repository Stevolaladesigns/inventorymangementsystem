"use client";

import { useState, useEffect } from "react";
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
  Eye,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";
import { deleteSale, deletePurchase } from "../../actions";
import { useUserRole } from "@/hooks/useUserRole";

interface ReportsClientProps {
  sales: any[];
  purchases: any[];
  products: any[];
  company: any;
}

export default function ReportsClient({
  sales: initialSales,
  purchases: initialPurchases,
  products: initialProducts,
  company,
}: ReportsClientProps) {
  const [sales, setSales] = useState(initialSales);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [products, setProducts] = useState(initialProducts);
  const { isAdmin } = useUserRole();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userSession");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  const [selectedPODetail, setSelectedPODetail] = useState<any | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [poToDelete, setPoToDelete] = useState<string | null>(null);

  const runDeleteSale = async (id: string) => {
    try {
      await deleteSale(id);
      const deletedSale = sales.find((s) => s.id === id);
      if (deletedSale) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === deletedSale.productId
              ? { ...p, qtyInStock: p.qtyInStock + deletedSale.qtySold }
              : p
          )
        );
      }
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete sale.");
    }
  };

  const runDeletePurchase = async (id: string) => {
    try {
      await deletePurchase(id);
      const deletedPO = purchases.find((p) => p.id === id);
      if (deletedPO && deletedPO.status === "Delivered") {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === deletedPO.productId
              ? { ...p, qtyInStock: p.qtyInStock - deletedPO.qtyPurchased }
              : p
          )
        );
      }
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete purchase order.");
    }
  };

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
      <div className="no-print">
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
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* PRINT ONLY: COMPANY HEADER */}
        <div className="hidden print:flex flex-col gap-4 border-b-2 border-foreground pb-6 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/company logo.png"
                alt={company?.name || "Bidwest Ghana Ltd"}
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/images/logo.png";
                  e.currentTarget.onerror = (err) => {
                    e.currentTarget.src = "/images/bidwest.png";
                  };
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-black font-headings leading-none">
                  {company?.name || "Bidwest Ghana Ltd"}
                </h1>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Inventory & Procurement Management System
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-gray-600 leading-normal">
              <div className="font-bold text-black text-xs mb-1">HEAD OFFICE</div>
              <div>{company?.address || "Plot 14, Spintex Road, Industrial Area, Accra"}</div>
              <div>{company?.country || "Ghana"}</div>
              <div>Phone: {process.env.NEXT_PUBLIC_COMPANY_PHONE || "+233 599 322 132"}</div>
              <div>Email: {process.env.NEXT_PUBLIC_COMPANY_EMAIL || "info@bidwestghana.com"}</div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-4 pt-4 border-t border-dashed border-gray-300">
            <div>
              <h2 className="text-lg font-bold text-black font-headings uppercase tracking-wider">
                {activeSubTab === "overview" ? "Executive Summary Report" : 
                 activeSubTab === "sales" ? "Sales & Revenue Performance Report" : 
                 activeSubTab === "movement" ? "Stock Movement & Inventory Log" : 
                 activeSubTab === "purchases" ? "Procurement & Purchase Analysis" : "Inventory Report"}
              </h2>
              <p className="text-xs text-gray-600 font-medium mt-1">
                Date Range: {startDate || "All Time"} {endDate ? `to ${endDate}` : ""}
              </p>
            </div>
            <div className="text-right font-mono text-xs text-gray-600">
              <div>Printed By: {currentUser?.name || "Admin Kwame"} ({currentUser?.role || "Inventory Manager"})</div>
              <div>Date Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-border no-print">
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
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm no-print">
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
                            {isAdmin && (
                              <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right no-print">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredSales.length === 0 ? (
                            <tr>
                              <td colSpan={isAdmin ? 8 : 7} className="px-5 py-10 text-center text-muted-foreground">
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
                                {isAdmin && (
                                  <td className="px-5 py-3.5 text-right no-print">
                                    <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                                      <button
                                        onClick={() => setSelectedSaleDetail(s)}
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </button>
                                      <span className="text-border">|</span>
                                      <button
                                        onClick={() => setSaleToDelete(s.id)}
                                        className="text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                                        title="Delete Sale"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                )}
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
                          {isAdmin && (
                            <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right no-print">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredMovements.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 8 : 7} className="px-5 py-10 text-center text-muted-foreground">
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
                              {isAdmin && (
                                <td className="px-5 py-3.5 text-right no-print">
                                  <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                                    <button
                                      onClick={() => {
                                        const actualId = m.id.split("-").slice(1).join("-");
                                        if (m.type === "IN") {
                                          const po = purchases.find((p) => p.id === actualId);
                                          if (po) setSelectedPODetail(po);
                                        } else {
                                          const sale = sales.find((s) => s.id === actualId);
                                          if (sale) setSelectedSaleDetail(sale);
                                        }
                                      }}
                                      className="text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>
                                    <span className="text-border">|</span>
                                    <button
                                      onClick={() => {
                                        const actualId = m.id.split("-").slice(1).join("-");
                                        if (m.type === "IN") {
                                          setPoToDelete(actualId);
                                        } else {
                                          setSaleToDelete(actualId);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                                      title={m.type === "IN" ? "Delete Purchase" : "Delete Sale"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              )}
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
                            {isAdmin && (
                              <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right no-print">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredPurchases.length === 0 ? (
                            <tr>
                              <td colSpan={isAdmin ? 9 : 8} className="px-5 py-10 text-center text-muted-foreground">
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
                                {isAdmin && (
                                  <td className="px-5 py-3.5 text-right no-print">
                                    <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                                      <button
                                        onClick={() => setSelectedPODetail(p)}
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </button>
                                      <span className="text-border">|</span>
                                      <button
                                        onClick={() => setPoToDelete(p.id)}
                                        className="text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                                        title="Delete Purchase"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                )}
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

      {/* DETAIL MODAL: VIEW SALE TRANSACTION */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto receipt-modal-backdrop">
          <style>{`
            @media print {
              @page {
                size: A6 !important;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 105mm !important;
                height: 148mm !important;
                background: white !important;
                overflow: hidden !important;
              }
              body * {
                visibility: hidden !important;
              }
              .printable-receipt-area,
              .printable-receipt-area * {
                visibility: visible !important;
              }
              .printable-receipt-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 105mm !important;
                height: 148mm !important;
                max-height: 148mm !important;
                padding: 6mm !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .receipt-modal-backdrop {
                display: block !important;
                position: static !important;
                background: transparent !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              .receipt-modal-content-wrapper {
                display: block !important;
                position: static !important;
                margin: 0 !important;
                padding: 0 !important;
                width: auto !important;
                max-width: none !important;
              }
            }
          `}</style>
          <div className="relative w-full max-w-sm my-8 flex flex-col items-center receipt-modal-content-wrapper">
            <button
              onClick={() => setSelectedSaleDetail(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-200 no-print flex items-center gap-1 text-xs font-semibold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>

            <div className="printable-receipt-area thermal-receipt w-full relative px-4 py-4 flex flex-col gap-2 text-[11px] leading-snug">
              <div className="receipt-top-edge" />
              <div className="flex flex-col items-center text-center gap-1">
                <img
                  src="/images/logo.png"
                  alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = process.env.NEXT_PUBLIC_LOGO_FALLBACK_URL || "";
                  }}
                />
                <div className="flex flex-col gap-0.5 text-[9.5px] leading-tight text-black font-semibold font-mono">
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_1 || "Head Office"}</div>
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_2 || "Ejisu – Adadientem, Off Kumasi–Accra Road"}</div>
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_3 || "(near CHRISEC)"}</div>
                  <div>Phone: {process.env.NEXT_PUBLIC_COMPANY_PHONE || "+233 599 322 132"}</div>
                  <div>Email: {process.env.NEXT_PUBLIC_COMPANY_EMAIL || "info@bidwestghana.com"}</div>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="text-center font-bold text-xs tracking-widest text-black font-mono">
                CASH RECEIPT
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-black">
                <div className="flex justify-between font-bold border-b border-dashed border-black/30 pb-0.5">
                  <span>Description</span>
                  <span className="text-right">Price</span>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">{selectedSaleDetail.product?.name || "Deleted Product"}</span>
                    <span>GHS {(selectedSaleDetail.qtySold * selectedSaleDetail.salePrice).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-black/60 pl-1">
                    {selectedSaleDetail.qtySold} x GHS {selectedSaleDetail.salePrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-1 font-mono text-black">
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>Total</span>
                  <span>GHS {(selectedSaleDetail.qtySold * selectedSaleDetail.salePrice).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-0.5 text-[10px] text-black/75 leading-tight font-mono">
                <div className="flex justify-between">
                  <span>Invoice No:</span>
                  <span className="font-semibold">SL-{selectedSaleDetail.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-semibold">
                    {new Date(selectedSaleDetail.saleDate).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-semibold">
                    {new Date(selectedSaleDetail.saleDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-semibold">Admin Kwame</span>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="text-center font-bold tracking-wider text-black font-mono">
                THANK YOU!
              </div>

              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="flex justify-center items-end h-5 w-full max-w-[160px] bg-white px-2 select-none">
                  {[2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 2, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3].map((width, idx) => (
                    <div
                      key={idx}
                      className={`h-full ${idx % 2 === 0 ? "bg-black" : "bg-white"}`}
                      style={{ width: `${width}px` }}
                    />
                  ))}
                </div>
                <div className="text-[8.5px] text-center text-black/50 tracking-wider font-mono">
                  {selectedSaleDetail.id.toUpperCase()}
                </div>
              </div>

              <div className="receipt-bottom-edge" />
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mt-6 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-white text-black border border-gray-300 py-2.5 rounded-md hover:bg-gray-50 text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="flex items-center justify-center bg-[#1e1a18] text-white py-2.5 rounded-md hover:bg-[#2e2926] text-xs font-bold transition shadow-sm"
              >
                <span>Close Window</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: VIEW PURCHASE ORDER */}
      {selectedPODetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto receipt-modal-backdrop">
          <style>{`
            @media print {
              @page {
                size: A6 !important;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 105mm !important;
                height: 148mm !important;
                background: white !important;
                overflow: hidden !important;
              }
              body * {
                visibility: hidden !important;
              }
              .printable-receipt-area,
              .printable-receipt-area * {
                visibility: visible !important;
              }
              .printable-receipt-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 105mm !important;
                height: 148mm !important;
                max-height: 148mm !important;
                padding: 6mm !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .receipt-modal-backdrop {
                display: block !important;
                position: static !important;
                background: transparent !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              .receipt-modal-content-wrapper {
                display: block !important;
                position: static !important;
                margin: 0 !important;
                padding: 0 !important;
                width: auto !important;
                max-width: none !important;
              }
            }
          `}</style>
          <div className="relative w-full max-w-sm my-8 flex flex-col items-center receipt-modal-content-wrapper">
            <button
              onClick={() => setSelectedPODetail(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-200 no-print flex items-center gap-1 text-xs font-semibold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>

            <div className="printable-receipt-area thermal-receipt w-full relative px-4 py-4 flex flex-col gap-2 text-[11px] leading-snug">
              <div className="receipt-top-edge" />
              <div className="flex flex-col items-center text-center gap-1">
                <img
                  src="/images/logo.png"
                  alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = process.env.NEXT_PUBLIC_LOGO_FALLBACK_URL || "";
                  }}
                />
                <div className="flex flex-col gap-0.5 text-[9.5px] leading-tight text-black font-semibold font-mono">
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_1 || "Head Office"}</div>
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_2 || "Ejisu – Adadientem, Off Kumasi–Accra Road"}</div>
                  <div>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS_3 || "(near CHRISEC)"}</div>
                  <div>Phone: {process.env.NEXT_PUBLIC_COMPANY_PHONE || "+233 599 322 132"}</div>
                  <div>Email: {process.env.NEXT_PUBLIC_COMPANY_EMAIL || "info@bidwestghana.com"}</div>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="text-center font-bold text-xs tracking-widest text-black font-mono">
                PURCHASE ORDER
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-0.5 font-mono text-black leading-tight text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold">Supplier:</span>
                  <span className="font-semibold text-right">{selectedPODetail.supplier?.name || "Deleted Supplier"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span className="font-semibold text-right">{selectedPODetail.supplier?.contactPerson || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-semibold text-right">{selectedPODetail.supplier?.category || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${selectedPODetail.status === "Delivered" ? "text-green-700" : "text-amber-600"}`}>
                    {selectedPODetail.status}
                  </span>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-black">
                <div className="flex justify-between font-bold border-b border-dashed border-black/30 pb-0.5">
                  <span>Description</span>
                  <span className="text-right">Price</span>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">{selectedPODetail.product?.name || "Deleted Product"}</span>
                    <span>GHS {(selectedPODetail.qtyPurchased * selectedPODetail.purchasePrice).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-black/60 pl-1">
                    {selectedPODetail.qtyPurchased} x GHS {selectedPODetail.purchasePrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-1 font-mono text-black">
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>Total Spend</span>
                  <span>GHS {(selectedPODetail.qtyPurchased * selectedPODetail.purchasePrice).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="flex flex-col gap-0.5 text-[10px] text-black/75 leading-tight font-mono">
                <div className="flex justify-between">
                  <span>PO Number:</span>
                  <span className="font-semibold">PO-{selectedPODetail.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-semibold">
                    {new Date(selectedPODetail.purchaseDate).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-semibold">
                    {new Date(selectedPODetail.purchaseDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buyer:</span>
                  <span className="font-semibold">Admin Kwame</span>
                </div>
              </div>

              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              <div className="text-center font-bold tracking-wider text-black font-mono">
                THANK YOU!
              </div>

              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="flex justify-center items-end h-5 w-full max-w-[160px] bg-white px-2 select-none">
                  {[2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 2, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3].map((width, idx) => (
                    <div
                      key={idx}
                      className={`h-full ${idx % 2 === 0 ? "bg-black" : "bg-white"}`}
                      style={{ width: `${width}px` }}
                    />
                  ))}
                </div>
                <div className="text-[8.5px] text-center text-black/50 tracking-wider font-mono">
                  {selectedPODetail.id.toUpperCase()}
                </div>
              </div>

              <div className="receipt-bottom-edge" />
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mt-6 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-white text-black border border-gray-300 py-2.5 rounded-md hover:bg-gray-50 text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print PO</span>
              </button>
              <button
                onClick={() => setSelectedPODetail(null)}
                className="flex items-center justify-center bg-[#1e1a18] text-white py-2.5 rounded-md hover:bg-[#2e2926] text-xs font-bold transition shadow-sm"
              >
                <span>Close Window</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION POPUP MODAL: DELETE SALE */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 no-print animate-fade-in">
          <div className="bg-white border border-[#e4e4e0] rounded-lg max-w-sm w-full p-6 shadow-xl flex flex-col gap-4 font-body">
            <div className="flex items-center gap-2.5 text-danger font-semibold">
              <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0" />
              <h4 className="text-base font-bold text-foreground font-headings">
                Confirm Deletion
              </h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete this sale? This will restore the product stock level.
            </p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 border border-[#e4e4e0] bg-[#f0f0ec] hover:bg-[#e4e4e0] text-foreground rounded-md text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = saleToDelete;
                  setSaleToDelete(null);
                  await runDeleteSale(id);
                }}
                className="px-4 py-2 bg-primary hover:bg-[#b0220a] text-white rounded-md text-xs font-bold transition shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION POPUP MODAL: DELETE PURCHASE */}
      {poToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 no-print animate-fade-in">
          <div className="bg-white border border-[#e4e4e0] rounded-lg max-w-sm w-full p-6 shadow-xl flex flex-col gap-4 font-body">
            <div className="flex items-center gap-2.5 text-danger font-semibold">
              <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0" />
              <h4 className="text-base font-bold text-foreground font-headings">
                Confirm Deletion
              </h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete this purchase order? This will deduct the product stock level if it was delivered.
            </p>
            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setPoToDelete(null)}
                className="px-4 py-2 border border-[#e4e4e0] bg-[#f0f0ec] hover:bg-[#e4e4e0] text-foreground rounded-md text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = poToDelete;
                  setPoToDelete(null);
                  await runDeletePurchase(id);
                }}
                className="px-4 py-2 bg-primary hover:bg-[#b0220a] text-white rounded-md text-xs font-bold transition shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
