import React, { useEffect, useState } from "react";
import api from "../api";
import { ErrorDisplay, LoadingSpinner, useApi } from "../components/ErrorHandling";
import { ErrorToast, SuccessToast } from "./ConfirmDialog";

// Stats Card Component
const StatsCard = ({ title, value, icon, color = "purple" }) => {
  const colorClasses = {
    purple: "bg-purple-500",
    green: "bg-green-500", 
    blue: "bg-blue-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function SystemAdmin() {
  const [systemData, setSystemData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Toast notifications
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { loading, error, callApi } = useApi();

  useEffect(() => {
    fetchSystemData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const response = await callApi(api.get, '/admin/system');
      setSystemData(response.data);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load system data. Please refresh the page.');
      setShowErrorToast(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  if (loading && !systemData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading system dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2">
              System Administration
            </h1>
            <p className="text-gray-600">
              Monitor essential system metrics and recent activity
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <ErrorDisplay error={error} />

        {/* Essential System Metrics */}
        {systemData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <StatsCard
                title="Total Users"
                value={systemData.totalUsers || 0}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                color="blue"
              />

              {/* Active Events */}
              <StatsCard
                title="Active Events"
                value={systemData.activeEvents || 0}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                color="green"
              />

              {/* Tasks Completed/Total */}
              <StatsCard
                title="Tasks Completed"
                value={`${systemData.taskCompletion?.completed || 0}/${systemData.taskCompletion?.total || 0}`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="purple"
              />

              {/* Total Drive Links */}
              <StatsCard
                title="Total Drive Links"
                value={systemData.totalDriveLinks || 0}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
                color="yellow"
              />
            </div>

            {/* Task Completion Percentage */}
            {systemData.taskCompletion && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Progress</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Completion Rate</span>
                      <span>{systemData.taskCompletion.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${systemData.taskCompletion.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {systemData.taskCompletion.completed}
                    </p>
                    <p className="text-sm text-gray-500">
                      of {systemData.taskCompletion.total} tasks
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity Logs</h2>
              <div className="space-y-3">
                {systemData.recentActivity?.length > 0 ? (
                  systemData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">
                        {activity.type === 'user_login' && '🔐'}
                        {activity.type === 'event_created' && '📅'}
                        {activity.type === 'task_completed' && '✅'}
                        {activity.type === 'archive_created' && '🔗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-purple-600">
                            {activity.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </div>
  );
}