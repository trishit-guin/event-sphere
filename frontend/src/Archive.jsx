import React, { useEffect, useState } from "react";
import api from "./api";
import { ArchiveListSkeleton } from "./components/LoadingSkeletons";
import { ConfirmDialog, SuccessToast, ErrorToast } from "./components/ConfirmDialog";

function AddArchiveModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ title, driveUrl });
    setTitle("");
    setDriveUrl("");
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
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Add Drive Link</h2>
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
            <label className="block text-gray-700 font-medium mb-1">Google Drive URL</label>
            <input
              type="url"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              required
            />
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
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditArchiveModal({ open, onClose, onEdit, link }) {
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  // Update form when link changes
  useEffect(() => {
    if (link) {
      setTitle(link.title || "");
      setDriveUrl(link.driveUrl || "");
    }
  }, [link]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit({ title, driveUrl });
    onClose();
  };

  if (!open || !link) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Edit Drive Link</h2>
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
            <label className="block text-gray-700 font-medium mb-1">Google Drive URL</label>
            <input
              type="url"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              required
            />
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
              Update Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Archive({ eventId: propEventId, user }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  
  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Toast notifications
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("No events assigned to you. Please contact an administrator.");
      return;
    }
    const fetchLinks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/archive/${eventId}`);
        setLinks(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load archive links.");
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [eventId]);

  const handleAddLink = async (linkData) => {
    try {
      const res = await api.post('/archive', {
        ...linkData,
        eventId: eventId
      });
      setLinks([...links, res.data.link]);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add archive link.");
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    
    setDeleting(true);
    try {
      const response = await api.delete(`/archive/${linkToDelete._id}`);
      setLinks(links.filter(link => link._id !== linkToDelete._id));
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
      setSuccessMessage(response.data.message || 'Archive link deleted successfully');
      setShowSuccessToast(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete archive link.";
      setErrorMessage(errorMsg);
      setShowErrorToast(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditLink = async (linkId, updatedData) => {
    try {
      const res = await api.put(`/archive/${linkId}`, updatedData);
      setLinks(links.map(link => link._id === linkId ? res.data.link : link));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update archive link.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-2 py-8 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700">Drive Archive</h1>
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
              + Add Link
            </button>
          </div>
        </div>
        <AddArchiveModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddLink}
        />
        <EditArchiveModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingLink(null);
          }}
          onEdit={(updatedData) => handleEditLink(editingLink._id, updatedData)}
          link={editingLink}
        />
        {loading ? (
          <ArchiveListSkeleton />
        ) : error ? (
          <div className="text-red-600 text-center py-8 font-semibold">{error}</div>
        ) : (
          <div className="space-y-6">
            {links.length === 0 && (
              <div className="text-gray-400 italic text-center py-8">No archive links</div>
            )}
            {links.map((link) => (
              <div
                key={link._id}
                className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 hover:shadow-lg transition"
              >
                <div>
                  <div className="text-lg font-bold text-purple-700 mb-1">{link.title}</div>
                  <a
                    href={link.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline text-sm break-all"
                  >
                    {link.driveUrl}
                  </a>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button 
                    className="px-4 py-1.5 rounded bg-purple-100 text-purple-700 font-semibold text-sm hover:bg-purple-200 transition"
                    onClick={() => {
                      setEditingLink(link);
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-4 py-1.5 rounded bg-red-100 text-red-600 font-semibold text-sm hover:bg-red-200 transition"
                    onClick={() => {
                      setLinkToDelete(link);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deleting}
                  >
                    {deleting && linkToDelete?._id === link._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Archive Link"
          message={`Are you sure you want to delete "${linkToDelete?.title}"? This action cannot be undone.`}
          type="danger"
          confirmText="Delete Link"
          cancelText="Cancel"
          onConfirm={handleDeleteLink}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setLinkToDelete(null);
          }}
          loading={deleting}
        />
      )}

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