"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import {
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  Clock,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  Eye,
  Printer,
  Download,
  User,
  ShieldAlert,
} from "lucide-react";
import { recordSale, deleteSale } from "../../actions";
import { useUserRole } from "@/hooks/useUserRole";


interface SalesClientProps {
  initialSales: any[];
  products: any[];
}

export default function SalesClient({ initialSales, products }: SalesClientProps) {
  const [sales, setSales] = useState(initialSales);
  const { isAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");


  // Cart state
  const [customerName, setCustomerName] = useState("Cash Customer");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQty, setSaleQty] = useState(1);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);

  // Modals state
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);


  // Helper stats
  const lowStockCount = products.filter(
    (p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0
  ).length;

  // Calculate stats based on actual data
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const salesToday = sales.filter((s) => new Date(s.saleDate) >= startOfToday);
  const totalSalesTodayVal = salesToday.reduce((acc, s) => acc + s.qtySold * s.salePrice, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const salesThisMonth = sales.filter((s) => new Date(s.saleDate) >= startOfMonth);
  const totalSalesThisMonthVal = salesThisMonth.reduce((acc, s) => acc + s.qtySold * s.salePrice, 0);

  // Filter Sales list
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Add item to cart
  const handleAddToCart = () => {
    setSaleError(null);
    setSaleSuccess(null);

    if (!selectedProductId || !selectedProduct) {
      setSaleError("Please select a product.");
      return;
    }

    if (saleQty <= 0) {
      setSaleError("Quantity must be greater than zero.");
      return;
    }

    // Check inventory vs current cart qty + proposed qty
    const existingCartItem = cartItems.find((item) => item.productId === selectedProductId);
    const existingQty = existingCartItem ? existingCartItem.qty : 0;
    const totalProposedQty = existingQty + saleQty;

    if (selectedProduct.qtyInStock < totalProposedQty) {
      setSaleError(
        `Insufficient stock! Only ${selectedProduct.qtyInStock} ${selectedProduct.unit} available in total. (You have ${existingQty} in cart)`
      );
      return;
    }

    if (existingCartItem) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === selectedProductId ? { ...item, qty: totalProposedQty } : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          unit: selectedProduct.unit,
          price: selectedProduct.price,
          qty: saleQty,
        },
      ]);
    }

    // Reset inputs
    setSaleQty(1);
    setSelectedProductId("");
  };

  // Update cart item quantity
  const updateCartQty = (productId: string, increment: boolean) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newQty = increment ? item.qty + 1 : item.qty - 1;

    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }

    if (increment && prod.qtyInStock < newQty) {
      setSaleError(`Cannot add more. Only ${prod.qtyInStock} in stock.`);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: newQty } : i))
    );
  };

  // Remove cart item
  const removeCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Checkout Cart (Submit Sale)
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setSaleError("Your cart is empty.");
      return;
    }

    setSaleError(null);
    setSaleSuccess(null);

    try {
      const recordedSales = [];

      for (const item of cartItems) {
        const result = await recordSale({
          productId: item.productId,
          qtySold: item.qty,
          salePrice: item.price,
          customerName: customerName,
        });
        recordedSales.push(result);
      }

      // Refresh products & local sales list
      // Since recordSale returns the newly created sale, we add them to top
      const fullRecordedSales = recordedSales.map((newSale) => {
        const prod = products.find((p) => p.id === newSale.productId);
        // deduct local quantity
        if (prod) {
          prod.qtyInStock -= newSale.qtySold;
        }
        return {
          ...newSale,
          product: prod,
        };
      });

      setSales((prev) => [...fullRecordedSales, ...prev]);
      setCartItems([]);
      setCustomerName("Cash Customer");
      setSaleSuccess("Sale transaction recorded successfully!");
    } catch (err: any) {
      setSaleError(err.message || "Failed to submit sale checkout.");
    }
  };

  const runDeleteSale = async (id: string) => {
    setSaleError(null);
    setSaleSuccess(null);
    try {
      await deleteSale(id);
      const deletedSale = sales.find((s) => s.id === id);
      if (deletedSale) {
        const prod = products.find((p) => p.id === deletedSale.productId);
        if (prod) {
          prod.qtyInStock += deletedSale.qtySold;
        }
      }
      setSales((prev) => prev.filter((s) => s.id !== id));
      setSaleSuccess("Sale deleted and product stock restored successfully!");
    } catch (err: any) {
      setSaleError(err.message || "Failed to delete sale.");
    }
  };


  const cartTotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);


  return (
    <>
      <div className="no-print">
        <Header
            title="Sales"
            subtitle="Record sales and track transactions"
            lowStockCount={lowStockCount}
            actions={
              <button
                onClick={() => {
                  const recentElement = document.getElementById("record-sale-form");
                  recentElement?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Sale</span>
              </button>
            }
          />
      </div>

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6 no-print">
          {/* Stats Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sales Today"
              value={`GHS ${totalSalesTodayVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle={`${salesToday.length} transactions today`}
              icon={ShoppingCart}
              iconColor="text-primary"
              iconBg="bg-red-50"
            />
            <StatCard
              title="This Month"
              value={`GHS ${totalSalesThisMonthVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle={`${salesThisMonth.length} transactions`}
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatCard
              title="Refunds Today"
              value="GHS 0.00"
              subtitle="0 refunded transactions"
              icon={RotateCcw}
              iconColor="text-primary"
              iconBg="bg-red-50"
            />
            <StatCard
              title="Pending Payments"
              value="GHS 0.00"
              subtitle="All payments completed"
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
          </div>

          {/* Interactive POS Cart & Transaction logs split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Record New Sale Form/Cart panel */}
            <div
              id="record-sale-form"
              className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col shadow-sm"
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white rounded-t-lg">
                <h3 className="text-lg font-bold font-headings text-foreground">
                  Record New Sale
                </h3>
                <span className="text-xs bg-amber-50 text-secondary border border-amber-200 px-2.5 py-1 rounded-xl font-semibold">
                  Draft POS
                </span>
              </div>

              <div className="px-5 py-5 flex flex-col gap-4 flex-1">
                {saleError && (
                  <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold">
                    {saleError}
                  </div>
                )}
                {saleSuccess && (
                  <div className="bg-green-50 border border-green-200 text-success rounded-md p-3 text-xs font-semibold">
                    {saleSuccess}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Customer Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-border rounded-md pl-3 pr-10 py-2.5 text-sm font-semibold bg-input text-foreground outline-none focus:bg-white focus:border-primary transition"
                      placeholder="e.g. Kofi Boateng"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8278]" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Add Product to Cart
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="col-span-2 border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.qtyInStock <= 0}>
                          {p.name} ({p.sku}) · GHS {p.price.toFixed(2)} ({p.qtyInStock} left)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={saleQty}
                      onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold text-center outline-none focus:bg-white transition"
                      placeholder="Qty"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full bg-[#1e1a18] text-white hover:bg-[#2e2926] text-xs font-bold py-2 rounded-md transition shadow-sm mt-1"
                  >
                    Add Cart Item
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Cart Items
                    </span>
                    <span className="text-xs text-primary font-bold">
                      {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-8 text-center text-xs text-muted-foreground bg-background/50">
                      Your checkout cart is empty. Add materials above.
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                      <div className="grid bg-input px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border" style={{ gridTemplateColumns: "1fr 50px 80px 30px" }}>
                        <span>Product</span>
                        <span className="text-center">Qty</span>
                        <span className="text-right">Subtotal</span>
                        <span></span>
                      </div>
                      <div className="divide-y divide-border bg-white">
                        {cartItems.map((item) => (
                          <div
                            key={item.productId}
                            className="grid items-center px-3 py-2.5 text-xs text-foreground font-body"
                            style={{ gridTemplateColumns: "1fr 50px 80px 30px" }}
                          >
                            <div>
                              <div className="font-semibold truncate pr-2">{item.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                GHS {item.price.toFixed(2)} ea
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.productId, false)}
                                className="w-4 h-4 rounded bg-input flex items-center justify-center text-muted-foreground hover:bg-border"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-bold">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.productId, true)}
                                className="w-4 h-4 rounded bg-input flex items-center justify-center text-muted-foreground hover:bg-border"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="text-right font-bold font-headings">
                              GHS {(item.qty * item.price).toFixed(2)}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.productId)}
                              className="text-muted-foreground hover:text-danger flex justify-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-border pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-muted-foreground uppercase text-xs">Total Amount</span>
                    <span className="text-xl font-bold font-headings text-primary">
                      GHS {cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-primary text-white py-3 rounded-md font-bold hover:bg-[#b0220a] transition text-sm font-headings disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-sm"
                  >
                    Submit Checkout Sale
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Sales transactions list */}
            <div className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border gap-3 bg-white rounded-t-lg">
                <h3 className="text-lg font-bold font-headings text-foreground">
                  Recent Sales Log
                </h3>
                <div className="flex items-center gap-2 bg-input rounded-md px-3 py-2 text-xs text-muted-foreground w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-[#8a8278] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search sales..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none w-full font-medium text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-input border-b border-border text-left">
                      <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Sale ID</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Customer</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Product Item</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Qty</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Total</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Date</th>
                      <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                          No sales transactions logged.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((s, idx) => {
                        const date = new Date(s.saleDate);
                        const formattedTime = date.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                        return (
                          <tr
                            key={s.id}
                            className={idx % 2 === 0 ? "bg-card" : "bg-background/40"}
                          >
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-bold text-primary">
                                SL-{s.id.substring(0, 5).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-foreground">
                              {s.customerName}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground font-medium">
                              {s.product?.name || "Deleted Product"}
                            </td>
                            <td className="px-4 py-3.5 text-center text-foreground font-bold">
                              {s.qtySold}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold font-headings text-foreground">
                              GHS {(s.qtySold * s.salePrice).toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                              {formattedTime}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
                                <button
                                  onClick={() => setSelectedSaleDetail(s)}
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => setSaleToDelete(s.id)}
                                    className="text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 ml-2"
                                    title="Delete Sale"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
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
            {/* Close button floating above the receipt card */}
            <button
              onClick={() => setSelectedSaleDetail(null)}
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
                CASH RECEIPT
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
                    <span className="truncate pr-2">{selectedSaleDetail.product?.name || "Deleted Product"}</span>
                    <span>GHS {(selectedSaleDetail.qtySold * selectedSaleDetail.salePrice).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-black/60 pl-1">
                    {selectedSaleDetail.qtySold} x GHS {selectedSaleDetail.salePrice.toFixed(2)}
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
                  <span>Total</span>
                  <span>GHS {(selectedSaleDetail.qtySold * selectedSaleDetail.salePrice).toFixed(2)}</span>
                </div>
              </div>

              {/* Dotted Separator */}
              <div className="text-center font-bold tracking-[0.1em] opacity-40 select-none font-mono text-black">
                ********************************
              </div>

              {/* Metadata */}
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
                  {selectedSaleDetail.id.toUpperCase()}
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

      {/* CUSTOM CONFIRMATION POPUP MODAL */}
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
    </>
  );
}
