import React, { useEffect, useState } from "react";
import api from "./api";

const columns = [
  { key: "todo", label: "To Do", color: "bg-purple-100" },
  { key: "in_progress", label: "In Progress", color: "bg-purple-50" },
  { key: "done", label: "Done", color: "bg-green-50" },
];

function AddTaskModal({ open, onClose, onAdd, addingTask, users, loadingUsers }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("todo");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ title, description, deadline, assignedTo, status });
    setTitle("");
    setDescription("");
    setDeadline("");
    setAssignedTo("");
    setStatus("todo");
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Add Task</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Deadline</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Assigned To</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                disabled={loadingUsers}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Status</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingUsers || addingTask}
            >
              {addingTask ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTaskModal({ open, onClose, onEdit, task, users, loadingUsers }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("todo");

  // Update form when task changes
  useEffect(() => {
    if (task) {
      console.log('EditTaskModal - task data:', task);
      console.log('EditTaskModal - users data:', users);
      
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDeadline(task.deadline ? task.deadline.split('T')[0] : "");
      
      // Handle assignedTo field - it could be a populated user object or just an ID
      let assignedToValue = "";
      if (task.assignedTo) {
        if (typeof task.assignedTo === 'object' && task.assignedTo._id) {
          // It's a populated user object
          assignedToValue = task.assignedTo._id;
        } else if (typeof task.assignedTo === 'string') {
          // It's just the user ID string
          assignedToValue = task.assignedTo;
        }
      }
      console.log('EditTaskModal - assignedTo value:', assignedToValue);
      setAssignedTo(assignedToValue);
      
      setStatus(task.status || "todo");
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit({ title, description, deadline, assignedTo, status });
    onClose();
  };

  if (!open || !task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Edit Task</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Deadline</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Assigned To</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                disabled={loadingUsers}
              >
                <option value="">Select a user</option>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No users available</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Status</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
            >
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Taskboard({ eventId: propEventId, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Use propEventId if provided, otherwise use the last event the user is assigned to
  const eventId = propEventId || (user?.events && user.events.length > 0 ? 
    (user.events[user.events.length - 1]?.eventId?._id || user.events[user.events.length - 1]?.eventId) : 
    null);

  // Helper to get event title
  const getEventTitle = () => {
    if (propEventId) {
      // If propEventId is provided, find it in user's events
      const event = user?.events?.find(ev => 
        (typeof ev.eventId === 'object' ? ev.eventId._id : ev.eventId) === propEventId
      );
      return event?.eventId?.title || event?.eventId || 'Event';
    } else {
      // Use the last event
      const lastEvent = user?.events?.[user.events.length - 1];
      return lastEvent?.eventId?.title || lastEvent?.eventId || 'Event';
    }
  };

  // Fetch users for both add and edit modals
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("No events assigned to you. Please contact an administrator.");
      return;
    }
    const fetchTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/tasks/${eventId}`);
        setTasks(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [eventId]);

  const handleAddTask = async (taskData) => {
    setAddingTask(true);
    try {
      const res = await api.post('/tasks', {
        ...taskData,
        eventId: eventId
      });
      setTasks([...tasks, res.data.task]);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleEditTask = async (taskId, updatedData) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updatedData);
      setTasks(tasks.map(task => task._id === taskId ? res.data.task : task));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-2 py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700">Taskboard</h1>
          <div className="flex items-center gap-4">
            {!propEventId && (
              <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {getEventTitle()}
              </span>
            )}
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition shadow"
              onClick={() => setShowModal(true)}
            >
              + Add Task
            </button>
          </div>
        </div>
        <AddTaskModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddTask}
          addingTask={addingTask}
          users={users}
          loadingUsers={loadingUsers}
        />
        <EditTaskModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onEdit={(updatedData) => handleEditTask(editingTask._id, updatedData)}
          task={editingTask}
          users={users}
          loadingUsers={loadingUsers}
        />
        {loading ? (
          <div className="text-purple-700 text-center py-8 font-bold">Loading tasks...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-8 font-semibold">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {columns.map((col) => (
              <div key={col.key} className="flex flex-col">
                <div className={`text-lg font-bold mb-4 px-2 py-2 rounded-lg ${col.color} text-purple-700`}>{col.label}</div>
                <div className="flex-1 space-y-6">
                  {tasks.filter((t) => t.status === col.key).length === 0 && (
                    <div className="text-gray-400 italic text-center py-8">No tasks</div>
                  )}
                  {tasks
                    .filter((t) => t.status === col.key)
                    .map((task) => (
                      <div
                        key={task._id}
                        className="bg-white rounded-2xl shadow p-5 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition"
                      >
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold text-purple-700">{task.title}</h2>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                            {task.assignedTo?.name || task.assignedTo || "Unassigned"}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{task.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="">Deadline:</span>
                          <span className="font-medium text-purple-600">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button 
                            className="px-4 py-1.5 rounded bg-purple-100 text-purple-700 font-semibold text-sm hover:bg-purple-200 transition"
                            onClick={() => {
                              setEditingTask(task);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="px-4 py-1.5 rounded bg-red-100 text-red-600 font-semibold text-sm hover:bg-red-200 transition"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 