import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CRMLayout from './layouts/CRMLayout';
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
import EducationDashboard from './pages/education/EducationDashboard';
import Universities from './pages/education/Universities';
import UniversityDetails from './pages/education/UniversityDetails';
import Courses from './pages/education/Courses';
import CourseDetails from './pages/education/CourseDetails';
import Specializations from './pages/education/Specializations';
import CourseFees from './pages/education/CourseFees';
import Sessions from './pages/education/Sessions';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Navigate to="/crm" replace />} />
        <Route path="/" element={<Navigate to="/crm" replace />} />
        <Route path="/crm" element={<CRMLayout />}>
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
          <Route path="education" element={<EducationDashboard />} />
          <Route path="education/universities" element={<Universities />} />
          <Route path="education/universities/:id" element={<UniversityDetails />} />
          <Route path="education/courses" element={<Courses />} />
          <Route path="education/courses/:id" element={<CourseDetails />} />
          <Route path="education/specializations" element={<Specializations />} />
          <Route path="education/admissions" element={<Sessions />} />
          <Route path="education/fees" element={<CourseFees />} />
        </Route>
        <Route path="*" element={<Navigate to="/crm" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
