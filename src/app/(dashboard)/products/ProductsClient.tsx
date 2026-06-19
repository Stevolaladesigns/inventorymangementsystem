"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  Package,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  Info,
  ShieldAlert,
} from "lucide-react";
import { addProduct, updateProduct, deleteProduct, recordSale, addCategory, updateCategory, deleteCategory } from "../../actions";
import { useUserRole } from "@/hooks/useUserRole";

interface ProductsClientProps {
  initialProducts: any[];
  initialSuppliers: any[];
  initialCategories: { id: string; name: string }[];
}

export default function ProductsClient({
  initialProducts,
  initialSuppliers,
  initialCategories,
}: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [suppliers] = useState(initialSuppliers);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "all", name: "All Categories" },
    ...initialCategories,
  ]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "stock-high" | "stock-low" | "price">("name");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states
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
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const [saleProduct, setSaleProduct] = useState<any>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [saleCustomer, setSaleCustomer] = useState("Cash Customer");
  const [saleError, setSaleError] = useState<string | null>(null);

  // Filter stats
  const totalCount = products.length;
  const inStockCount = products.filter((p: any) => p.qtyInStock > p.minLevel).length;
  const lowStockCount = products.filter((p: any) => p.qtyInStock <= p.minLevel && p.qtyInStock > 0).length;
  const criticalCount = products.filter((p: any) => p.qtyInStock === 0).length;

  // Filter & Sort Products
  let processedProducts = products.filter((p: any) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (sortBy === "name") {
    processedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "stock-high") {
    processedProducts.sort((a, b) => b.qtyInStock - a.qtyInStock);
  } else if (sortBy === "stock-low") {
    processedProducts.sort((a, b) => a.qtyInStock - b.qtyInStock);
  } else if (sortBy === "price") {
    processedProducts.sort((a, b) => b.price - a.price);
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!newCategoryName.trim()) {
      setCategoryError("Please enter a category name.");
      return;
    }
    try {
      const result = await addCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, { id: result.id, name: result.name }].sort((a, b) => {
        if (a.id === "all") return -1;
        if (b.id === "all") return 1;
        return a.name.localeCompare(b.name);
      }));
      setNewCategoryName("");
    } catch (err: any) {
      setCategoryError(err.message || "Failed to add category.");
    }
  };

  const handleEditCategorySubmit = async (catId: string) => {
    setCategoryError(null);
    const trimmed = editingCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Category name cannot be empty.");
      return;
    }
    const oldCat = categories.find((c) => c.id === catId);
    if (!oldCat) return;

    try {
      const result = await updateCategory(catId, trimmed);
      
      // Update local categories state
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, name: result.name } : c))
      );
      
      // Update all products locally using that category name
      setProducts((prev) =>
        prev.map((p) => (p.category === oldCat.name ? { ...p, category: result.name } : p))
      );

      // If the currently filtered category was this one, update the selection
      if (selectedCategory === oldCat.name) {
        setSelectedCategory(result.name);
      }

      setEditingCategoryId(null);
      setEditingCategoryName("");
    } catch (err: any) {
      setCategoryError(err.message || "Failed to update category.");
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return;
    setCategoryError(null);
    try {
      await deleteCategory(categoryToDelete.id);
      
      // Update categories state
      setCategories((prev) => {
        const filtered = prev.filter((c) => c.id !== categoryToDelete.id);
        const hasUncategorized = filtered.some((c) => c.name === "Uncategorized");
        if (!hasUncategorized) {
          return [...filtered, { id: "uncategorized-temp-id", name: "Uncategorized" }].sort((a, b) => {
            if (a.id === "all") return -1;
            if (b.id === "all") return 1;
            return a.name.localeCompare(b.name);
          });
        }
        return filtered;
      });

      // Update products state locally
      setProducts((prev) =>
        prev.map((p) => (p.category === categoryToDelete.name ? { ...p, category: "Uncategorized" } : p))
      );

      // Update filtered selection if it was the deleted category
      if (selectedCategory === categoryToDelete.name) {
        setSelectedCategory("All Categories");
      }
      
      setCategoryToDelete(null);
    } catch (err: any) {
      setCategoryError(err.message || "Failed to delete category.");
      setCategoryToDelete(null);
    }
  };

  // Actions
  const handleProductSubmit = async (e: React.FormEvent) => {
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

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      if (detailProduct?.id === productToDelete.id) setIsDetailModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      setProductToDelete(null);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);
    if (!saleProduct) return;
    if (saleProduct.qtyInStock < saleQty) {
      setSaleError(`Insufficient stock! Only ${saleProduct.qtyInStock} remaining.`);
      return;
    }

    try {
      await recordSale({
        productId: saleProduct.id,
        qtySold: saleQty,
        salePrice: saleProduct.price,
        customerName: saleCustomer,
      });

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === saleProduct.id
            ? { ...p, qtyInStock: p.qtyInStock - saleQty }
            : p
        )
      );
      setIsSaleModalOpen(false);
      setSaleQty(1);
    } catch (err: any) {
      setSaleError(err.message || "Failed to process sale");
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
    setSaleProduct(p);
    setIsSaleModalOpen(true);
  };

  const triggerDetail = (p: any) => {
    setDetailProduct(p);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <Header
          title="Products"
          subtitle="Manage and monitor your product inventory"
          lowStockCount={lowStockCount}
          actions={
            canEdit ? (
              <button
                onClick={() => {
                  resetProductForm();
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            ) : null
          }
        />

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-5">
          {/* Categories/Search Bar Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2.5 text-sm text-muted-foreground w-full lg:w-72 shadow-sm">
              <Search className="w-4 h-4 text-[#8a8278]" />
              <input
                type="text"
                placeholder="Search by name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none w-full text-foreground text-sm font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${
                      selectedCategory === cat.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-[#5c5450] hover:bg-input"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {canEdit && (
                <button
                  onClick={() => {
                    setCategoryError(null);
                    setNewCategoryName("");
                    setEditingCategoryId(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-semibold border border-dashed border-primary text-primary bg-primary/5 hover:bg-primary/10 transition-all shrink-0"
                  title="Manage Categories"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Categories</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto flex-shrink-0">
              {/* Grid / List View Toggle */}
              <div className="flex items-center border border-border rounded-md overflow-hidden bg-card shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 transition-all ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-input"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 transition-all ${
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-input"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative shadow-sm">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="appearance-none flex items-center gap-1.5 border border-border bg-card rounded-md pl-3 pr-8 py-2 text-sm font-semibold text-muted-foreground outline-none cursor-pointer"
                >
                  <option value="name">Sort by: Name</option>
                  <option value="stock-high">Sort by: Stock (High)</option>
                  <option value="stock-low">Sort by: Stock (Low)</option>
                  <option value="price">Sort by: Price</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-6 bg-card border border-border rounded-lg px-5 py-3 shadow-sm text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="font-semibold text-foreground">
                {inStockCount} <span className="text-muted-foreground font-normal">In Stock</span>
              </span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="font-semibold text-foreground">
                {lowStockCount} <span className="text-muted-foreground font-normal">Low Stock</span>
              </span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-danger" />
              <span className="font-semibold text-foreground">
                {criticalCount} <span className="text-muted-foreground font-normal">Critical</span>
              </span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#8a8278]" />
              <span className="font-semibold text-foreground">
                {totalCount} <span className="text-muted-foreground font-normal">Total Products</span>
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          {processedProducts.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground shadow-sm">
              No products found matching the criteria.
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {processedProducts.map((p) => {
                const isOutOfStock = p.qtyInStock === 0;
                const isLowStock = p.qtyInStock <= p.minLevel;
                const progressWidth = Math.min((p.qtyInStock / p.minLevel) * 100, 100);

                return (
                  <div
                    key={p.id}
                    className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      {isOutOfStock ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-red-50 text-danger border border-red-100">
                          Critical
                        </span>
                      ) : isLowStock ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-secondary border border-amber-100">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-green-50 text-success border border-green-100">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4
                        className="text-base font-bold font-headings text-foreground leading-tight cursor-pointer hover:text-primary"
                        onClick={() => triggerDetail(p)}
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.sku} · {p.category}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Stock Level</span>
                        <span className="text-sm font-bold text-foreground">
                          {p.qtyInStock}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            / min {p.minLevel}
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOutOfStock
                              ? "bg-danger"
                              : isLowStock
                              ? "bg-[#f5a623]"
                              : "bg-[#1e8a4a]"
                          }`}
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-border mt-1">
                      <span className="text-sm font-bold text-foreground">
                        GHS {p.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            onClick={() => triggerEdit(p)}
                            className="p-1.5 rounded-md bg-input text-muted-foreground hover:text-foreground hover:bg-border transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => triggerDetail(p)}
                          className="p-1.5 rounded-md bg-input text-muted-foreground hover:text-foreground hover:bg-border transition"
                          title="View Info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerSell(p)}
                          disabled={isOutOfStock}
                          className="p-1.5 rounded-md bg-primary text-white hover:bg-[#b0220a] transition disabled:opacity-50 disabled:pointer-events-none"
                          title="Record Sale"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View Table */
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-input border-b border-border text-left">
                      <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase">Product</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">Category</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Stock</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Min Level</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Price</th>
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">Status</th>
                      <th className="px-5 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {processedProducts.map((p, idx) => {
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
                          <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                            GHS {p.price.toFixed(2)}
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
                              {canEdit && (
                                <button onClick={() => triggerEdit(p)} className="text-primary hover:underline">
                                  Edit
                                </button>
                              )}
                              {canEdit && <span className="text-border">|</span>}
                              <button onClick={() => triggerDetail(p)} className="text-muted-foreground hover:text-foreground">
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full shadow-lg overflow-hidden flex flex-col">
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

            <form onSubmit={handleProductSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
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
                    placeholder="e.g. Roof Sheets"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    placeholder="e.g. ROF-001"
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
                    {categories.slice(1).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
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
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Initial Stock
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
                    Min Stock Limit
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
                    Unit Measurement
                  </label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                    placeholder="pcs, rolls, bags..."
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
                  placeholder="Material specs..."
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

      {/* MODAL 2: RECORD SALE */}
      {isSaleModalOpen && saleProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Record Sale
              </h3>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-5 flex flex-col gap-4">
              {saleError && (
                <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold animate-shake">
                  {saleError}
                </div>
              )}

              <div className="bg-muted/40 p-3 rounded-md border border-border text-xs">
                <div><span className="font-bold">Product:</span> {saleProduct.name}</div>
                <div><span className="font-bold">SKU:</span> {saleProduct.sku}</div>
                <div>
                  <span className="font-bold">Price ea:</span> GHS {saleProduct.price.toFixed(2)}
                </div>
                <div>
                  <span className="font-bold">Available:</span> {saleProduct.qtyInStock} {saleProduct.unit}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Quantity to Sell
                </label>
                <input
                  type="number"
                  min="1"
                  max={saleProduct.qtyInStock}
                  value={saleQty}
                  onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Customer
                </label>
                <input
                  type="text"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings"
              >
                Record Sale
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCT DETAIL VIEW */}
      {isDetailModalOpen && detailProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Product Details
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Name</span>
                <p className="text-lg font-bold text-foreground font-headings leading-tight mt-0.5">
                  {detailProduct.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold">SKU Code</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{detailProduct.sku}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold">Category</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{detailProduct.category}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold">Unit Price</span>
                  <p className="text-sm font-bold text-primary mt-0.5">GHS {detailProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold">Quantity</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {detailProduct.qtyInStock} {detailProduct.unit}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Supplier</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {detailProduct.supplier?.name || "No supplier assigned"}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Description</span>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed bg-input p-3 rounded border border-border">
                  {detailProduct.description || "No description provided."}
                </p>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    if (canEdit) triggerEdit(detailProduct);
                  }}
                  className="flex-1 bg-input border border-border text-foreground hover:bg-border transition py-2 rounded-md font-bold text-xs"
                >
                  {canEdit ? "Edit Product" : "Close"}
                </button>
                 {isAdmin && (
                   <button
                     onClick={() => setProductToDelete(detailProduct)}
                     className="flex-1 bg-danger text-white hover:bg-red-700 transition py-2 rounded-md font-bold text-xs"
                   >
                     Delete Product
                   </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGE PRODUCT CATEGORIES */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-base font-bold font-headings text-foreground">
                Manage Categories
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
              {categoryError && (
                <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold">
                  {categoryError}
                </div>
              )}

              {/* Add category form */}
              <form onSubmit={handleCategorySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border border-border rounded-md px-3 py-1.5 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                  placeholder="New category name..."
                  required
                />
                <button
                  type="submit"
                  className="bg-primary text-white hover:bg-[#b0220a] transition px-4 py-1.5 rounded-md font-bold text-xs shrink-0"
                >
                  Add
                </button>
              </form>

              {/* Existing categories list */}
              <div className="mt-2 flex flex-col gap-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Existing Categories
                </h4>
                <div className="border border-border rounded-md divide-y divide-border max-h-60 overflow-y-auto bg-input/20">
                  {categories.slice(1).map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 text-sm bg-card">
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 border border-border rounded px-2 py-1 bg-input text-xs font-semibold outline-none focus:bg-white"
                            required
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditCategorySubmit(cat.id)}
                            className="text-xs font-bold text-success hover:underline px-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName("");
                            }}
                            className="text-xs font-semibold text-muted-foreground hover:underline px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-foreground">{cat.name}</span>
                          {cat.name !== "Uncategorized" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-input transition"
                                title="Rename"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => setCategoryToDelete(cat)}
                                  className="p-1 text-danger hover:text-red-700 rounded hover:bg-red-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-background border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-card border border-border text-foreground hover:bg-input transition px-4 py-2 rounded-md font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CATEGORY CONFIRMATION */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-base font-bold font-headings text-danger flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-danger" />
                <span>Delete Category</span>
              </h3>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-sm text-foreground font-semibold leading-relaxed">
                Are you sure you want to delete the category <span className="text-primary font-bold">"{categoryToDelete.name}"</span>?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed bg-red-50/50 border border-red-100 p-2.5 rounded">
                All products and suppliers currently assigned to this category will be automatically moved to <span className="font-bold text-foreground">"Uncategorized"</span>.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-background border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="bg-card border border-border text-foreground hover:bg-input transition px-4 py-2 rounded-md font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategoryConfirm}
                className="bg-danger text-white hover:bg-red-700 transition px-4 py-2 rounded-md font-bold text-xs shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE PRODUCT CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-base font-bold font-headings text-danger flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-danger" />
                <span>Delete Product</span>
              </h3>
              <button
                onClick={() => setProductToDelete(null)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-sm text-foreground font-semibold leading-relaxed">
                Are you sure you want to delete the product <span className="text-primary font-bold">"{productToDelete.name}"</span>?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed bg-red-50/50 border border-red-100 p-2.5 rounded">
                This action is permanent and cannot be undone. It will remove the product specifications and its transaction history from the stock sheets.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-background border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="bg-card border border-border text-foreground hover:bg-input transition px-4 py-2 rounded-md font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProductConfirm}
                className="bg-danger text-white hover:bg-red-700 transition px-4 py-2 rounded-md font-bold text-xs shadow-sm"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
