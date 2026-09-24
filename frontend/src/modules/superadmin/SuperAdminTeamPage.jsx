import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Mail,
  Phone,
  Layers,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  ShieldCheck,
  Terminal,
  Code2,
  Cpu,
  Receipt,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import logoImg from '../../assets/logo.png';
import ConfirmModal from '../../components/ConfirmModal';
import CustomSelect from '../../components/CustomSelect';
import './SuperAdminTeamPage.css';

// 5 Core Engineering Disciplines
const ROLE_OPTIONS = [
  {
    value: 'Lead Backend Developer',
    label: 'Lead Backend Developer',
    description: 'Microservices, DB & APIs',
    specialization: 'Core Microservices, DB & APIs'
  },
  {
    value: 'POS & Frontend Lead',
    label: 'POS & Frontend Lead',
    description: 'POS Billing, UI & Storefront',
    specialization: 'POS Billing, UI & Storefront'
  },
  {
    value: 'Hardware & DevOps Specialist',
    label: 'Hardware & DevOps Specialist',
    description: 'Printers, Networks & Cloud',
    specialization: 'Thermal Printers, Networks & Cloud'
  },
  {
    value: 'GST & Invoicing Expert',
    label: 'GST & Invoicing Expert',
    description: 'Tax Rules & E-Way Bills',
    specialization: 'Tax Rules & E-Way Bills'
  },
  {
    value: 'Dev Support Lead',
    label: 'Dev Support Lead',
    description: 'General Support & Escalations',
    specialization: 'General Support & Escalations'
  }
];

// Exactly matching 5 Filter categories
const FILTER_ROLES = [
  { value: 'ALL', label: 'All Roles (All 5 Categories)' },
  { value: 'Lead Backend Developer', label: 'Backend & APIs' },
  { value: 'POS & Frontend Lead', label: 'POS & Frontend' },
  { value: 'Hardware & DevOps Specialist', label: 'Hardware & DevOps' },
  { value: 'GST & Invoicing Expert', label: 'GST & Invoicing' },
  { value: 'Dev Support Lead', label: 'Dev Support Lead' }
];

const STATUS_SELECT_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' }
];

