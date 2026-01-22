import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getStaffApi, Staff } from "../../api/staff";
import { updateStaffStatusApi } from "../../api/staff";

const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch Staff
  ========================= */
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await getStaffApi();
        setStaffList(data);
      } catch (error) {
        console.error("Failed to load staff", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);
  const handleStatusToggle = async (
  staffId: string,
  currentStatus: "active" | "inactive"
) => {
  try {
    const newStatus = currentStatus === "active" ? "disabled" : "active";

    const updatedStaff = await updateStaffStatusApi(staffId, {
      status: newStatus,
    });

    // UI update
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId ? { ...s, status: updatedStaff.status } : s
      )
    );
  } catch (error: any) {
    alert(error.message || "Failed to update status");
  }
};


  return (
    <div className="min-h-screen bg-gray-50 p-6">

  {/* ✅ Header with Create Button */}
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold">Staff</h1>
 <button onClick={() => navigate("/staff/create")} className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700" > + Create Staff </button>
  </div>
<div className="bg-white rounded-2xl border border-gray-200 p-6">
  {/* Card Title */}
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Staff List
  </h2>

  {/* Inner Table Card */}
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {loading ? (
      <div className="py-16 text-center text-gray-500">
        Loading users...
      </div>
    ) : staffList.length === 0 ? (
      <div className="py-16 flex flex-col items-center justify-center">
        {/* Error Icon */}
        <div className="mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3m0 3h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.4 21h17.2a1.5 1.5 0 001.29-2.96L13.71 3.86a1.5 1.5 0 00-2.42 0z"
            />
          </svg>
        </div>

        <p className="text-lg font-medium text-gray-700">
          No users found
        </p>
        <p className="text-sm text-gray-500 mt-1">
          staff will appear here once they created
        </p>
      </div>
    ) : (
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              S.No
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Role
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Email
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
              Status
            </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
              Action
            </th>
           
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {staffList.map((staff, index) => (
            <tr key={staff.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-gray-600">
                {index + 1}
              </td>

              <td className="px-6 py-4 font-medium text-gray-900">
                {staff.name}
              </td>

              <td className="px-6 py-4 text-gray-700">
                {staff.roles.map((r) => r.name).join(", ")}
              </td>

              <td className="px-6 py-4 text-gray-700">
                {staff.mobile_no || "-"}
              </td>

              <td className="px-6 py-4 text-gray-700">
                {staff.email}
              </td>

              {/* Toggle */}
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() =>
                    handleStatusToggle(staff.id, staff.status)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    staff.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      staff.status === "active"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
                  {/* ✅ Actions */}
     <td className="p-3">
  <button
    onClick={() => navigate(`/staff/edit/${staff.id}`)}
    className="
      inline-flex items-center gap-2
      px-3 py-1.5
      text-sm font-medium
      text-indigo-600
      border border-indigo-200
      rounded-lg
      hover:bg-indigo-50 hover:border-indigo-300
      transition
    "
  >
    {/* Edit Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>

    Edit
  </button>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>

  {/* Pagination Footer */}
  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
    <span>Page 1 of 1 • {staffList.length} results</span>

    <div className="flex gap-2">
      <button className="px-3 py-1.5 border rounded-lg text-gray-400 cursor-not-allowed">
        ← Previous
      </button>
      <button className="px-3 py-1.5 border rounded-lg text-gray-400 cursor-not-allowed">
        Next →
      </button>
    </div>
  </div>
</div>
</div>

  );
};

export default StaffListPage;
