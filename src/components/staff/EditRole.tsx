import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPermissionsApi,
  getRolesApi,
  updateRoleApi,
  Permission,
} from "../../api/staff";

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const EditRolePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== Fetch role + permissions ===== */
  useEffect(() => {
    const init = async () => {
      const [rolesData, permsData] = await Promise.all([
        getRolesApi(),
        getPermissionsApi(),
      ]);

      const found = rolesData.find((r: Role) => r.id === id);
      if (!found) {
        navigate("/staff/role");
        return;
      }

      setRole(found);
      setName(found.name);
      setSelectedPermissions(found.permissions);
      setPermissions(permsData);
    };

    init();
  }, [id, navigate]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((p) => p !== key)
        : [...prev, key]
    );
  };

  const groupedPermissions = permissions.reduce((acc: any, perm) => {
    if (!acc[perm.module]) acc[perm.module] = {};
    acc[perm.module][perm.action] = perm.key;
    return acc;
  }, {});

  const handleSave = async () => {
    if (!role) return;

    setLoading(true);
    await updateRoleApi(role.id, {
      name: name.trim(),
      permissions: selectedPermissions,
    });
    setLoading(false);

    navigate("/staff/role");
  };

  if (!role) return null;
  

return (
  <div className="fixed inset-0 z-40 flex items-center justify-center">
    {/* ===== Blurred Background ===== */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

    {/* ===== Center Card ===== */}
    <div className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-xl p-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Edit Role
      </h1>
      <p className="text-gray-500 mb-6 text-center">
        Update role name and permissions
      </p>

      {/* Role Name */}
      <div className="mb-6">
        <label className="text-sm font-medium">Role Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Permissions */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl">
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
                  <td className="p-3 font-medium capitalize">
                    {module.replace("_", " ")}
                  </td>
                  {["view", "create", "edit", "delete"].map((action) => (
                    <td key={action} className="p-3 text-center">
                      {actions[action] ? (
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(
                            actions[action]
                          )}
                          onChange={() =>
                            togglePermission(actions[action])
                          }
                          className="h-4 w-4 accent-indigo-600"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={() => navigate("/staff/role")}
          className="rounded-xl border px-6 py-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

};

export default EditRolePage;
