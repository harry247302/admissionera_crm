import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchLeads, createLead, updateLead, deleteLead, bulkUpdateLeads,
  setFilters, setSelectedIds,
} from '../../redux/slices/leadSlice';
import { fetchCounselors } from '../../redux/slices/counselorSlice';
import LeadTable from '../../components/crm/LeadTable';
import LeadFilters from '../../components/crm/LeadFilters';
import LeadForm from '../../components/crm/LeadForm';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { canDeleteLeads, canAssignLeads, exportToCSV } from '../../utils/crmConstants';

export default function Leads() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, pagination, filters, selectedIds, loading } = useSelector((s) => s.leads);
  const { items: counselors } = useSelector((s) => s.counselors);

  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [localFilters, setLocalFilters] = useState(filters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCounselors());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchLeads({ ...filters, page, limit: 20 }));
  }, [dispatch, filters, page]);

  const handleApply = () => {
    dispatch(setFilters(localFilters));
    setPage(1);
  };

  const handleClear = () => {
    setLocalFilters({});
    dispatch(setFilters({}));
    setPage(1);
  };

  const handleCreate = async (data) => {
    try {
      await dispatch(createLead(data)).unwrap();
      toast.success('Lead created successfully');
      setShowForm(false);
      dispatch(fetchLeads({ ...filters, page, limit: 20 }));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await dispatch(updateLead({ id: editLead.id, data })).unwrap();
      toast.success('Lead updated successfully');
      setEditLead(null);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteLead(deleteTarget.id)).unwrap();
      toast.success('Lead deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleBulkAssign = async (counselorId) => {
    try {
      await dispatch(bulkUpdateLeads({ ids: selectedIds, data: { assignedCounselorId: counselorId } })).unwrap();
      toast.success('Leads assigned successfully');
      dispatch(setSelectedIds([]));
      setBulkAction(null);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleExport = () => {
    exportToCSV(items.map((l) => ({
      leadCode: l.leadCode, name: l.fullName, phone: l.phone, email: l.email,
      course: l.course, status: l.status, source: l.leadSource,
    })), 'leads.csv');
    toast.success('Exported successfully');
  };

  const toggleSelect = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id];
    dispatch(setSelectedIds(next));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-slate-500">{pagination.total || 0} total leads</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && canAssignLeads(user?.role) && (
            <button className="btn-secondary" onClick={() => setBulkAction('assign')}>
              Assign ({selectedIds.length})
            </button>
          )}
          <button className="btn-secondary" onClick={handleExport}><Download className="h-4 w-4" /> Export</button>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Lead</button>
        </div>
      </div>

      <LeadFilters
        filters={localFilters}
        onChange={setLocalFilters}
        counselors={counselors}
        onApply={handleApply}
        onClear={handleClear}
      />

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No leads found" description="Create your first lead to get started" action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>Add Lead</button>
        } />
      ) : (
        <>
          <LeadTable
            leads={items}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={(checked) => dispatch(setSelectedIds(checked ? items.map((l) => l.id) : []))}
            onEdit={setEditLead}
            onDelete={setDeleteTarget}
            canDelete={canDeleteLeads(user?.role)}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {Math.ceil((pagination.total || 0) / 20) || 1}</p>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn-secondary" disabled={page * 20 >= (pagination.total || 0)} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Lead" size="xl">
        <LeadForm counselors={counselors} onSubmit={handleCreate} defaultValues={{ leadSource: 'WEBSITE', priority: 'MEDIUM' }} />
      </Modal>

      <Modal open={!!editLead} onClose={() => setEditLead(null)} title="Edit Lead" size="xl">
        {editLead && <LeadForm counselors={counselors} defaultValues={editLead} onSubmit={handleUpdate} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />

      <Modal open={bulkAction === 'assign'} onClose={() => setBulkAction(null)} title="Assign Counselor" size="sm">
        <select className="input" onChange={(e) => handleBulkAssign(e.target.value)} defaultValue="">
          <option value="" disabled>Select counselor</option>
          {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Modal>
    </div>
  );
}
