import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Login from './Login.jsx'
import Profile from './Profile.jsx'
import Taskboard from './Taskboard.jsx'
import Archive from './Archive.jsx'
import Dashboard from './Dashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import { EventList, EventDetails } from './Events.jsx'
import { EventList as EnhancedEventList, EventDetails as EnhancedEventDetails } from './components/EnhancedEvents.jsx'
import SystemAdmin from './components/SystemAdmin.jsx'
import Navbar from './Navbar.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ErrorDisplay, useToast, ToastContainer } from './components/ErrorHandling.jsx'
import api from './api'
import config from './config/config.js'
import { hasManagementRole } from './constants/roles'

// Protected Route Component
function ProtectedRoute({ children, user, setUser }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem(config.auth.tokenStorageKey);
      
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Validate token with backend
        const res = await api.get('/users/me');
        setUser(res.data.user);
        setIsValid(true);
      } catch (err) {
        // Token is invalid or expired
        localStorage.removeItem(config.auth.tokenStorageKey);
        setUser(null);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [setUser]);

  if (isValidating) {
    return <div className="h-screen flex items-center justify-center text-purple-700 text-xl font-bold">Validating...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route Component - Only for management roles (te_head, be_head, admin)
function AdminRoute({ children, user, setUser }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem(config.auth.tokenStorageKey);
      
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Validate token with backend
        const res = await api.get('/users/me');
        setUser(res.data.user);
        
        // Check if user has management role (te_head, be_head, or admin)
        const userHasManagementRole = hasManagementRole(res.data.user);
        setIsValid(userHasManagementRole);
        
        if (!userHasManagementRole) {
          localStorage.removeItem(config.auth.tokenStorageKey);
          setUser(null);
        }
      } catch (err) {
        // Token is invalid or expired
        localStorage.removeItem(config.auth.tokenStorageKey);
        setUser(null);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [setUser]);

  if (isValidating) {
    return <div className="h-screen flex items-center justify-center text-purple-700 text-xl font-bold">Validating...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Wrapper components to pass eventId from URL params
function TaskboardWithEvent({ user, setUser }) {
  const { eventId } = useParams();
  return (
    <ProtectedRoute user={user} setUser={setUser}>
      <Taskboard eventId={eventId} user={user} />
    </ProtectedRoute>
  );
}

function ArchiveWithEvent({ user, setUser }) {
  const { eventId } = useParams();
  return (
    <ProtectedRoute user={user} setUser={setUser}>
      <Archive eventId={eventId} user={user} />
    </ProtectedRoute>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(config.auth.tokenStorageKey);
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/users/me');
        setUser(res.data.user);
      } catch (err) {
        // Token is invalid, remove it
        localStorage.removeItem(config.auth.tokenStorageKey);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-purple-700 text-xl font-bold">Loading...</div>;
  }

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/taskboard" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <Taskboard user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/taskboard/:eventId" 
          element={<TaskboardWithEvent user={user} setUser={setUser} />} 
        />
        <Route 
          path="/archive" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <Archive user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/archive/:eventId" 
          element={<ArchiveWithEvent user={user} setUser={setUser} />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute user={user} setUser={setUser}>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/system" 
          element={
            <AdminRoute user={user} setUser={setUser}>
              <SystemAdmin />
            </AdminRoute>
          } 
        />
        <Route 
          path="/events" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <EnhancedEventList user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/events/:eventId" 
          element={
            <ProtectedRoute user={user} setUser={setUser}>
              <EnhancedEventDetails user={user} />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
