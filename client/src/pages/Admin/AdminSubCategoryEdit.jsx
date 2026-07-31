import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchAdminSubCategoryById,
  editAdminSubCategory,
  fetchAdminCategories,
} from "../../redux/slices/adminSlice";
import { useToast } from "../../components/common/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { ArrowLeft, FolderTree, ImagePlus, X } from "lucide-react";
import API, { resolveImage } from "../../services/api";

const SERVER_BASE =
  API.defaults.baseURL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

const AdminSubCategoryEdit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();

  const { subcategories, categories, actionLoading, loading } = useSelector(
    (state) => state.admin
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    category: "",
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const subcategory = subcategories.find((s) => s._id === id);

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminSubCategoryById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name || "",
        description: subcategory.description || "",
        image: subcategory.image || "",
        category: subcategory.category?._id || "",
      });
    }
  }, [subcategory]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Subcategory name is required.";
    }
    if (!formData.category) {
      newErrors.category = "Parent category is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("images", file);
      const { data } = await API.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data.data?.[0];
      if (url) {
        setFormData((prev) => ({ ...prev, image: `${SERVER_BASE}${url}` }));
      }
    } catch {
      toast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast("Please fix the validation errors.", "error");
      return;
    }

    try {
      await dispatch(
        editAdminSubCategory({ id, subData: formData })
      ).unwrap();
      toast("SubCategory updated successfully", "success", 3000);
      navigate("/admin/subcategories");
    } catch (err) {
      toast(err || "Failed to update SubCategory", "error");
    }
  };

  if (loading && !subcategory) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/subcategories")}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-200" />
          </button>
          <h1 className="text-3xl font-black tracking-tight">Edit Subcategory</h1>
        </div>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!loading && !subcategory) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/subcategories")}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-200" />
          </button>
          <h1 className="text-3xl font-black tracking-tight">Edit Subcategory</h1>
        </div>
        <p className="text-sm text-slate-500">Subcategory not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/subcategories")}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Edit Subcategory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Update subcategory details below.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-8 space-y-6">
          {/* NAME */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">
              Subcategory Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Men's Shirts"
              className={`w-full rounded-2xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-3 outline-none focus:ring-2 transition ${
                errors.name
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-cyan-500"
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name}</p>}
          </div>

          {/* PARENT CATEGORY */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">
              Parent Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full rounded-2xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-3 outline-none focus:ring-2 transition ${
                errors.category
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-cyan-500"
              }`}
            >
              <option value="">Select parent category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-rose-500 font-medium">{errors.category}</p>
            )}
          </div>

          {/* IMAGE */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">
              Image
            </label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-6 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <ImagePlus size={24} className="text-cyan-500" />
              <span className="text-sm font-bold text-slate-500">
                {uploading ? "Uploading…" : "Click to upload image"}
              </span>
              <span className="text-xs text-slate-400">
                PNG · JPG · WEBP
              </span>
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Or paste image URL directly"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
            />
            {formData.image && (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={resolveImage(formData.image)}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/96x96/1e293b/94a3b8?text=IMG";
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, image: "" }))
                  }
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">
              Description
            </label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this subcategory…"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-4 outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none"
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={actionLoading}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black shadow-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60"
          >
            {actionLoading ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/subcategories")}
            disabled={actionLoading}
            className="flex-1 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSubCategoryEdit;
