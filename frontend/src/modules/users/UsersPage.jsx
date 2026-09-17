import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import { Users, Plus, Shield, Check, X, Mail, Phone, Lock, RefreshCw, Building2, Edit3, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit / Delete User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'STAFF',
    warehouseId: '',
    warehouseName: ''
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    roleName: 'STAFF',
    warehouseId: '',
    warehouseName: ''
  });

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      const whs = res?.data || [];
      setWarehouses(whs);
      if (whs.length > 0) {
        setUserForm(prev => ({
          ...prev,
          warehouseId: prev.warehouseId || whs[0].id,
          warehouseName: prev.warehouseName || whs[0].name
        }));
      }
    } catch (err) {
      console.warn('Could not fetch warehouses list for user scoping:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users');
      setUsers(res?.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err?.message || 'Failed to load team users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
  }, []);

  const handleWarehouseSelect = (val, isEdit = false) => {
    const selectedWh = warehouses.find(w => String(w.id) === String(val));
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        warehouseId: val ? Number(val) : null,
        warehouseName: selectedWh ? selectedWh.name : null
      }));
    } else {
      setUserForm(prev => ({
        ...prev,
        warehouseId: val ? Number(val) : null,
        warehouseName: selectedWh ? selectedWh.name : null
      }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.warehouseId) {
      toast.error('Please assign a specific warehouse/branch for this team member');
      return;
    }
    try {
      setCreating(true);
      await api.post('/users', {
        ...userForm,
        password: userForm.password ? userForm.password.trim() : 'password123'
      });
      toast.success('Team member created successfully');
      setIsUserModalOpen(false);
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roleName: 'STAFF',
        warehouseId: warehouses[0]?.id || '',
        warehouseName: warehouses[0]?.name || ''
      });
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to create team member');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (u) => {
    setEditingUserId(u.id);
    setEditForm({
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      phone: u.phone || '',
      password: '',
      roleName: u.role_name || 'STAFF',
      warehouseId: u.warehouse_id ? String(u.warehouse_id) : (warehouses[0]?.id ? String(warehouses[0].id) : ''),
      warehouseName: u.warehouse_name || (warehouses[0]?.name || '')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editForm.warehouseId) {
      toast.error('Please assign a specific warehouse/branch for this team member');
      return;
    }
    try {
      setUpdating(true);
      await api.put(`/users/${editingUserId}`, editForm);
      toast.success('Team member updated successfully');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to update team member');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      toast.success(`User marked as ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      setIsDeleting(true);
      await api.delete(`/users/${deletingUser.id}`);
      toast.success(`Team member ${deletingUser.first_name} removed successfully`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete team member');
    } finally {
      setIsDeleting(false);
    }
  };

  const warehouseOptions = warehouses.map(w => ({
    value: String(w.id),
    label: `${w.name} (${w.code}) ${w.city ? `- ${w.city}` : ''}`
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Team & Branch Access</h1>
          <p className="page-subtitle">
            Manage company team members, role assignments, and branch facility scoping
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => { fetchUsers(); fetchWarehouses(); }}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setUserForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                roleName: 'STAFF',
                warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
                warehouseName: warehouses[0]?.name || ''
              });
              setIsUserModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Add Team Member
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Assigned Role</th>
                <th>Assigned Facility / Branch</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No team members found. Click <strong>"Add Team Member"</strong> to invite your staff.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: u.role_name === 'ADMIN' ? '#ede9fe' : '#d1fae5',
                            color: u.role_name === 'ADMIN' ? '#6d28d9' : '#047857',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {u.first_name} {u.last_name || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '5px',
                          background: u.role_name === 'ADMIN' ? '#ede9fe' : '#f1f5f9',
                          color: u.role_name === 'ADMIN' ? '#6d28d9' : '#334155'
                        }}
                      >
                        {u.role_name === 'ADMIN' ? 'Admin' : u.role_name === 'STAFF' ? 'Staff / POS' : u.role_name}
                      </span>
                    </td>
                    <td>
                      {u.warehouse_name || u.warehouse_id ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            background: '#fdf2f8',
                            color: '#982A86',
                            border: '1px solid #fbcfe8'
                          }}
                        >
                          <Building2 size={13} />
                          <span>{u.warehouse_name || `Facility #${u.warehouse_id}`}</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          <span>Company Owner (All Facilities)</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge status={u.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary btn-sm"
                          title="Edit member & facility"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'} btn-sm`}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="btn btn-secondary btn-sm"
                          title="Delete team member"
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.35rem 0.6rem',
                            color: '#ef4444',
                            borderColor: '#fee2e2'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add Team Member">
        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                placeholder="e.g. Yukesh"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                placeholder="e.g. Kannan"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role Assignment *</label>
              <CustomSelect
                value={userForm.roleName}
                onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                options={[
                  { value: 'ADMIN', label: 'ADMIN (Full Warehouse Operations, Stock Transfers, Sourcing & Reports)' },
                  { value: 'STAFF', label: 'STAFF (Point of Sale, Billing Terminal & Stock Lookup)' }
                ]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Facility / Branch *</label>
              <CustomSelect
                value={userForm.warehouseId ? String(userForm.warehouseId) : ''}
                onChange={(e) => handleWarehouseSelect(e.target.value, false)}
                options={warehouseOptions}
                placeholder="Select Assigned Branch *"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Login Password (Optional - Default: password123)</label>
            <input
              type="text"
              className="form-input"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="e.g. Secret@123 (Default is password123)"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? 'Creating...' : 'Create Team Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Team Member & Branch">
        <form onSubmit={handleUpdateUser}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role Assignment *</label>
              <CustomSelect
                value={editForm.roleName}
                onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })}
                options={[
                  { value: 'ADMIN', label: 'ADMIN (Full Warehouse Operations, Stock Transfers, Sourcing & Reports)' },
                  { value: 'STAFF', label: 'STAFF (Point of Sale, Billing Terminal & Stock Lookup)' }
                ]}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Assigned Facility / Branch *</label>
            <CustomSelect
              value={editForm.warehouseId ? String(editForm.warehouseId) : ''}
              onChange={(e) => handleWarehouseSelect(e.target.value, true)}
              options={warehouseOptions}
              placeholder="Select Assigned Branch *"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Reset / Change Password (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Leave blank to keep existing password"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updating} className="btn btn-primary">
              {updating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete Team Member"
        message={`Are you sure you want to delete team member "${deletingUser?.first_name} ${deletingUser?.last_name || ''}" (${deletingUser?.email})? This user will lose system login access.`}
        confirmText="Yes, Delete Member"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
