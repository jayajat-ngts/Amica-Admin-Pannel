import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createStaffApi, getRolesApi, Role } from "../../api/staff";


const CreateStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
const [roleSearch, setRoleSearch] = useState("");
const [showRoleDropdown, setShowRoleDropdown] = useState(false);
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
//   <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
<div className="bg-gray-50 flex justify-center p-6">

    <div className="w-full max-w-4xl">
      {/* Page Heading */}
      <h1 className="text-3xl font-bold mb-2 text-center">
        Create Staff
      </h1>
      <p className="text-gray-500 mb-8 text-center">
        Add a new staff member and assign a role
      </p>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
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
  name="mobile_no"   // ✅ FIX
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

    {/* Eye Icon */}
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
    >
      {showPassword ? (
        /* Eye Off */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.028.154-2.02.442-2.955M6.223 6.223A9.957 9.957 0 0112 5c5.523 0 10 4.477 10 10 0 1.13-.19 2.215-.539 3.225M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ) : (
        /* Eye */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  </div>
</div>


          {/* Role */}
 <div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1">
    Assign Role
  </label>

  {/* Selected Role */}
  {formData.roles[0] && (
    <div className="mb-2 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
      {
        roles.find((r) => r.id === formData.roles[0])?.name
      }
      <button
        type="button"
        onClick={() =>
          setFormData((prev) => ({ ...prev, roles: [] }))
        }
        className="text-indigo-500 hover:text-indigo-700"
      >
        ✕
      </button>
    </div>
  )}

  {/* Search Input */}
  <input
    type="text"
    placeholder="Search role..."
    value={roleSearch}
    onChange={(e) => setRoleSearch(e.target.value)}
    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
  />

  {/* Role List */}
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
              setRoleSearch(""); // ✅ list close after select
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
);

};

export default CreateStaffPage;
