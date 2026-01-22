import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createStaffApi, getRolesApi, Role } from "../../api/staff";


const CreateStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
const [roleSearch, setRoleSearch] = useState("");
// const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    password: "",
  roles: [] as string[],
  });

  const filteredRoles = roles.filter((role) =>
  role.name.toLowerCase().includes(roleSearch.toLowerCase())
);

  /* =========================
     Fetch Roles
  ========================= */

useEffect(() => {
  const fetchRoles = async () => {
    try {
      const data = await getRolesApi();

      // ✅ sirf active roles show karo
      const activeRoles = data.filter(
        (role) => role.is_active === true
      );

      setRoles(activeRoles);
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  };

  fetchRoles();
}, []);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await createStaffApi(formData);

      navigate("/staff");
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

return (
  <>
    {/* 🔥 Background Overlay with Blur */}
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

    {/* 🔥 Modal Wrapper */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl relative">

        {/* ❌ Close Button */}
        <button
          onClick={() => navigate("/staff")}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
        >
          ✕
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Page Heading */}
          <h1 className="text-3xl font-bold mb-2 text-center">
            Create Staff
          </h1>
          <p className="text-gray-500 mb-8 text-center">
            Add a new staff member and assign a role
          </p>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                autoComplete="off"
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter email address"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile_no"
                value={formData.mobile_no}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter mobile number"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  autoComplete="new-password"
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Create a password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Assign Role */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Assign Role
              </label>

              {/* Selected Role */}
              {formData.roles[0] && (
                <div className="mb-2 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                  {roles.find((r) => r.id === formData.roles[0])?.name}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, roles: [] }))
                    }
                    className="hover:text-indigo-900"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Search Role */}
              <input
                type="text"
                placeholder="Search role..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              {/* Role Dropdown */}
              {roleSearch && (
                <div className="mt-2 border rounded-xl shadow-sm max-h-44 overflow-y-auto bg-white">
                  {filteredRoles.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">
                      No matching roles
                    </p>
                  ) : (
                    filteredRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            roles: [role.id],
                          }));
                          setRoleSearch("");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50"
                      >
                        {role.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={() => navigate("/staff")}
              className="px-6 py-2 rounded-xl border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);


};

export default CreateStaffPage;