export default function SuperAdminTeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Slide-Over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLE_OPTIONS[0].value,
    specialization: ROLE_OPTIONS[0].specialization,
    phone: '',
    password: '',
    status: 'ACTIVE'
  });

  // Delete Modal State
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/team');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTeamMembers(list);
    } catch (err) {
      console.error('Failed to load team members:', err);
      toast.error('Failed to load engineering team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const openAddDrawer = () => {
    setEditingMember(null);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      role: ROLE_OPTIONS[0].value,
      specialization: ROLE_OPTIONS[0].specialization,
      phone: '',
      password: '',
      status: 'ACTIVE'
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (member) => {
    setEditingMember(member);
    setShowPassword(false);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || ROLE_OPTIONS[0].value,
      specialization: member.specialization || ROLE_OPTIONS[0].specialization,
      phone: member.phone || '',
      password: '',
      status: member.status || 'ACTIVE'
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleRoleChange = (selectedRoleVal) => {
    const rawVal = (typeof selectedRoleVal === 'object' && selectedRoleVal !== null && 'target' in selectedRoleVal)
      ? selectedRoleVal.target.value
      : (selectedRoleVal?.value || selectedRoleVal);
    const matchedPreset = ROLE_OPTIONS.find((r) => r.value === rawVal);
    setFormData((prev) => ({
      ...prev,
      role: rawVal,
      specialization: matchedPreset ? matchedPreset.specialization : prev.specialization
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.warning('Please enter developer name and email');
      return;
    }

    try {
      setSubmitting(true);
      if (editingMember) {
        await api.put(`/admin/team/${editingMember.id}`, formData);
        toast.success(`Developer [${formData.name}] updated successfully`);
      } else {
        await api.post('/admin/team', formData);
        toast.success(`Developer [${formData.name}] added to team`);
      }
      setIsDrawerOpen(false);
      fetchTeamMembers();
    } catch (err) {
      console.error('Failed to save team member:', err);
      toast.error(err?.response?.data?.message || 'Failed to save team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/team/${memberToDelete.id}`);
      toast.success(`Developer [${memberToDelete.name}] removed`);
      setMemberToDelete(null);
      fetchTeamMembers();
    } catch (err) {
      console.error('Failed to delete team member:', err);
      toast.error('Failed to delete team member');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DEV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filtered members
  const filteredMembers = teamMembers.filter((m) => {
    const q = (searchQuery || '').toLowerCase();
    const nameMatch = (m.name || '').toLowerCase().includes(q);
    const emailMatch = (m.email || '').toLowerCase().includes(q);
    const roleMatch = (m.role || '').toLowerCase().includes(q);
    const specMatch = (m.specialization || '').toLowerCase().includes(q);
    const matchesSearch = nameMatch || emailMatch || roleMatch || specMatch;

    const activeFilter = (typeof roleFilter === 'object' && roleFilter !== null && 'target' in roleFilter)
      ? String(roleFilter.target?.value || 'ALL')
      : String(roleFilter?.value || roleFilter || 'ALL');

    const matchesRole =
      activeFilter === 'ALL' ||
      (m.role || '').toLowerCase() === activeFilter.toLowerCase() ||
      (m.role || '').toLowerCase().includes(activeFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  // KPI calculations
  const totalCount = teamMembers.length;
  const backendCount = teamMembers.filter((m) => (m.role || '').toLowerCase().includes('backend')).length;
  const frontendCount = teamMembers.filter((m) => (m.role || '').toLowerCase().includes('frontend') || (m.role || '').toLowerCase().includes('pos')).length;
  const devopsCount = teamMembers.filter((m) => (m.role || '').toLowerCase().includes('devops') || (m.role || '').toLowerCase().includes('hardware')).length;
  const gstCount = teamMembers.filter((m) => (m.role || '').toLowerCase().includes('gst') || (m.role || '').toLowerCase().includes('invoicing')).length;

  return (
    <div className="admin-team-container">
      {/* Header */}
      <div className="admin-team-header">
        <div className="admin-team-title">
          <h1>
            <Users size={28} color="#982A86" />
            Support &amp; Developer Engineering Team
          </h1>
          <p>
            Manage developers across 5 specialized disciplines for ticket resolution and workspace access
          </p>
        </div>

        <div className="admin-team-actions">
          <button
            className="btn-primary-add-dev"
            type="button"
            onClick={openAddDrawer}
            id="btn-add-dev-member"
          >
            <Plus size={18} />
            <span>Add Developer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-team-kpis">
        <div className="team-kpi-card">
          <div className="team-kpi-icon" style={{ background: 'rgba(152, 42, 134, 0.12)' }}>
            <Users size={22} color="#982A86" />
          </div>
          <div className="team-kpi-info">
            <span className="team-kpi-label">Total Engineers</span>
            <span className="team-kpi-val">{totalCount}</span>
          </div>
        </div>

        <div className="team-kpi-card">
          <div className="team-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
            <Terminal size={22} color="#2563eb" />
          </div>
          <div className="team-kpi-info">
            <span className="team-kpi-label">Backend &amp; APIs</span>
            <span className="team-kpi-val">{backendCount}</span>
          </div>
        </div>

        <div className="team-kpi-card">
          <div className="team-kpi-icon" style={{ background: 'rgba(147, 51, 234, 0.12)' }}>
            <Code2 size={22} color="#9333ea" />
          </div>
          <div className="team-kpi-info">
            <span className="team-kpi-label">POS &amp; Frontend</span>
            <span className="team-kpi-val">{frontendCount}</span>
          </div>
        </div>

        <div className="team-kpi-card">
          <div className="team-kpi-icon" style={{ background: 'rgba(234, 88, 12, 0.12)' }}>
            <Cpu size={22} color="#ea580c" />
          </div>
          <div className="team-kpi-info">
            <span className="team-kpi-label">Hardware &amp; DevOps</span>
            <span className="team-kpi-val">{devopsCount}</span>
          </div>
        </div>

        <div className="team-kpi-card">
          <div className="team-kpi-icon" style={{ background: 'rgba(22, 163, 74, 0.12)' }}>
            <Receipt size={22} color="#16a34a" />
          </div>
          <div className="team-kpi-info">
            <span className="team-kpi-label">GST &amp; Invoicing</span>
            <span className="team-kpi-val">{gstCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar with CustomSelect */}
      <div className="team-filter-bar">
        <div className="team-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search developers by name, email or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="team-filter-dropdowns">
          <div style={{ width: '220px' }}>
            <CustomSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val?.target ? val.target.value : (val?.value || val || 'ALL'))}
              options={FILTER_ROLES}
              size="sm"
            />
          </div>

          <button
            className="btn-dev-action"
            onClick={fetchTeamMembers}
            title="Refresh team roster"
            type="button"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading developer roster...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No developers found</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem' }}>
            Add your engineering team members to grant workspace access.
          </p>
          <button className="btn-primary-add-dev" onClick={openAddDrawer}>
            <Plus size={16} />
            <span>Add First Developer</span>
          </button>
        </div>
      ) : (
        <div className="team-cards-grid">
          {filteredMembers.map((member) => (
            <div key={member.id} className="team-dev-card">
              <div className="team-dev-top">
                <div className="dev-avatar-circle">{getInitials(member.name)}</div>
                <div className="dev-main-meta">
                  <h3 className="dev-name-title">{member.name}</h3>
                  <span className="dev-role-badge">
                    <ShieldCheck size={12} />
                    {member.role}
                  </span>
                </div>
              </div>

              {member.specialization && (
                <div className="dev-specialization-chip">
                  <Layers size={13} color="#982A86" />
                  <span>{member.specialization}</span>
                </div>
              )}

              <div className="dev-contact-details">
                <div className="dev-contact-row">
                  <Mail size={13} />
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                </div>
                {member.phone && (
                  <div className="dev-contact-row">
                    <Phone size={13} />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="team-card-actions">
                <button
                  type="button"
                  className="btn-dev-action"
                  onClick={() => openEditDrawer(member)}
                  title="Edit details & password"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  className="btn-dev-action delete"
                  onClick={() => setMemberToDelete(member)}
                  title="Remove from roster"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-Over Drawer with Clean Plum Theme */}
      {isDrawerOpen && (
        <div className="team-drawer-overlay" onClick={closeDrawer}>
          <div className="team-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Clean Drawer Header */}
            <div className="team-drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-brand-badge">
                  <img src={logoImg} alt="StockPilot" className="drawer-logo-img" />
                </div>
                <div>
                  <h3 className="drawer-title">
                    {editingMember ? 'Edit Developer' : 'Add New Developer'}
                  </h3>
                  <p className="drawer-subtitle">
                    {editingMember ? 'Update engineer profile and credentials' : 'Set up developer credentials and permissions'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="drawer-close-btn"
                onClick={closeDrawer}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSubmit} className="team-drawer-form">
              <div className="team-drawer-body">
                {/* Developer Name */}
                <div className="form-field-group">
                  <label>Full Name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Work Email */}
                <div className="form-field-group">
                  <label>Work Email <span className="req-star">*</span></label>
                  <input
                    type="email"
                    placeholder="anand@stockpilot.io"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                {/* Engineering Discipline / Role */}
                <div className="form-field-group">
                  <label>Engineering Discipline <span className="req-star">*</span></label>
                  <CustomSelect
                    value={formData.role}
                    onChange={handleRoleChange}
                    options={ROLE_OPTIONS}
                    placeholder="Select discipline..."
                  />
                </div>

                {/* Contact Phone & Availability */}
                <div className="form-group-row">
                  <div className="form-field-group">
                    <label>Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Status</label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val?.target ? val.target.value : (val?.value || val) })}
                      options={STATUS_SELECT_OPTIONS}
                    />
                  </div>
                </div>

                {/* Password / Passkey Field */}
                <div className="form-field-group">
                  <label>
                    Workspace Password {editingMember && <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>}
                  </label>
                  <div className="drawer-pw-wrapper">
                    <Lock size={15} className="drawer-pw-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingMember ? '•••••••• (leave blank to keep current)' : 'Default: dev123'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="drawer-pw-input"
                    />
                    <button
                      type="button"
                      className="drawer-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="drawer-help-text">
                    Used by the developer to sign into <code>/dev/login</code>.
                  </span>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="team-drawer-footer">
                <button
                  type="button"
                  className="btn-drawer-cancel"
                  onClick={closeDrawer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-drawer-submit"
                  disabled={submitting}
                >
                  <span>{submitting ? 'Saving...' : (editingMember ? 'Save Changes' : 'Add Developer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Developer"
        message={`Are you sure you want to remove [${memberToDelete?.name}] (${memberToDelete?.role}) from the team?`}
        confirmText={deleting ? 'Removing...' : 'Remove Developer'}
        type="danger"
      />
    </div>
  );
}
