import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchLeadById, fetchLeadActivities, fetchLeadNotes, addLeadNote,
  updateLead, convertLead, clearCurrentLead,
} from '../../redux/slices/leadSlice';
import { fetchCounselors } from '../../redux/slices/counselorSlice';
import LeadStatusBadge, { PriorityBadge } from '../../components/crm/LeadStatusBadge';
import LeadActivityTimeline from '../../components/crm/LeadActivityTimeline';
import LeadForm from '../../components/crm/LeadForm';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { LEAD_STATUSES, formatDate, formatDateTime } from '../../utils/crmConstants';

const tabs = ['Overview', 'Personal', 'Academic', 'Activities', 'Notes', 'Follow-ups', 'Applications'];

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentLead, activities, notes, detailLoading } = useSelector((s) => s.leads);
  const { items: counselors } = useSelector((s) => s.counselors);
  const [activeTab, setActiveTab] = useState('Overview');
  const [noteText, setNoteText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  useEffect(() => {
    dispatch(fetchLeadById(id));
    dispatch(fetchLeadActivities(id));
    dispatch(fetchLeadNotes(id));
    dispatch(fetchCounselors());
    return () => dispatch(clearCurrentLead());
  }, [dispatch, id]);

  const lead = currentLead;

  const handleStatusChange = async (status) => {
    try {
      await dispatch(updateLead({ id, data: { status } })).unwrap();
      toast.success('Status updated');
      dispatch(fetchLeadActivities(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await dispatch(addLeadNote({ id, note: noteText })).unwrap();
      toast.success('Note added');
      setNoteText('');
      dispatch(fetchLeadActivities(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleConvert = async () => {
    try {
      await dispatch(convertLead({ id, data: {} })).unwrap();
      toast.success('Lead converted successfully');
      setShowConvert(false);
      dispatch(fetchLeadById(id));
      dispatch(fetchLeadActivities(id));
    } catch (err) {
      toast.error(err);
    }
  };

  if (detailLoading) return <LoadingSpinner />;
  if (!lead) return <div className="card text-red-600">Lead not found</div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.fullName}</h1>
              <LeadStatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{lead.leadCode} · {lead.phone}</p>
            <p className="text-sm text-slate-500">Counselor: {lead.counselorName || 'Unassigned'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={lead.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn-primary" onClick={() => setShowConvert(true)}>Convert</button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Email" value={lead.email} />
          <InfoCard label="Course" value={lead.course} />
          <InfoCard label="University" value={lead.university} />
          <InfoCard label="City" value={lead.city} />
          <InfoCard label="Lead Source" value={lead.leadSource?.replace(/_/g, ' ')} />
          <InfoCard label="Created" value={formatDate(lead.createdAt)} />
          <InfoCard label="Last Contact" value={formatDateTime(lead.lastContactAt)} />
          <InfoCard label="Next Follow-up" value={formatDateTime(lead.nextFollowupAt)} />
          <InfoCard label="Budget" value={lead.budget ? `₹${lead.budget}` : '—'} />
        </div>
      )}

      {activeTab === 'Personal' && (
        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard label="WhatsApp" value={lead.whatsappNumber} />
          <InfoCard label="Date of Birth" value={formatDate(lead.dateOfBirth)} />
          <InfoCard label="Gender" value={lead.gender} />
          <InfoCard label="State" value={lead.state} />
          <InfoCard label="Preferred Location" value={lead.preferredLocation} />
        </div>
      )}

      {activeTab === 'Academic' && (
        <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard label="Qualification" value={lead.academicQualification} />
          <InfoCard label="Passing Year" value={lead.passingYear} />
          <InfoCard label="Percentage/CGPA" value={lead.percentageCgpa} />
          <InfoCard label="Specialization" value={lead.specialization} />
        </div>
      )}

      {activeTab === 'Activities' && (
        <div className="card"><LeadActivityTimeline activities={activities} /></div>
      )}

      {activeTab === 'Notes' && (
        <div className="card space-y-4">
          <div className="flex gap-2">
            <textarea className="input flex-1" rows={2} placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button className="btn-primary" onClick={handleAddNote}>Add</button>
          </div>
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm">{n.note}</p>
              <p className="mt-1 text-xs text-slate-400">{n.createdByName} · {formatDateTime(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="xl">
        <LeadForm
          counselors={counselors}
          defaultValues={lead}
          onSubmit={async (data) => {
            await dispatch(updateLead({ id, data })).unwrap();
            toast.success('Lead updated');
            setShowEdit(false);
          }}
        />
      </Modal>

      <Modal open={showConvert} onClose={() => setShowConvert(false)} title="Convert to Admission" size="sm">
        <p className="text-sm text-slate-600 mb-4">This will create an application and admission record while preserving lead history.</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setShowConvert(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleConvert}>Confirm Conversion</button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value || '—'}</p>
    </div>
  );
}
