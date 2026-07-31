import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  X,
  Search,
  Pencil,
} from "lucide-react";

import API, { resolveImage } from "../../services/api";
import { useToast } from "../../components/common/ToastContext";

const SERVER_BASE =
  API.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const OffersPage = () => {
  const { toast } = useToast();

  const [offers, setOffers] = useState([]);
  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [searchVal, setSearchVal] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const offersPerPage = 10;

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "percentage",
    value: "",
    status: "Active",
    startDate: "",
    endDate: "",
    applicableTo: "sitewide",
    applicableProducts: [],
    applicableCategories: [],
    applicableBrands: [],
    banner: "",
  });

  /* =========================================
      FETCH
  ========================================= */

  useEffect(() => {
    fetchOffers();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const prodRes = await API.get("/products");
      setProductList(prodRes.data.data);

      const catRes = await API.get("/categories");
      setCategoryList(catRes.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);

      const res = await API.get("/offers");

      setOffers(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
      FORM
  ========================================= */

  const resetForm = () => {
    setEditingId(null);

    setFormData({
      name: "",
      slug: "",
      description: "",
      type: "percentage",
      value: "",
      status: "Active",
      startDate: "",
      endDate: "",
      applicableTo: "sitewide",
      applicableProducts: [],
      applicableCategories: [],
      applicableBrands: [],
      banner: "",
    });
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;

    if (name === "applicableProducts" || name === "applicableCategories" || name === "applicableBrands") {
      const selected = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);

      setFormData((prev) => ({
        ...prev,
        [name]: selected,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================
      UPLOAD
  ========================================= */

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const uploadData = new FormData();

    uploadData.append("images", file);

    try {
      setUploadingBanner(true);

      const { data } = await API.post("/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = `${SERVER_BASE}${data.data[0]}`;

      setFormData((prev) => ({
        ...prev,
        banner: imageUrl,
      }));

      toast("Banner uploaded successfully!", "success");
    } catch (error) {
      toast("Failed to upload banner", "error");
    } finally {
      setUploadingBanner(false);
    }
  };

  /* =========================================
      SAVE
  ========================================= */

  const createOrUpdateOffer = async () => {
    try {
      if (!formData.name || !formData.slug || !formData.value || !formData.startDate || !formData.endDate) {
        return toast("Please fill required fields", "error");
      }

      const formatIso = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
      };

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value),
        status: formData.status,
        startDate: formatIso(formData.startDate),
        endDate: formatIso(formData.endDate),
        applicableTo: formData.applicableTo,
        applicableProducts: formData.applicableTo === "products" ? formData.applicableProducts : [],
        applicableCategories: formData.applicableTo === "category" ? formData.applicableCategories : [],
        applicableBrands: formData.applicableTo === "brands" ? formData.applicableBrands : [],
        banner: formData.banner,
      };

      setLoading(true);

      if (editingId) {
        const res = await API.put(`/offers/${editingId}`, payload);
        setOffers((prev) => prev.map((o) => (o._id === editingId ? res.data.data : o)));
        toast("Offer updated!", "success");
      } else {
        const res = await API.post("/offers", payload);
        setOffers((prev) => [res.data.data, ...prev]);
        toast("Offer created!", "success");
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      toast(error?.response?.data?.message || "Failed to save offer", "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
      DELETE
  ========================================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer?")) return;

    try {
      await API.delete(`/offers/${id}`);

      setOffers((prev) =>
        prev.filter((o) => o._id !== id)
      );

      toast("Offer deleted", "success");
    } catch (error) {
      toast("Failed to delete offer", "error");
    }
  };

  /* =========================================
      TOGGLE
  ========================================= */

  const handleToggle = async (id) => {
    try {
      await API.put(`/offers/${id}/toggle`);

      fetchOffers();
    } catch (error) {
      console.log(error);
    }
  };

  /* =========================================
      EDIT
  ========================================= */

  const setEditMode = (offer) => {
    setEditingId(offer._id);

    setFormData({
      name: offer.name || "",
      slug: offer.slug || "",
      description: offer.description || "",
      type: offer.type || "percentage",
      value: offer.value ?? "",
      status: offer.status || "Active",
      startDate: offer.startDate?.slice(0, 16) || "",
      endDate: offer.endDate?.slice(0, 16) || "",
      applicableTo: offer.applicableTo || "sitewide",
      applicableProducts: (offer.applicableProducts || []).map((id) => id.toString()),
      applicableCategories: (offer.applicableCategories || []).map((id) => id.toString()),
      applicableBrands: offer.applicableBrands || [],
      banner: offer.banner || "",
    });

    setShowModal(true);
  };

  /* =========================================
      SEARCH + PAGINATION
  ========================================= */

  const filteredOffers = offers.filter((o) =>
    (o.name || o.title || "")
      ?.toLowerCase()
      .includes(searchVal.toLowerCase())
  );

  const totalPages = Math.ceil(
    filteredOffers.length / offersPerPage
  );

  const indexOfLast = currentPage * offersPerPage;

  const indexOfFirst =
    indexOfLast - offersPerPage;

  const currentOffers = filteredOffers.slice(
    indexOfFirst,
    indexOfLast
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchVal]);

  /* =========================================
      UI
  ========================================= */

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* BG */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/20 blur-[140px] rounded-full" />

      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 blur-[140px] rounded-full" />

      <div className="relative z-10">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Offer Management
            </h1>

            <p className="text-slate-400 mt-2">
              Manage discounts, promotions and
              seasonal campaigns
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-[1.02] transition-all font-bold shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-5 h-5" />
            Create Offer
          </button>
        </div>

        {/* TOP BAR */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            {/* SEARCH */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                placeholder="Search offers..."
                value={searchVal}
                onChange={(e) =>
                  setSearchVal(e.target.value)
                }
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>
                Total: <span className="font-bold text-cyan-400">{filteredOffers.length}</span>
              </span>
              <span>
                Active: <span className="font-bold text-emerald-400">{filteredOffers.filter((o) => o.status === "Active").length}</span>
              </span>
              <span>
                Inactive: <span className="font-bold text-rose-400">{filteredOffers.filter((o) => o.status === "Inactive").length}</span>
              </span>
            </div>
          </div>

        {/* TABLE */}
        <div className="rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-2xl">
          {/* DESKTOP */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-black dark:text-white text-xs uppercase tracking-widest">
                  <th className="px-6 py-5 text-left">
                    Offer
                  </th>

                  <th className="px-6 py-5 text-left">
                    Type
                  </th>

                  <th className="px-6 py-5 text-left">
                    Discount
                  </th>

                  <th className="px-6 py-5 text-left">
                    Duration
                  </th>

                  <th className="px-6 py-5 text-center">
                    Status
                  </th>

                  <th className="px-6 py-5 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentOffers.map((offer) => (
                  <tr
                    key={offer._id}
                    className="border-b border-black/5 dark:border-white/5 hover:bg-cyan-500/[0.03] transition-all"
                  >
                    {/* OFFER */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={resolveImage(
                            offer.banner
                          )}
                          alt=""
                          className="w-16 h-16 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                        />

                      <div>
                        <h2 className="font-bold text-black dark:text-white">
                          {offer.name}
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                          /{offer.slug}
                        </p>
                      </div>
                       </div>
                   </td>

                    {/* TYPE */}
                    <td className="px-6 py-5">
                      <span className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase">
                        {offer.type === "percentage" ? "Percentage" : "Flat"}
                      </span>
                    </td>

                    {/* DISCOUNT */}
                    <td className="px-6 py-5">
                      <span className="font-black text-xl text-black dark:text-white">
                        {offer.value}
                        {offer.type === "percentage" ? "%" : "₹"}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-5 text-sm text-slate-400">
                      {offer.startDate
                        ? new Date(
                            offer.startDate
                          ).toLocaleDateString()
                        : "N/A"}{" "}
                      →
                      {offer.endDate
                        ? new Date(
                            offer.endDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            handleToggle(offer._id)
                          }
                          className={`px-4 py-2 rounded-full text-xs font-black uppercase ${
                            offer.status === "Active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {offer.status === "Active" ? "Live" : "Paused"}
                        </button>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() =>
                            setEditMode(offer)
                          }
                          className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(offer._id)
                          }
                          className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="lg:hidden p-4 space-y-4">
            {currentOffers.map((offer) => (
              <div
                key={offer._id}
                className="rounded-3xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 space-y-4"
              >
                <div className="flex gap-4">
                  <img
                    src={resolveImage(offer.banner)}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover"
                  />

                  <div className="flex-1">
                    <h2 className="font-bold text-lg">
                      {offer.name}
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      /{offer.slug}
                    </p>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold">
                        {offer.type === "percentage" ? "Percentage" : "Flat"}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold">
                        {offer.value}
                        {offer.type === "percentage" ? "%" : "₹"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase ${
                    offer.status === "Active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {offer.status === "Active" ? "Live" : "Paused"}
                  </div>

                  <button
                    onClick={() =>
                      setEditMode(offer)
                    }
                    className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(offer._id)
                    }
                    className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAGINATION */}
        {filteredOffers.length > offersPerPage && (
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => prev - 1)
              }
              className="px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-40"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;

              return (
                <button
                  key={page}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                    currentPage === page
                      ? "bg-cyan-500 text-white"
                      : "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => prev + 1)
              }
              className="px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50  backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 40,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 40,
              }}
              className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] border border-white/70 dark:border-white/10  p-6 md:p-8 shadow-2xl"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black">
                    {editingId
                      ? "Update Offer"
                      : "Create Offer"}
                  </h2>

                  <p className="text-slate-400 mt-1">
                    Configure premium discount
                    campaigns
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/ dark:hover:bg-white/"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* NAME */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Offer Name
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                        slug: generateSlug(
                          e.target.value
                        ),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                {/* SLUG */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Slug
                  </label>

                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    readOnly
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                {/* OFFER TYPE */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Offer Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl  border border-black/10 dark:border-white/10 px-4 py-3 outline-none"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Fixed Amount Discount (₹)</option>
                  </select>
                </div>

                {/* VALUE */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    {formData.type === "percentage" ? "Discount %" : "Discount Amount (₹)"}
                  </label>

                  <input
                    type="number"
                    name="value"
                    min="0"
                    value={formData.value}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-black/10 dark:border-white/10 px-4 py-3 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* START DATE */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none [color-scheme:dark]"
                  />
                </div>

                {/* END DATE */}
                <div>
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    End Date
                  </label>

                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none [color-scheme:dark]"
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                {/* APPLICABLE TO */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Applicable To
                  </label>
                  <select
                    name="applicableTo"
                    value={formData.applicableTo}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-black/10 dark:border-white/10 px-4 py-3 outline-none"
                  >
                    <option value="sitewide">Entire Site</option>
                    <option value="products">Specific Products</option>
                    <option value="category">Category</option>
                    <option value="brands">Brands</option>
                  </select>
                </div>

                {/* MULTI-SELECT HELPERS */}
                {formData.applicableTo === "products" && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-xs uppercase text-slate-500 font-bold">Products</label>
                    <select
                      name="applicableProducts"
                      multiple
                      value={formData.applicableProducts}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-black/10 dark:border-white/10 px-4 py-3 outline-none h-40"
                    >
                      {productList.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                  </div>
                )}

                {formData.applicableTo === "category" && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-xs uppercase text-slate-500 font-bold">Categories</label>
                    <select
                      name="applicableCategories"
                      multiple
                      value={formData.applicableCategories}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-black/10 dark:border-white/10 px-4 py-3 outline-none h-40"
                    >
                      {categoryList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                  </div>
                )}

                {formData.applicableTo === "brands" && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-xs uppercase text-slate-500 font-bold">Brands (comma separated)</label>
                    <input
                      type="text"
                      name="applicableBrands"
                      value={(formData.applicableBrands || []).join(", ")}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          applicableBrands: e.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="Nike, Adidas, Puma"
                      className="mt-2 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                )}

                {/* BANNER */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="text-xs uppercase text-slate-500 font-bold">
                    Banner
                  </label>

                  <div className="mt-2 rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="w-full text-sm"
                    />

                    {formData.banner && (
                      <img
                        src={resolveImage(
                          formData.banner
                        )}
                        alt=""
                        className="mt-4 w-full h-40 rounded-2xl object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-10">
                <button
                  onClick={createOrUpdateOffer}
                  disabled={loading}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 flex items-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}

                  {editingId
                    ? "Update Offer"
                    : "Create Offer"}
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-8 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OffersPage;