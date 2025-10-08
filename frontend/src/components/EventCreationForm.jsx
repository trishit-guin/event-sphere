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
    roles: [] // Will be set after roles are loaded
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
        
        // Set default role after roles are loaded
        if (eventRoles.length > 0 && formData.roles.length === 0) {
          setFormData(prev => ({ ...prev, roles: [eventRoles[0]] }));
        }
      } catch (err) {
        console.error('Failed to load roles:', err);
        // Set fallback roles if API fails
        const fallbackRoles = ['volunteer', 'team_member', 'event_coordinator', 'te_head', 'be_head'];
        setAvailableRoles(fallbackRoles);
        setRoleLabels({
          'volunteer': 'Volunteer',
          'team_member': 'Team Member',
          'event_coordinator': 'Event Coordinator', 
          'te_head': 'Technical Head',
          'be_head': 'Backend Head'
        });
        
        // Set default role
        if (formData.roles.length === 0) {
          setFormData(prev => ({ ...prev, roles: ['volunteer'] }));
        }
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
      // Prepare and validate the request data
      const cleanedRoles = formData.roles.filter(role => role && role.trim()).map(role => role.trim());
      
      // Client-side validation before sending
      const validationErrors = [];
      
      if (!formData.title.trim()) validationErrors.push('Title is required');
      else if (formData.title.trim().length < 3) validationErrors.push('Title must be at least 3 characters');
      else if (formData.title.trim().length > 100) validationErrors.push('Title must not exceed 100 characters');
      
      if (!formData.description.trim()) validationErrors.push('Description is required');
      else if (formData.description.trim().length < 10) validationErrors.push('Description must be at least 10 characters');
      else if (formData.description.trim().length > 1000) validationErrors.push('Description must not exceed 1000 characters');
      
      if (!formData.startDate) validationErrors.push('Start date is required');
      if (!formData.endDate) validationErrors.push('End date is required');
      
      if (cleanedRoles.length === 0) validationErrors.push('At least one role is required');
      
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        setLoading(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location.trim() || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        roles: cleanedRoles
      };
      
      // Validate frontend data before sending
      console.log('Form data before validation:', formData);
      console.log('Processed event data:', eventData);
      console.log('Validation checks:', {
        titleLength: eventData.title.length,
        descriptionLength: eventData.description.length,
        hasStartDate: !!eventData.startDate,
        hasEndDate: !!eventData.endDate,
        startDateValid: !isNaN(new Date(eventData.startDate).getTime()),
        endDateValid: !isNaN(new Date(eventData.endDate).getTime()),
        rolesCount: eventData.roles.length,
        rolesContent: eventData.roles,
        maxParticipantsType: typeof eventData.maxParticipants,
        maxParticipantsValue: eventData.maxParticipants
      });
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Request headers:', api.defaults.headers);

      const response = await api.post('/events', eventData);
      
      if (onSuccess) {
        onSuccess(response.data.event || response.data);
      }
    } catch (err) {
      console.error('Event creation error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        code: err.code,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
          timeout: err.config?.timeout
        }
      });
      
      // Test if backend is reachable
      try {
        const healthCheck = await api.get('/health');
        console.log('Backend health check passed:', healthCheck.data);
      } catch (healthErr) {
        console.error('Backend appears to be down:', {
          message: healthErr.message,
          code: healthErr.code,
          status: healthErr.response?.status
        });
      }
      
      let errorMessage = "Failed to create event. Please check the form and try again.";
      
      // Show specific validation errors
      if (err.response?.status === 400) {
        const responseData = err.response?.data;
        console.error('400 Error response data:', responseData);
        
        let validationErrors = null;
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          // Handle array of error objects: [{field: 'title', message: 'Title is required'}]
          validationErrors = responseData.errors.map(e => e.message || e.field).join(', ');
        } else if (responseData?.errors && typeof responseData.errors === 'string') {
          // Handle string error
          validationErrors = responseData.errors;
        } else if (responseData?.message) {
          // Handle message field
          validationErrors = responseData.message;
        }
        
        if (validationErrors) {
          errorMessage = `Validation failed: ${validationErrors}`;
        } else {
          errorMessage = "Validation failed. Please check all required fields.";
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to create events.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Invalid event data. Please check your inputs.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      }
      
      setError(errorMessage);
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
            max="500"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Optional (max 500)"
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