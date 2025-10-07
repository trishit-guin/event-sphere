import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import config from "../config/config";
import { ErrorDisplay, LoadingSpinner, useApi } from "./ErrorHandling";
import EventForm from "../components/EventForm";
import { CardListSkeleton, EventDetailSkeleton } from "./LoadingSkeletons";
import { ErrorToast } from "./ConfirmDialog";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      [config.eventStatus.DRAFT]: {
        color: 'bg-gray-100 text-gray-800',
        icon: '📝'
      },
      [config.eventStatus.ACTIVE]: {
        color: 'bg-green-100 text-green-800',
        icon: '🟢'
      },
      [config.eventStatus.COMPLETED]: {
        color: 'bg-blue-100 text-blue-800',
        icon: '✅'
      },
      [config.eventStatus.CANCELLED]: {
        color: 'bg-red-100 text-red-800',
        icon: '❌'
      }
    };
    return configs[status] || configs[config.eventStatus.DRAFT];
  };

  const statusConfig = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
      <span className="mr-1">{statusConfig.icon}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Event card component
const EventCard = ({ event, user, onEdit, onStatusChange }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getUserRole = () => {
    return user?.events?.find(ev => 
      (typeof ev.eventId === 'object' ? ev.eventId._id : ev.eventId) === event._id
    )?.role || null;
  };

  const canManageEvent = () => {
    const role = getUserRole();
    return ['admin', 'te_head', 'be_head'].includes(role);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilStart = () => {
    const start = new Date(event.startDate);
    const now = new Date();
    const days = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Started';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/events/${event._id}/status`, { status: newStatus });
      onStatusChange(event._id, newStatus);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update event status. Please try again.');
      setShowErrorToast(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={event.status} />
            {event.isUpcoming && (
              <span className="text-xs text-blue-600 font-medium">
                {getDaysUntilStart()}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
        </div>

        {canManageEvent() && (
          <div className="relative ml-4">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => onEdit(event)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Event
                  </button>
                  <hr className="my-1" />
                  {Object.values(config.eventStatus).map(status => (
                    status !== event.status && (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span>{event.currentParticipants || 0} / {event.maxParticipants} participants</span>
        </div>

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
          <span>Role: {getUserRole()?.toUpperCase() || 'Not assigned'}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          to={`/events/${event._id}`}
          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          View Details
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Error Toast */}
      {showErrorToast && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </div>
  );
};

export function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    myEvents: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.page]);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events);
      setFilteredEvents(res.data.events);
      setPagination(prev => ({
        ...prev,
        ...res.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load events. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEventStatusChange = (eventId, newStatus) => {
    setEvents(prev => prev.map(event => 
      event._id === eventId ? { ...event, status: newStatus } : event
    ));
    setFilteredEvents(prev => prev.map(event => 
      event._id === eventId ? { ...event, status: newStatus } : event
    ));
  };

  const handleEventSuccess = (updatedEvent) => {
    if (editingEvent) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event._id === updatedEvent._id ? updatedEvent : event
      ));
      setFilteredEvents(prev => prev.map(event => 
        event._id === updatedEvent._id ? updatedEvent : event
      ));
    } else {
      // Add new event
      setEvents(prev => [updatedEvent, ...prev]);
      setFilteredEvents(prev => [updatedEvent, ...prev]);
    }
    setShowCreateForm(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 h-10 w-48 bg-gray-200 rounded animate-pulse" />
          <CardListSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (showCreateForm || editingEvent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-4 py-8">
        <EventForm
          event={editingEvent}
          onSuccess={handleEventSuccess}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2">
              Events
            </h1>
            <p className="text-gray-600">
              {pagination.total} events found
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Create Event
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search events..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                {Object.values(config.eventStatus).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <select
                value={filters.myEvents}
                onChange={(e) => handleFilterChange('myEvents', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={false}>All Events</option>
                <option value={true}>My Events</option>
              </select>
            </div>
          </div>
        </div>

        <ErrorDisplay error={error} onDismiss={() => setError("")} />

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              user={user}
              onEdit={setEditingEvent}
              onStatusChange={handleEventStatusChange}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new event.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const { loading, error, callApi } = useApi();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await callApi(api.get, `/events/${eventId}`);
        setEvent(response.data.event);
      } catch (err) {
        // Error handled by useApi
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <EventDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ErrorDisplay error={error} />
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <StatusBadge status={event.status} />
              <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{event.title}</h1>
            </div>
            <Link
              to="/events"
              className="text-purple-600 hover:text-purple-700"
            >
              ← Back to Events
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">{event.description}</p>

              {event.users && event.users.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Participants</h2>
                  <div className="space-y-2">
                    {event.users.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{participant.userId.name}</span>
                          <span className="text-gray-500 text-sm ml-2">({participant.userId.email})</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {participant.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Start Date</span>
                  <p className="text-gray-900">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">End Date</span>
                  <p className="text-gray-900">
                    {new Date(event.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {event.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Location</span>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-600">Participants</span>
                  <p className="text-gray-900">
                    {event.currentParticipants} / {event.maxParticipants}
                  </p>
                </div>

                {event.daysUntilStart !== undefined && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Time Until Start</span>
                    <p className="text-gray-900">
                      {event.daysUntilStart > 0 ? `${event.daysUntilStart} days` : 'Started'}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-600">Duration</span>
                  <p className="text-gray-900">{event.duration} hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}