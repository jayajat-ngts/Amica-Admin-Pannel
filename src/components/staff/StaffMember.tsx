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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Staff</h1>
        <button
          onClick={() => navigate("/staff/create")}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700"
        >
          + Create Staff
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading staff...</p>
        ) : staffList.length === 0 ? (
          <p className="p-6 text-gray-500">No staff found</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                   <th className="p-3 text-left">S.No</th>   
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Role</th>
                   <th className="p-3 text-left">Mobile</th>   
                <th className="p-3 text-left">Email</th>
              
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
         {staffList.map((staff, index) => (
                <tr
                  key={staff.id}
                  className="border-t hover:bg-gray-50"
                >
                      {/* S.No */}
      <td className="p-3 text-gray-600">
        {index + 1}
      </td>
                

                  {/* Name */}
                  <td className="p-3 font-medium">
                    {staff.name}
                    {staff.is_root && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        Root
                      </span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="p-3">
                    {staff.roles.map((r) => r.name).join(", ")}
                  </td>
  {/* Mobile */}
      <td className="p-3 text-gray-700">
        {staff.mobile_no || "-"}
      </td>
                  {/* Email */}
                  <td className="p-3">{staff.email}</td>

                  {/* Status */}
                  <td className="p-3">
  <button
    onClick={() =>
      handleStatusToggle(staff.id, staff.status)
    }
    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
      staff.status === "active"
        ? "bg-green-100 text-green-700 hover:bg-green-200"
        : "bg-red-100 text-red-700 hover:bg-red-200"
    }`}
  >
    {staff.status === "active" ? "Active" : "disabled"}
  </button>
</td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StaffListPage;
