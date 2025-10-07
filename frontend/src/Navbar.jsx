import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdmin, hasManagementRole } from "./constants/roles";
import config from "./config/config.js";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const userIsAdmin = isAdmin(user);
  const userHasManagementRole = hasManagementRole(user);

  const handleLogout = () => {
    localStorage.removeItem(config.auth.tokenStorageKey);
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-10 h-16">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-extrabold text-purple-700 tracking-tight">EventSphere</Link>
        {isLoggedIn && (
          <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
            <li><Link to="/" className="hover:text-purple-600 transition">Home</Link></li>
            <li><Link to="/events" className="hover:text-purple-600 transition">Events</Link></li>
            <li><Link to="/taskboard" className="hover:text-purple-600 transition">Taskboard</Link></li>
            <li><Link to="/archive" className="hover:text-purple-600 transition">Archive</Link></li>
            <li><Link to="/dashboard" className="hover:text-purple-600 transition">Dashboard</Link></li>
            {userHasManagementRole && (
              <li><Link to="/admin" className="hover:text-purple-600 transition font-bold">Management</Link></li>
            )}
            {userIsAdmin && (
              <>
                <li><Link to="/admin/users" className="hover:text-purple-600 transition font-bold">User Admin</Link></li>
                <li><Link to="/admin/system" className="hover:text-purple-600 transition font-bold">System</Link></li>
              </>
            )}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <Link 
              to="/profile" 
              className="text-gray-700 hover:text-purple-600 transition font-medium"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 transition">Login</Link>
        )}
      </div>
    </nav>
  );
} 