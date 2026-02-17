// pages/SubscriptionPlansPage.tsx
import React, { useEffect, useState } from "react";
import {
  getSubscriptionPlansApi,
  createSubscriptionPlanApi,
  updateSubscriptionPlanApi,
  toggleSubscriptionStatusApi,
  SubscriptionPlan,
} from "../../api/subscription";
import SubscriptionPlanModal from "../../components/subscription/SubscriptionPlanModal";


const SubscriptionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getSubscriptionPlansApi().then(setPlans);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Subscription Plans
        </h1>
        <button
          onClick={() => {
            setSelectedPlan(null);
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
        >
          + Create Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan._id} className="border-t">
                <td className="p-4 font-medium">
                  {plan.name}
                </td>
                <td className="p-4">
                  ₹{plan.price}
                </td>
                <td className="p-4">
                  {plan.duration_days} days
                </td>
                <td className="p-4">
                  <button
                    onClick={async () => {
                      const updated =
                        await toggleSubscriptionStatusApi(
                          plan._id,
                          !plan.is_active
                        );
                      setPlans((p) =>
                        p.map((x) =>
                          x._id === plan._id
                            ? updated
                            : x
                        )
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-xs ${
                      plan.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {plan.is_active
                      ? "Active"
                      : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowModal(true);
                    }}
                    className="text-indigo-600"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SubscriptionPlanModal
          initialData={selectedPlan}
          onClose={() => setShowModal(false)}
          onSave={async (payload) => {
            if (selectedPlan) {
              const updated =
                await updateSubscriptionPlanApi(
                  selectedPlan._id,
                  payload
                );
              setPlans((p) =>
                p.map((x) =>
                  x._id === updated._id ? updated : x
                )
              );
            } else {
              const created =
                await createSubscriptionPlanApi(payload);
              setPlans((p) => [...p, created]);
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionPlansPage;
