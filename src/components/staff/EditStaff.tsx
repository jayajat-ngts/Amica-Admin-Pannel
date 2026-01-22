import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
// import { getRolesApi, getStaffApi, Role, updateStaffStatusApi } from "../../api/staff";
import {
  getRolesApi,
  getStaffByIdApi, // ✅ ADD THIS
  Role,
  updateStaffStatusApi,
} from "../../api/staff";


const EditStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    password: "",
    roles: [] as string[],
  });

  /* ================= Fetch staff + roles ================= */
useEffect(() => {
  if (!id) return;

  const init = async () => {
    try {
      setLoading(true);

      const [rolesRes, staff] = await Promise.all([
        getRolesApi(),
        getStaffByIdApi(id), // ✅ DIRECT API CALL
      ]);

      // ✅ only active roles
      setRoles(rolesRes.filter((r) => r.is_active));

      setFormData({
        name: staff.name,
        email: staff.email,
        mobile_no: staff.mobile_no || "",
        password: "",
        roles: staff.roles.map((r) => r._id),
      });
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  init();
}, [id]);


  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateStaffStatusApi(id!, formData);
      navigate("/staff");
    } catch (err: any) {
      alert(err.message || "Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ===== Overlay ===== */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      {/* ===== Modal Card ===== */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl p-8">
        
        {/* Close */}
        <button
          onClick={() => navigate("/staff")}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-center">
          Edit Staff
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Update staff details and role
        </p>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input
              name="email"
              value={formData.email}
              disabled
              className="mt-1 w-full rounded-xl border bg-gray-100 px-4 py-2"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm font-medium">Mobile Number</label>
            <input
              name="mobile_no"
              value={formData.mobile_no}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">
              Password (optional)
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                👁
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Assign Role</label>

            {formData.roles[0] && (
              <div className="mt-2 mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                {roles.find((r) => r.id === formData.roles[0])?.name}
                <button
                  onClick={() =>
                    setFormData((p) => ({ ...p, roles: [] }))
                  }
                >
                  ✕
                </button>
              </div>
            )}

            <input
              placeholder="Search role..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="mt-1 w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            />

            {roleSearch && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border bg-white shadow">
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    className="w-full px-4 py-2 text-left hover:bg-indigo-50"
                    onClick={() => {
                      setFormData((p) => ({
                        ...p,
                        roles: [role.id],
                      }));
                      setRoleSearch("");
                    }}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => navigate("/staff")}
            className="rounded-xl border px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStaffPage;
