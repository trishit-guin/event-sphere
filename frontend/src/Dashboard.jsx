import React, { useEffect, useState } from "react";
import api from "./api";

const statusColors = {
  todo: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/users/me");
        setUser(res.data.user);
        setAssignedTasks(res.data.assignedTasks);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to get event title from eventId
  const getEventTitle = (eventId) => {
    const ev = user?.events?.find(e => (typeof e.eventId === 'object' ? e.eventId._id : e.eventId) === eventId);
    return ev?.eventId?.title || ev?.eventId || 'Event';
  };

  if (loading) {
    return (
      <div className="h-auto flex items-center justify-center min-h-screen text-purple-700 text-xl font-bold">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="h-auto flex items-center justify-center min-h-screen text-red-600 text-lg font-semibold">{error}</div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-2 py-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-8">User Dashboard</h1>
        {/* User Info */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100">
          <div>
            <div className="text-xl font-bold text-gray-900 mb-1">{user?.name}</div>
            <div className="text-gray-600 text-sm mb-2">{user?.email}</div>
            <div className="flex flex-wrap gap-2">
              {user?.events?.map((ev, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {ev.eventId?.title || ev.eventId || "Event"} ({ev.role})
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Assigned Tasks */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <div className="text-lg font-bold text-purple-700 mb-4">Assigned Tasks</div>
          {assignedTasks.length === 0 && (
            <div className="text-gray-400 italic text-center py-8">No tasks assigned</div>
          )}
          <div className="space-y-4">
            {assignedTasks.map((task) => (
              <div key={task._id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-900">{task.title}</div>
                  <div className="text-xs text-gray-500">Event: {getEventTitle(task.eventId)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">Deadline: <span className="font-medium text-purple-600">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 