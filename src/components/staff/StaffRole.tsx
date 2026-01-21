import React, { useEffect, useState } from "react";
import {
  createRoleApi,
  getPermissionsApi,
  Permission,
  getRolesApi, // ✅ add this API
  updateRoleStatusApi ,
} from "../../api/staff";

/* ================= Types ================= */
interface Role {
  id: string;
  name: string;

  description?: string;
  permissions: string[];
  is_active: boolean;
}


/* ================= Component ================= */
const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= Fetch initial data ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const [permData, roleData] = await Promise.all([
          getPermissionsApi(),
          getRolesApi(),
        ]);

        setPermissions(permData);

        // ✅ normalize backend _id → id
       setRoles(
  roleData.map((r: any) => ({
    id: r.id,
    name: r.name,
  
    description: r.description,
    permissions: r.permissions || [],
    is_active: r.is_active,
  }))
);

      } catch (err) {
        console.error("Init failed", err);
      }
    };

    init();
  }, []);

  /* ================= Helpers ================= */
  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((p) => p !== key)
        : [...prev, key]
    );
  };

 

  /* ================= Create Role ================= */
  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      alert("Role name is required");
      return;
    }

   

    if (selectedPermissions.length === 0) {
      alert("Please select at least one permission");
      return;
    }

    try {
      setLoading(true);

      const res = await createRoleApi({
        name: roleName.trim(),
     
        permissions: selectedPermissions,
      });

  setRoles((prev) => [
  ...prev,
  {
    id: res.id,
    name: res.name,
   
    description: res.description,
    permissions: res.permissions || selectedPermissions,
    is_active: res.is_active,
  },
]);


      setRoleName("");
    
      setSelectedPermissions([]);
    } catch (error: any) {
      alert(error.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Delete Role ================= */

   
  const groupedPermissions = permissions.reduce((acc: any, perm) => {
  if (!acc[perm.module]) {
    acc[perm.module] = {};
  }
  acc[perm.module][perm.action] = perm.key;
  return acc;
}, {});

const handleToggleStatus = async (role: Role) => {
  try {
    const updatedRole = await updateRoleStatusApi(role.id, {
      is_active: !role.is_active,
    });

    setRoles((prev) =>
      prev.map((r) =>
        r.id === role.id ? { ...r, is_active: updatedRole.is_active } : r
      )
    );
  } catch (error: any) {
    alert(error.message || "Failed to update status");
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-2">
        Role & Permission Management
      </h1>
      <p className="text-gray-500 mb-6">
        Create roles and assign permissions to control system access
      </p>

      {/* ================= Create Role ================= */}
      <div className="bg-white rounded-2xl shadow p-6 mb-10 max-w-5xl">
        <h2 className="text-xl font-semibold mb-6">Create Role</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Role Name</label>
            <input
              className="border rounded-lg p-2 w-full"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Doctor, Support"
            />
          </div>
        </div>

     <div className="border-t pt-6">
  <h3 className="text-lg font-semibold mb-4">
    Assign Permissions
  </h3>

  <div className="overflow-x-auto">
    <table className="min-w-full border rounded-xl overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left">Module</th>
          <th className="p-3 text-center">View</th>
          <th className="p-3 text-center">Create</th>
          <th className="p-3 text-center">Edit</th>
          <th className="p-3 text-center">Delete</th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(groupedPermissions).map(
          ([module, actions]: any) => (
            <tr key={module} className="border-t">
              {/* Module Name */}
              <td className="p-3 font-medium capitalize">
                {module.replace("_", " ")}
              </td>

              {/* View */}
              <td className="p-3 text-center">
                {actions.view ? (
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(actions.view)}
                    onChange={() => togglePermission(actions.view)}
                  />
                ) : (
                  "-"
                )}
              </td>

              {/* Create */}
              <td className="p-3 text-center">
                {actions.create ? (
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(actions.create)}
                    onChange={() => togglePermission(actions.create)}
                  />
                ) : (
                  "-"
                )}
              </td>

              {/* Edit */}
              <td className="p-3 text-center">
                {actions.edit ? (
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(actions.edit)}
                    onChange={() => togglePermission(actions.edit)}
                  />
                ) : (
                  "-"
                )}
              </td>

              {/* Delete */}
              <td className="p-3 text-center">
                {actions.delete ? (
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(actions.delete)}
                    onChange={() => togglePermission(actions.delete)}
                  />
                ) : (
                  "-"
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>


        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCreateRole}
            disabled={
              loading ||
              !roleName ||
           
              selectedPermissions.length === 0
            }
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Role"}
          </button>
        </div>
      </div>

      {/* ================= Roles Table ================= */}
    <div className="bg-white rounded-2xl shadow p-6">
  <h2 className="text-xl font-semibold mb-4">Roles</h2>

  {roles.length === 0 ? (
    <p className="text-gray-500 text-sm">
      No roles created yet.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left text-sm font-semibold">Role</th>
        
            <th className="p-3 text-left text-sm font-semibold">
              Permissions
            </th>
            <th className="p-3 text-left text-sm font-semibold">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {roles.map((role) => (
            <tr
              key={role.id}
              className="border-t hover:bg-gray-50 align-top"
            >
              {/* Role name */}
              <td className="p-3 font-medium">
                {role.name}
              </td>

      
             

              {/* Permissions */}
              <td className="p-3">
                {role.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">
                    No permissions
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="p-3">
  <button
    onClick={() => handleToggleStatus(role)}
    className={`px-3 py-1 text-xs rounded-full transition ${
      role.is_active
        ? "bg-green-100 text-green-700 hover:bg-green-200"
        : "bg-red-100 text-red-700 hover:bg-red-200"
    }`}
  >
    {role.is_active ? "Active" : "Inactive"}
  </button>
</td>


       
             
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  );
};

export default RoleManagementPage;
