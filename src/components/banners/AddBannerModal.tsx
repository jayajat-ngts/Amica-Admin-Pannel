import React, { useEffect, useState, useCallback } from "react";
import { Modal } from "../ui/modal";
import { uploadBanner, deleteBanner, BannerInfo, BannerData } from "../../api/banners";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  onUploadSuccess?: (banner: BannerData) => void;
  editBanner?: BannerInfo | null;
};

export default function AddBannerModal({
  isOpen,
  closeModal,
  onUploadSuccess,
  editBanner,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const isEditing = !!editBanner;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      if (editBanner) {
        setPreview(editBanner.url);
      } else {
        setFile(null);
        setPreview(null);
      }
    }
  }, [isOpen, editBanner]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If editing, delete the old banner first
      if (isEditing && editBanner) {
        await deleteBanner(editBanner.filename);
      }

      const response = await uploadBanner(file);
      if (response.success) {
        setSuccess(`Banner ${isEditing ? "updated" : "uploaded"} successfully!`);
        onUploadSuccess?.(response.data);
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || "Failed to upload banner";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearPreview = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isEditing ? "Edit Banner" : "Add New Banner"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEditing
              ? "Upload a new image to replace the existing banner."
              : "Upload an image to create a new banner."}
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors ${
            dragActive
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
              : "border-gray-300 dark:border-gray-600"
          } ${preview ? "p-4" : "p-8"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg object-contain max-h-64"
              />
              <button
                type="button"
                onClick={clearPreview}
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop your image here, or{" "}
                <span className="text-brand-500">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || (!file && !isEditing)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? "Uploading..." : isEditing ? "Update Banner" : "Upload Banner"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
