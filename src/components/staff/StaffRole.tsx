import React, { useEffect, useState } from "react";
import {
  createRoleApi,
  getPermissionsApi,
  Permission,
  getRolesApi,
  updateRoleStatusApi,
  updateRoleApi,
} from "../../api/staff";

/* ================= Types ================= */
interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
}

/* ================= Edit Role Modal ================= */
interface EditRoleModalProps {
  role: Role;
  permissions: Permission[];
  onClose: () => void;
  onSave: (payload: { name: string; permissions: string[] }) => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  role,
  permissions,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(role.name);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role.permissions || []
  );

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center">Edit Role</h2>
        <p className="text-gray-500 text-center mb-6">
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
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Assign Permissions</h3>

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
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-xl border px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({ name: name.trim(), permissions: selectedPermissions })
            }
            className="rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= Main Component ================= */
const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  /* ================= Fetch Data ================= */
  useEffect(() => {
    const init = async () => {
      const [permData, roleData] = await Promise.all([
        getPermissionsApi(),
        getRolesApi(),
      ]);

      setPermissions(permData);
      setRoles(roleData);
    };

    init();
  }, []);

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

  const handleCreateRole = async () => {
    if (!roleName || selectedPermissions.length === 0) return;

    setLoading(true);
    const res = await createRoleApi({
      name: roleName,
      permissions: selectedPermissions,
    });

    setRoles((prev) => [...prev, res]);
    setRoleName("");
    setSelectedPermissions([]);
    setLoading(false);
  };

  const handleToggleStatus = async (role: Role) => {
    const updated = await updateRoleStatusApi(role.id, {
      is_active: !role.is_active,
    });

    setRoles((prev) =>
      prev.map((r) =>
        r.id === role.id ? { ...r, is_active: updated.is_active } : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Role & Permission Management
      </h1>

      {/* ================= Create Role ================= */}
      <div className="bg-white rounded-2xl shadow p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Create Role</h2>

        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="border rounded-lg p-2 w-full mb-6"
          placeholder="Role name"
        />

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

        <div className="mt-6 text-right">
          <button
            onClick={handleCreateRole}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
          >
            Create Role
          </button>
        </div>
      </div>

      {/* ================= Roles Table ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Roles</h2>

        <table className="min-w-full border rounded-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-t">
                <td className="p-3 font-medium">{role.name}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleStatus(role)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      role.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {role.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowEditModal(true);
                    }}
                    className="rounded-lg bg-indigo-50 px-3 py-1 text-indigo-600 hover:bg-indigo-100"
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= Edit Modal ================= */}
      {showEditModal && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          permissions={permissions}
          onClose={() => setShowEditModal(false)}
          onSave={async (payload) => {
            await updateRoleApi(selectedRole.id, payload);
            const updated = await getRolesApi();
            setRoles(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

export default RoleManagementPage;
