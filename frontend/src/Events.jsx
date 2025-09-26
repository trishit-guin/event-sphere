import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "./api";

export function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load events."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Helper to get user's role for an event
  const getUserRole = (eventId) => {
    return user?.events?.find(ev => (typeof ev.eventId === 'object' ? ev.eventId._id : ev.eventId) === eventId)?.role || null;
  };

  if (loading) {
    return <div className="h-auto flex items-center justify-center min-h-screen text-purple-700 text-xl font-bold">Loading events...</div>;
  }
  if (error) {
    return <div className="h-auto flex items-center justify-center min-h-screen text-red-600 text-lg font-semibold">{error}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white px-2 py-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-8">My Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event) => (
            <Link
              to={`/events/${event._id}`}
              key={event._id}
              className="block bg-white rounded-2xl shadow p-6 border border-gray-100 hover:shadow-lg transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-purple-700 group-hover:underline">{event.title}</div>
                {getUserRole(event._id) && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {getUserRole(event._id)}
                  </span>
                )}
              </div>
              <div className="text-gray-600 mb-2">{event.description}</div>
              {/* If you have a date field, show it here */}
              {/* <div className="text-xs text-gray-500">Date: <span className="font-medium text-purple-600">{event.date}</span></div> */}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventDetails({ user }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/events`); // No GET /events/:id, so fetch all and filter
        const found = res.data.find(e => e._id === eventId);
        setEvent(found || null);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load event."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Helper to get user's role for this event
  const getUserRole = () => {
    return (
      user?.events?.find(ev => {
        const id = typeof ev.eventId === 'object' ? ev.eventId._id : ev.eventId;
        return String(id) === String(eventId);
      })?.role || null
    );
  };

  if (loading) {
    return <div className="h-auto flex items-center justify-center min-h-screen text-purple-700 text-xl font-bold">Loading event...</div>;
  }
  if (error || !event) {
    return (
      <div className="h-auto flex items-center justify-center bg-gradient-to-br from-purple-50 to-white overflow-x-hidden">
        <div className="text-xl text-gray-500">Event not found.</div>
      </div>
    );
  }
  return (
    <div className="h-auto bg-gradient-to-br from-purple-50 to-white px-2 py-8 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        <Link to="/events" className="text-purple-600 hover:underline font-medium mb-6 inline-block">&larr; Back to Events</Link>
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-100">
          <h1 className="text-3xl font-extrabold text-purple-700 mb-2">{event.title}</h1>
          <div className="text-gray-600 mb-4">{event.description}</div>
          {/* If you have a date field, show it here */}
          {/* <div className="mb-2 text-sm text-gray-500">Date: <span className="font-medium text-purple-600">{event.date}</span></div> */}
          <div className="mb-2 text-sm text-gray-500">Your Role: <span className="font-medium text-purple-700">{getUserRole() || 'N/A'}</span></div>
          <div className="flex gap-4 mt-6">
            <Link to={`/taskboard/${eventId}`} className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition shadow">Taskboard</Link>
            <Link to={`/archive/${eventId}`} className="bg-purple-100 text-purple-700 px-5 py-2 rounded-lg font-semibold hover:bg-purple-200 transition shadow">Drive Archive</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 