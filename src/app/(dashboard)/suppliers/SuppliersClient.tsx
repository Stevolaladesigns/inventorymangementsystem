"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import {
  Truck,
  FileText,
  Clock,
  CircleDollarSign,
  Search,
  Plus,
  Edit2,
  Eye,
  X,
  Phone,
  Mail,
  Tag,
  Calendar,
  CheckCircle,
  ShieldAlert,
  Printer,
  Trash2,
} from "lucide-react";
import { addSupplier, updateSupplier, recordPurchase, deleteSupplier, updatePurchaseOrderStatus } from "../../actions";
import { useUserRole } from "@/hooks/useUserRole";


interface SuppliersClientProps {
  initialSuppliers: any[];
  products: any[];
  initialPurchases: any[];
  initialCategories: string[];
}

export default function SuppliersClient({
  initialSuppliers,
  products,
  initialPurchases,
  initialCategories,
}: SuppliersClientProps) {
  const categories = ["All", ...initialCategories];
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [activeTab, setActiveTab] = useState<"directory" | "purchases">("directory");
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [selectedPODetail, setSelectedPODetail] = useState<any | null>(null);

  // Form states: Supplier
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supCategory, setSupCategory] = useState(initialCategories[0] || "Building Materials");
  const [supStatus, setSupStatus] = useState("Active");

  // Form states: New Purchase Order
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poProductId, setPoProductId] = useState("");
  const [poQty, setPoQty] = useState(10);
  const [poPrice, setPoPrice] = useState(5);
  const [poStatus, setPoStatus] = useState("Delivered");
  const [poError, setPoError] = useState<string | null>(null);
  const [poSuccess, setPoSuccess] = useState<string | null>(null);

  // Stats
  const today = new Date();
  const lowStockCount = products.filter(
    (p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0
  ).length;

  const totalSuppliers = suppliers.length;
  const activeSuppliersCount = suppliers.filter((s) => s.status === "Active").length;
  const pendingDeliveriesCount = purchases.filter(
    (p) => p.status === "Pending" || p.status === "In Transit"
  ).length;
  const totalSpendVal = purchases.reduce((acc, p) => acc + p.qtyPurchased * p.purchasePrice, 0);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter purchase orders
  const filteredPurchases = purchases.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.supplier?.name.toLowerCase().includes(query) ||
      p.product?.name.toLowerCase().includes(query)
    );
  });

  // Reset form
  const resetSupplierForm = () => {
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupCategory("Building Materials");
    setSupStatus("Active");
    setEditingSupplier(null);
  };

  // Trigger Edit Supplier
  const triggerEditSupplier = (s: any) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contactPerson);
    setSupPhone(s.phone);
    setSupEmail(s.email);
    setSupCategory(s.category);
    setSupStatus(s.status);
    setIsSupplierModalOpen(true);
  };

  // Submit Add/Edit Supplier
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        const result = await updateSupplier(editingSupplier.id, {
          name: supName,
          contactPerson: supContact,
          phone: supPhone,
          email: supEmail,
          category: supCategory,
          status: supStatus,
        });
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...result } : s))
        );
      } else {
        const result = await addSupplier({
          name: supName,
          contactPerson: supContact,
          phone: supPhone,
          email: supEmail,
          category: supCategory,
          status: supStatus,
        });
        setSuppliers((prev) => [...prev, result]);
      }
      setIsSupplierModalOpen(false);
      resetSupplierForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier? This will also delete all purchase orders associated with this supplier.")) {
      return;
    }
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      setPurchases((prev) => prev.filter((p) => p.supplierId !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete supplier.");
    }
  };

  // Submit Purchase Order

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoError(null);
    setPoSuccess(null);

    if (!poSupplierId || !poProductId) {
      setPoError("Please select both a supplier and a product.");
      return;
    }

    try {
      const result = await recordPurchase({
        supplierId: poSupplierId,
        productId: poProductId,
        qtyPurchased: poQty,
        purchasePrice: poPrice,
        status: poStatus,
      });

      // Fetch product details for table
      const prod = products.find((p) => p.id === poProductId);
      const sup = suppliers.find((s) => s.id === poSupplierId);

      const fullPurchase = {
        ...result,
        product: prod,
        supplier: sup,
      };

      // Increment local product quantity ONLY if delivered
      if (prod && poStatus === "Delivered") {
        prod.qtyInStock += poQty;
      }

      setPurchases((prev) => [fullPurchase, ...prev]);
      setPoSuccess(
        poStatus === "Delivered"
          ? "Purchase order recorded and stock level incremented!"
          : "Purchase order recorded successfully!"
      );

      // Reset form
      setPoProductId("");
      setPoQty(10);
      setPoPrice(5);
    } catch (err: any) {
      setPoError(err.message || "Failed to log purchase order.");
    }
  };

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      const result = await updatePurchaseOrderStatus(poId, newStatus);
      
      // Find the purchase order in local state
      const oldPO = purchases.find((p) => p.id === poId);
      if (!oldPO) return;
      
      // Update purchases list
      setPurchases((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: newStatus } : p))
      );
      
      // Adjust local product stock level
      const prod = products.find((prod) => prod.id === oldPO.productId);
      if (prod) {
        if (oldPO.status !== "Delivered" && newStatus === "Delivered") {
          prod.qtyInStock += oldPO.qtyPurchased;
        } else if (oldPO.status === "Delivered" && newStatus !== "Delivered") {
          prod.qtyInStock -= oldPO.qtyPurchased;
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to update purchase order status.");
    }
  };

  return (
    <>
      <div className="no-print">
        <Header
            title="Suppliers & Purchases"
            subtitle="Manage vendor relationships and purchase orders"
            lowStockCount={lowStockCount}
            actions={
              canEdit ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab("purchases");
                      setTimeout(() => {
                        document.getElementById("new-po-form")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground text-sm px-4 py-2 rounded-md font-semibold hover:bg-amber-600 transition shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>New Purchase Order</span>
                  </button>
                  <button
                    onClick={() => {
                      resetSupplierForm();
                      setIsSupplierModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Supplier</span>
                  </button>
                </div>
              ) : null
            }
          />
      </div>

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6 no-print">
          {/* Stats Summary Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Suppliers"
              value={totalSuppliers}
              subtitle={`${activeSuppliersCount} active vendors`}
              icon={Truck}
              iconColor="text-primary"
              iconBg="bg-red-50"
            />
            <StatCard
              title="Purchase Orders"
              value={purchases.length}
              subtitle={`${purchases.filter((p) => new Date(p.purchaseDate).getMonth() === today.getMonth()).length} this month`}
              icon={FileText}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatCard
              title="Pending Deliveries"
              value={pendingDeliveriesCount}
              subtitle="Est. arrivals soon"
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Total Spend"
              value={`GHS ${totalSpendVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle="All historical purchases"
              icon={CircleDollarSign}
              iconColor="text-primary"
              iconBg="bg-red-50"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            <button
              onClick={() => {
                setActiveTab("directory");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeTab === "directory"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Suppliers Directory
            </button>
            <button
              onClick={() => {
                setActiveTab("purchases");
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeTab === "purchases"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchase Orders / Restocks
            </button>
          </div>

          {activeTab === "directory" ? (
            /* ================= TAB 1: SUPPLIERS DIRECTORY ================= */
            <div className="flex flex-col gap-5">
              {/* Category selector & Search bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2.5 text-sm text-muted-foreground w-full lg:w-72 shadow-sm">
                  <Search className="w-4 h-4 text-[#8a8278]" />
                  <input
                    type="text"
                    placeholder="Search by name, contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none w-full text-foreground text-sm font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:bg-input"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Suppliers cards */}
              {filteredSuppliers.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground shadow-sm">
                  No suppliers found matching the criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredSuppliers.map((s, idx) => {
                    const ordersCount = purchases.filter((p) => p.supplierId === s.id).length;
                    const ordersValue = purchases
                      .filter((p) => p.supplierId === s.id)
                      .reduce((acc, p) => acc + p.qtyPurchased * p.purchasePrice, 0);

                    // Avatar placeholders
                    const avatarIndex = idx % 8;

                    return (
                      <div
                        key={s.id}
                        className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headings font-bold text-base">
                              {s.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-bold font-headings text-foreground leading-tight truncate">
                                {s.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {s.contactPerson}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-xl flex-shrink-0 border ${
                              s.status === "Active"
                                ? "bg-green-50 text-success border-green-100"
                                : "bg-gray-55 text-muted-foreground border-border"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground">{s.category}</span>
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          <div className="flex items-center gap-2 text-foreground font-semibold">
                            <Phone className="w-3.5 h-3.5 text-[#8a8278] flex-shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-[#8a8278] flex-shrink-0" />
                            <span className="truncate pr-1">{s.email}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground font-medium">Orders</span>
                            <span className="text-base font-bold font-headings text-foreground">
                              {ordersCount}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 text-right sm:text-left">
                            <span className="text-xs text-muted-foreground font-medium">Spend</span>
                            <span className="text-base font-bold font-headings text-primary truncate">
                              GHS {ordersValue.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end border-t border-border pt-3 gap-2 mt-auto">
                          {canEdit && (
                            <button
                              onClick={() => triggerEditSupplier(s)}
                              className="p-1.5 rounded bg-input text-muted-foreground hover:text-foreground hover:bg-border transition"
                              title="Edit Vendor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSupplier(s.id)}
                              className="p-1.5 rounded bg-red-50 text-danger hover:text-[#b0220a] hover:bg-red-100 transition"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ================= TAB 2: PURCHASE ORDERS / RESTOCKS ================= */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Record New Restock Purchase Form — Admin & Manager */}
              {canEdit ? (
                <div
                  id="new-po-form"
                  className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col shadow-sm"
                >
                  <div className="px-5 py-4 border-b border-border bg-white rounded-t-lg">
                    <h3 className="text-lg font-bold font-headings text-foreground">
                      New Purchase Order
                    </h3>
                  </div>

                <form onSubmit={handlePOSubmit} className="p-5 flex flex-col gap-4">
                  {poError && (
                    <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold">
                      {poError}
                    </div>
                  )}
                  {poSuccess && (
                    <div className="bg-green-50 border border-green-200 text-success rounded-md p-3 text-xs font-semibold">
                      {poSuccess}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Select Supplier
                    </label>
                    <select
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="border border-border rounded-md px-3 py-2.5 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    >
                      <option value="">Choose supplier...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Select Product
                    </label>
                    <select
                      value={poProductId}
                      onChange={(e) => setPoProductId(e.target.value)}
                      className="border border-border rounded-md px-3 py-2.5 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    >
                      <option value="">Choose product to restock...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) · Qty: {p.qtyInStock} {p.unit} left
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Qty Purchased
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={poQty}
                        onChange={(e) => setPoQty(parseInt(e.target.value) || 1)}
                        className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Unit Price Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={poPrice}
                        onChange={(e) => setPoPrice(parseFloat(e.target.value) || 0)}
                        className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Delivery Status
                    </label>
                    <select
                      value={poStatus}
                      onChange={(e) => setPoStatus(e.target.value)}
                      className="border border-border rounded-md px-3 py-2.5 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                    >
                      <option value="Delivered">Delivered (Increments Stock)</option>
                      <option value="Pending">Pending Delivery</option>
                      <option value="In Transit">In Transit</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings shadow-sm"
                  >
                    Submit Purchase Order
                  </button>
                </form>
              </div>
              ) : (
                <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col shadow-sm">
                  <div className="px-5 py-4 border-b border-border bg-white rounded-t-lg">
                    <h3 className="text-lg font-bold font-headings text-foreground">Purchase Orders</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">View-only access for Staff accounts</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                      <ShieldAlert className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Admin Access Required</p>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                      Creating purchase orders is restricted to Admin users only.
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Purchase Orders Table list */}
              <div className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border gap-3 bg-white rounded-t-lg">
                  <h3 className="text-lg font-bold font-headings text-foreground">
                    Purchase Order Log
                  </h3>
                  <div className="flex items-center gap-2 bg-input rounded-md px-3 py-2 text-xs text-muted-foreground w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-[#8a8278] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 outline-none w-full font-medium text-foreground text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-input border-b border-border text-left">
                        <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">PO ID</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Supplier</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Qty</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Total Cost</th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Status</th>
                        <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                            No purchase orders logged.
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((p, idx) => {
                          const date = new Date(p.purchaseDate);
                          const formattedDate = date.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });

                          return (
                            <tr
                              key={p.id}
                              className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}
                            >
                              <td className="px-5 py-3.5">
                                <span className="text-xs font-bold text-primary">
                                  PO-{p.id.substring(0, 5).toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-foreground">
                                {p.supplier?.name || "Deleted Supplier"}
                              </td>
                              <td className="px-4 py-3.5 text-muted-foreground font-medium">
                                {p.product?.name || "Deleted Product"}
                              </td>
                              <td className="px-4 py-3.5 text-center text-foreground font-bold">
                                {p.qtyPurchased}
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold font-headings text-foreground">
                                GHS {(p.qtyPurchased * p.purchasePrice).toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {canEdit ? (
                                  <select
                                    value={p.status}
                                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition ${
                                      p.status === "Delivered"
                                        ? "bg-green-50 text-success border-green-100 focus:ring-1 focus:ring-success"
                                        : p.status === "Pending"
                                        ? "bg-red-50 text-danger border border-red-100 focus:ring-1 focus:ring-danger"
                                        : "bg-amber-50 text-secondary border border-amber-100 focus:ring-1 focus:ring-secondary"
                                    }`}
                                  >
                                    <option value="Pending" className="text-black bg-white">Pending</option>
                                    <option value="In Transit" className="text-black bg-white">In Transit</option>
                                    <option value="Delivered" className="text-black bg-white">Delivered</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${
                                      p.status === "Delivered"
                                        ? "bg-green-50 text-success border border-green-100"
                                        : p.status === "Pending"
                                        ? "bg-red-50 text-danger border border-red-100"
                                        : "bg-amber-50 text-secondary border border-amber-100"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => setSelectedPODetail(p)}
                                  className="text-primary hover:underline flex items-center justify-end gap-1 ml-auto text-xs font-semibold"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
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
          )}
        </div>

      {/* MODAL 1: ADD/EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                  placeholder="e.g. Ghana Cables Ltd"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                  placeholder="e.g. John Lamptey"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                    placeholder="e.g. +233 24..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                    placeholder="e.g. info@..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </label>
                  <select
                    value={supStatus}
                    onChange={(e) => setSupStatus(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings shadow-sm"
              >
                {editingSupplier ? "Save Vendor Changes" : "Register Supplier"}
              </button>
            </form>
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
            {/* Close button floating above the receipt card */}
            <button
              onClick={() => setSelectedPODetail(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-200 no-print flex items-center gap-1 text-xs font-semibold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>

            {/* Receipt Card */}
            <div className="printable-receipt-area thermal-receipt w-full relative px-4 py-4 flex flex-col gap-2 text-[11px] leading-snug">
              <div className="receipt-top-edge" />

              {/* Header */}
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

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Receipt Title */}
              <div className="text-center font-bold text-xs tracking-widest text-black font-mono">
                PURCHASE ORDER
              </div>

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Supplier Info */}
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

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Items Section */}
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

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Totals Section */}
              <div className="flex flex-col gap-1 font-mono text-black">
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>Total Spend</span>
                  <span>GHS {(selectedPODetail.qtyPurchased * selectedPODetail.purchasePrice).toFixed(2)}</span>
                </div>
              </div>

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Metadata */}
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

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Footer text */}
              <div className="text-center font-bold tracking-wider text-black font-mono">
                THANK YOU!
              </div>

              {/* Barcode */}
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

            {/* Action Buttons (outside printed area) */}
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
    </>
  );
}
