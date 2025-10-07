import React, { useState, useEffect } from "react";
import api from "../api";
import { ROLE_LABELS, fetchRolesFromAPI } from "../constants/roles";

export default function EventCreationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    maxParticipants: "",
    roles: ["volunteer"] // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roleLabels, setRoleLabels] = useState({});

  // Fetch roles from API on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await fetchRolesFromAPI();
        // Exclude admin role for events
        const eventRoles = rolesData.availableRoles
          .filter(role => role.value !== 'admin')
          .map(role => role.value);
        setAvailableRoles(eventRoles);
        setRoleLabels(rolesData.roleLabels);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    loadRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleRoleChange = (index, value) => {
    const newRoles = [...formData.roles];
    newRoles[index] = value;
    setFormData(prev => ({ ...prev, roles: newRoles }));
  };

  const addRole = () => {
    setFormData(prev => ({ ...prev, roles: [...prev.roles, "volunteer"] }));
  };

  const removeRole = (index) => {
    if (formData.roles.length > 1) {
      const newRoles = formData.roles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, roles: newRoles }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Event title is required";
    if (!formData.description.trim()) return "Event description is required";
    if (!formData.startDate) return "Start date and time are required";
    if (!formData.endDate) return "End date and time are required";
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    
    if (start <= now) {
      return "Start date must be in the future";
    }
    
    if (end <= start) {
      return "End date must be after start date";
    }
    
    const duration = (end - start) / (1000 * 60); // duration in minutes
    if (duration < 15) {
      return "Event must be at least 15 minutes long";
    }
    
    if (duration > 365 * 24 * 60) {
      return "Event cannot exceed 365 days in duration";
    }
    
    if (formData.maxParticipants && formData.maxParticipants < 1) {
      return "Max participants must be at least 1";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the request data
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location.trim() || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        roles: formData.roles.filter(role => role) // Remove empty roles
      };

      const response = await api.post('/events', eventData);
      
      if (onSuccess) {
        onSuccess(response.data.event || response.data);
      }
    } catch (err) {
      console.error('Event creation error:', err);
      setError(
        err.response?.data?.message ||
        "Failed to create event. Please check the form and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter event title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter event location"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter event description"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Multiple events can occur on the same date</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="datetime-local"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must be after start date (15 min minimum)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Participants
          </label>
          <input
            type="number"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Roles *
        </label>
        {formData.roles.map((role, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <select
              value={role}
              onChange={(e) => handleRoleChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableRoles.map(roleOption => (
                <option key={roleOption} value={roleOption}>
                  {roleLabels[roleOption] || roleOption}
                </option>
              ))}
            </select>
            {formData.roles.length > 1 && (
              <button
                type="button"
                onClick={() => removeRole(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addRole}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
        >
          Add Role
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}