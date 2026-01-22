import React, { useEffect, useState } from "react";
import { Role } from "../../api/staff";

interface PermissionRow {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface Props {
  role: Role;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    permissions: string[];
  }) => void;
}

const MODULES = ["Users", "Staff", "Roles", "Permissions", "Settings", "Audit Logs"];

const EditRoleModal: React.FC<Props> = ({ role, onClose, onSave }) => {
  const [roleName, setRoleName] = useState(role.name);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);

  /* ===== Prefill permissions ===== */
  useEffect(() => {
    const rows = MODULES.map((mod) => ({
      module: mod,
      view: role.permissions.includes(`${mod.toLowerCase()}.view`),
      create: role.permissions.includes(`${mod.toLowerCase()}.create`),
      edit: role.permissions.includes(`${mod.toLowerCase()}.edit`),
      delete: role.permissions.includes(`${mod.toLowerCase()}.delete`),
    }));
    setPermissions(rows);
  }, [role]);

  const toggle = (index: number, key: keyof PermissionRow) => {
    setPermissions((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [key]: !row[key] } : row
      )
    );
  };

  const handleSave = () => {
    const finalPermissions: string[] = [];

    permissions.forEach((row) => {
      if (row.view) finalPermissions.push(`${row.module.toLowerCase()}.view`);
      if (row.create) finalPermissions.push(`${row.module.toLowerCase()}.create`);
      if (row.edit) finalPermissions.push(`${row.module.toLowerCase()}.edit`);
      if (row.delete) finalPermissions.push(`${row.module.toLowerCase()}.delete`);
    });

    onSave({
      name: roleName,
      permissions: finalPermissions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Edit Role</h2>

        {/* Role Name */}
        <div className="mb-6">
          <label className="text-sm font-medium">Role Name</label>
          <input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Permissions Table */}
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
              {permissions.map((row, i) => (
                <tr key={row.module} className="border-t">
                  <td className="p-3 font-medium">{row.module}</td>
                  {(["view", "create", "edit", "delete"] as const).map((key) => (
                    <td key={key} className="p-3 text-center">
                      {row[key] !== undefined ? (
                        <input
                          type="checkbox"
                          checked={row[key]}
                          onChange={() => toggle(i, key)}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-xl border px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
