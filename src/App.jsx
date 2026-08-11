import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './routes/ProtectedRoute';
import CRMLayout from './layouts/CRMLayout';
import Login from './pages/auth/Login';
import CRMDashboard from './pages/crm/CRMDashboard';
import Leads from './pages/crm/Leads';
import LeadDetails from './pages/crm/LeadDetails';
import Followups from './pages/crm/Followups';
import Tasks from './pages/crm/Tasks';
import Counselors from './pages/crm/Counselors';
import Applications from './pages/crm/Applications';
import Admissions from './pages/crm/Admissions';
import Activities from './pages/crm/Activities';
import Reports from './pages/crm/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/crm" replace />} />
        <Route
          path="/crm"
          element={
            <ProtectedRoute>
              <CRMLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CRMDashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetails />} />
          <Route path="followups" element={<Followups />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="counselors" element={<Counselors />} />
          <Route path="applications" element={<Applications />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="activities" element={<Activities />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/crm" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
