export default function AdminUnauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center px-4">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.06A9 9 0 1021 12a9 9 0 00-13.92-5.94z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">403 - Access Denied</h1>
        <p className="text-lg text-slate-300 mb-8">You do not have permission to access the admin dashboard.</p>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Admin access required. If you believe this is an error, contact your administrator.
          </p>
          <a href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
