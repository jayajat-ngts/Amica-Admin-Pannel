import React, { useState } from "react";
import { SubscriptionPlan } from "../../api/subscription";

interface Props {
  initialData?: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (data: Partial<SubscriptionPlan>) => void;
}

const SubscriptionPlanModal: React.FC<Props> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    duration_days: initialData?.duration_days || 30,
    max_messages_per_day:
      initialData?.limits?.max_messages_per_day ?? 0,
    can_export_history:
      initialData?.features?.can_export_history ?? false,
    priority_support:
      initialData?.features?.priority_support ?? false,
  });

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold mb-6">
        {initialData ? "Edit Subscription Plan" : "Create Subscription Plan"}
      </h2>

      {/* ===== Form Fields ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Plan Name
          </label>
          <input
            placeholder="Enter plan name"
            className="w-full border rounded-xl px-4 py-2"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Price (INR)
          </label>
          <input
            type="number"
            placeholder="Enter price"
            className="w-full border rounded-xl px-4 py-2"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (days)
          </label>
          <input
            type="number"
            placeholder="e.g. 30"
            className="w-full border rounded-xl px-4 py-2"
            value={form.duration_days}
            onChange={(e) =>
              setForm({
                ...form,
                duration_days: Number(e.target.value),
              })
            }
          />
        </div>

        {/* Daily Message Limit */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Daily Message Limit
          </label>
          <input
            type="number"
            placeholder="0 = Unlimited"
            className="w-full border rounded-xl px-4 py-2"
            value={form.max_messages_per_day}
            onChange={(e) =>
              setForm({
                ...form,
                max_messages_per_day: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          placeholder="Optional description for this plan"
          className="w-full border rounded-xl px-4 py-2"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </div>

      {/* Features */}
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.can_export_history}
            onChange={(e) =>
              setForm({
                ...form,
                can_export_history: e.target.checked,
              })
            }
          />
          Can export chat history
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.priority_support}
            onChange={(e) =>
              setForm({
                ...form,
                priority_support: e.target.checked,
              })
            }
          />
          Priority support
        </label>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 border rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={() =>
            onSave({
              name: form.name,
              description: form.description || null,
              price: form.price,
              duration_days: form.duration_days,
              limits: {
                max_messages_per_day:
                  form.max_messages_per_day,
              },
              features: {
                can_export_history:
                  form.can_export_history,
                priority_support:
                  form.priority_support,
              },
            })
          }
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

};

export default SubscriptionPlanModal;
