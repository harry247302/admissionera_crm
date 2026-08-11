export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">AdmissionEra</h1>
          <p className="text-sm text-slate-500">Education CRM Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
