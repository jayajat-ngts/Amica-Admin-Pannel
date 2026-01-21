import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getBanners, deleteBanner, BannerInfo } from "../../api/banners";
import AddBannerModal from "./AddBannerModal";
import { useModal } from "../../hooks/useModal";
import { PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";

function LoadingRow() {
  return (
    <TableRow>
      <TableCell className="px-5 py-5" colSpan={5}>
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2 mb-3" />
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
      </TableCell>
    </TableRow>
  );
}

export default function BannersTable() {
  const [banners, setBanners] = useState<BannerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [editBanner, setEditBanner] = useState<BannerInfo | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBanners();
      if (response.success) {
        setBanners(response.data || []);
      } else {
        setError(response.message || "Failed to fetch banners");
      }
    } catch (err) {
      setError("Failed to load banners");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    try {
      setBusyRow(filename);
      const response = await deleteBanner(filename);
      if (response.success) {
        setBanners(banners.filter((b) => b.filename !== filename));
      } else {
        setError(response.message || "Failed to delete banner");
      }
    } catch (err) {
      setError("Failed to delete banner");
      console.error(err);
    } finally {
      setBusyRow(null);
    }
  };

  const handleAddClick = () => {
    setEditBanner(null);
    openModal();
  };

  const handleEditClick = (banner: BannerInfo) => {
    setEditBanner(banner);
    openModal();
  };

  const handleModalClose = () => {
    setEditBanner(null);
    closeModal();
  };

  const handleUploadSuccess = () => {
    handleModalClose();
    fetchBanners();
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {banners.length} banner{banners.length !== 1 ? "s" : ""} uploaded
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchBanners}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Banner
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Preview
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Filename
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Uploaded At
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <>
                <LoadingRow />
                <LoadingRow />
                <LoadingRow />
              </>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No banners uploaded yet</p>
                    <button
                      onClick={handleAddClick}
                      className="mt-2 text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      Upload your first banner
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.filename}>
                  <TableCell className="px-5 py-4">
                    <div className="h-16 w-28 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <img
                        src={banner.url}
                        alt={banner.filename}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='64' viewBox='0 0 112 64'%3E%3Crect fill='%23f3f4f6' width='112' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-xs" title={banner.filename}>
                      {banner.filename}
                    </p>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(banner.uploadedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={banner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5 fill-current" />
                      </a>
                      <button
                        onClick={() => handleEditClick(banner)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.filename)}
                        disabled={busyRow === banner.filename}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        {busyRow === banner.filename ? (
                          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <TrashBinIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Banner Modal */}
      <AddBannerModal
        isOpen={isOpen}
        closeModal={handleModalClose}
        onUploadSuccess={handleUploadSuccess}
        editBanner={editBanner}
      />
    </div>
  );
}
