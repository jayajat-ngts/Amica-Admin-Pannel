import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { Coupon, CreateCouponPayload, createCoupon } from "../../api/coupons";

type Props = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  onCreated?: (coupon: Coupon) => void;
};

type FieldErrors = Partial<Record<keyof CreateCouponPayload, string>>;

export default function CreateCouponModal({
  isOpen,
  closeModal,
  onCreated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // form fields
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>("Swiggy");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [purchaseAmount, setPurchaseAmount] = useState<number | "">("");
  const [expiry, setExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<
    "active" | "inactive" | "expired" | "used"
  >("active");
  const [maxUsePerUser, setMaxUsePerUser] = useState<number | "">(1);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setErrorMessage(null);
      setErrors({});
    }
  }, [isOpen]);

  const resetForm = () => {
    setCode("");
    setTitle("");
    setPlatform("Swiggy");
    setDiscountType("flat");
    setDiscountValue("");
    setPurchaseAmount("");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiry(d.toISOString().slice(0, 10));
    setStatus("active");
    setMaxUsePerUser(1);
    setErrors({});
    setMessage(null);
    setErrorMessage(null);
  };

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!code || !code.trim()) e.code = "Code is required";
    if (!title || !title.trim()) e.title = "Title is required";
    if (discountValue === "" || discountValue === null)
      e.discountValue = "Discount value is required";
    else if (typeof discountValue === "number" && discountValue < 0)
      e.discountValue = "Invalid discount value";
    if (
      purchaseAmount !== "" &&
      typeof purchaseAmount === "number" &&
      purchaseAmount < 0
    )
      e.purchaseAmount = "Invalid purchase amount";
    if (!expiry) e.expiry = "Expiry date is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!validate()) return;

    const payload: CreateCouponPayload = {
      code: code.trim(),
      title: title.trim(),
      platform: platform.trim(),
      discountType,
      discountValue: Number(discountValue),
      purchaseAmount:
        purchaseAmount === "" ? undefined : Number(purchaseAmount),
      expiry: new Date(expiry).toISOString(),
      status,
      maxUsePerUser: maxUsePerUser === "" ? undefined : Number(maxUsePerUser),
    };

    try {
      setBusy(true);
      const created = await createCoupon(payload);
      setMessage("Coupon created successfully");
      if (onCreated) onCreated(created);

      setTimeout(() => {
        closeModal();
        resetForm();
      }, 700);
    } catch (err: unknown) {
      console.error("createCoupon error", err);
      setErrorMessage("Failed to create coupon");
    } finally {
      setBusy(false);
      setTimeout(() => {
        setMessage(null);
        setErrorMessage(null);
      }, 4000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        resetForm();
      }}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Create Coupon
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a coupon — fill the details below and click Create Coupon.
          </p>
        </div>

        {message && (
          <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-green-800">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* form fields (same as you had) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="E.g. SWIGGY50"
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
              {errors.code && (
                <div className="text-xs text-red-600 mt-1">{errors.code}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform
              </label>
              <input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Add platform"
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title"
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            />
            {errors.title && (
              <div className="text-xs text-red-600 mt-1">{errors.title}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "flat" | "percent")}
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              >
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Value
              </label>
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
              {errors.discountValue && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.discountValue}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Purchase Amount
              </label>
              <input
                type="number"
                min={0}
                value={purchaseAmount}
                onChange={(e) =>
                  setPurchaseAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
                placeholder="Minimum purchase to redeem"
              />
              {errors.purchaseAmount && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.purchaseAmount}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry
              </label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
              {errors.expiry && (
                <div className="text-xs text-red-600 mt-1">{errors.expiry}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "expired" | "used")}
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="used">Used</option>
              </select>
            </div>

            
          </div>

          <div className="flex items-center gap-3 mt-4 justify-end">
            <button
              type="button"
              onClick={() => {
                closeModal();
                resetForm();
              }}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy}
              onClick={handleSubmit}
              className="flex justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
