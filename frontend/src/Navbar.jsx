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
    <nav className="flex items-center justify-between px-8 py-4 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 h-16 shadow-lg shadow-slate-900/50">
      <div className="flex items-center gap-8">
        <Link 
          to="/" 
          className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-amber-400 hover:from-teal-200 hover:to-amber-300 transition-all"
          style={{fontFamily: "'Playfair Display', serif"}}
        >
          EventSphere
        </Link>
        {isLoggedIn && (
          <ul className="hidden md:flex gap-6 text-slate-300 font-medium">
            <li><Link to="/" className="hover:text-teal-400 transition-colors relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link></li>
            <li><Link to="/events" className="hover:text-teal-400 transition-colors relative group">
              Events
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link></li>
            <li><Link to="/taskboard" className="hover:text-teal-400 transition-colors relative group">
              Taskboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link></li>
            <li><Link to="/archive" className="hover:text-teal-400 transition-colors relative group">
              Archive
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link></li>
            <li><Link to="/dashboard" className="hover:text-teal-400 transition-colors relative group">
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link></li>
            {userHasManagementRole && (
              <li><Link to="/admin" className="hover:text-amber-400 transition-colors font-bold relative group">
                Management
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </Link></li>
            )}
            {userIsAdmin && (
              <li><Link to="/admin/system" className="hover:text-amber-400 transition-colors font-bold relative group">
                System
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </Link></li>
            )}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <Link 
              to="/profile" 
              className="text-slate-300 hover:text-teal-400 transition-colors font-medium"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="relative overflow-hidden group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">Logout</span>
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            className="relative overflow-hidden group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
} 