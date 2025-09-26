import React, { useEffect, useState } from "react";
import api from "../api";
import config from "../config/config";
import { ErrorDisplay, LoadingSpinner, useApi } from "../components/ErrorHandling";

// Stats Card Component
const StatsCard = ({ title, value, icon, trend, color = "purple" }) => {
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
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
              {trend > 0 ? '+' : ''}{trend}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Health Status Component
const HealthStatus = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      <span className="mr-1">{getStatusIcon(status)}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// System Task Component
const SystemTask = ({ task, onExecute, executing }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500">
              Last Run: {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
            </span>
            {task.nextRun && (
              <span className="text-xs text-gray-500">
                Next: {new Date(task.nextRun).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onExecute(task.id)}
          disabled={executing === task.id}
          className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {executing === task.id ? 'Running...' : 'Run Now'}
        </button>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login': return '🔐';
      case 'event_created': return '📅';
      case 'event_updated': return '✏️';
      case 'task_completed': return '✅';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_login': return 'text-blue-600';
      case 'event_created': return 'text-green-600';
      case 'event_updated': return 'text-yellow-600';
      case 'task_completed': return 'text-purple-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-lg">{getActivityIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${getActivityColor(activity.type)}`}>
                  {activity.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SystemAdmin() {
  const [healthData, setHealthData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemTasks, setSystemTasks] = useState([]);
  const [executingTask, setExecutingTask] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, callApi } = useApi();

  useEffect(() => {
    fetchSystemData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [healthResponse, statsResponse, activityResponse] = await Promise.all([
        callApi(api.get, '/admin/system/health'),
        callApi(api.get, '/admin/system/stats'),
        callApi(api.get, '/admin/system/activity')
      ]);

      setHealthData(healthResponse.data);
      setStatsData(statsResponse.data);
      setRecentActivity(activityResponse.data.activities || []);

      // System tasks from health endpoint
      setSystemTasks([
        {
          id: 'update_event_status',
          name: 'Update Event Status',
          description: 'Automatically update event statuses based on current time',
          lastRun: healthData?.lastTaskRuns?.updateEventStatus,
          nextRun: null // Runs every 5 minutes
        },
        {
          id: 'cleanup_logs', 
          name: 'Clean Up Logs',
          description: 'Remove old log files to free up disk space',
          lastRun: healthData?.lastTaskRuns?.cleanupLogs,
          nextRun: null // Runs daily
        },
        {
          id: 'generate_reports',
          name: 'Generate Daily Reports',
          description: 'Generate system and user activity reports',
          lastRun: healthData?.lastTaskRuns?.generateReports,
          nextRun: null // Runs daily
        },
        {
          id: 'backup_database',
          name: 'Database Backup',
          description: 'Create backup of the database',
          lastRun: healthData?.lastTaskRuns?.backupDatabase,
          nextRun: null // Runs weekly
        }
      ]);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  const executeTask = async (taskId) => {
    setExecutingTask(taskId);
    try {
      await callApi(api.post, `/admin/system/tasks/${taskId}/execute`);
      await fetchSystemData(); // Refresh data after task execution
    } catch (err) {
      console.error('Failed to execute task:', err);
    } finally {
      setExecutingTask(null);
    }
  };

  if (loading && !healthData) {
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
              Monitor system health, performance, and manage background tasks
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

        {/* System Health Overview */}
        {healthData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Status</p>
                  <HealthStatus status={healthData.status} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Database</p>
                  <HealthStatus status={healthData.database?.status} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-lg font-bold text-gray-900">
                    {healthData.memory?.percentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-lg font-bold text-gray-900">
                    {healthData.uptime ? Math.floor(healthData.uptime / 3600) : 0}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={statsData.users?.total || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
              trend={statsData.users?.growth}
              color="blue"
            />

            <StatsCard
              title="Active Events"
              value={statsData.events?.active || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              trend={statsData.events?.growth}
              color="green"
            />

            <StatsCard
              title="Tasks Completed"
              value={statsData.tasks?.completed || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              trend={statsData.tasks?.growth}
              color="purple"
            />

            <StatsCard
              title="System Errors"
              value={statsData.errors?.count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
              trend={statsData.errors?.trend}
              color="red"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Tasks</h2>
            <div className="space-y-4">
              {systemTasks.map((task) => (
                <SystemTask
                  key={task.id}
                  task={task}
                  onExecute={executeTask}
                  executing={executingTask}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity activities={recentActivity} />
        </div>

        {/* Additional Monitoring Panels */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Error Logs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Errors</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {healthData?.recentErrors?.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">❌</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">{error.message}</p>
                      <p className="text-xs text-red-600 mt-1">{error.timestamp}</p>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No recent errors</p>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance</h2>
            <div className="space-y-4">
              {healthData?.performance && Object.entries(healthData.performance).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {typeof value === 'number' ? (
                      key.includes('time') || key.includes('duration') ? 
                        `${value.toFixed(2)}ms` : 
                        value.toLocaleString()
                    ) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}