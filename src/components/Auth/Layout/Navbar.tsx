import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                RideShare Connect
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {currentUser && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                Home
              </Link>
              <Link
                to="/find-rides"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                Find Rides
              </Link>
              {(userProfile?.userType === 'driver' || userProfile?.userType === 'both') && (
                <Link
                  to="/post-ride"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
                >
                  Post Ride
                </Link>
              )}
              <Link
                to="/my-rides"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                My Rides
              </Link>
              <Link
                to="/chat"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                Messages
              </Link>
              <Link
                to="/profile"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                Logout
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          {currentUser && (
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {currentUser && isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/find-rides"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Find Rides
            </Link>
            {(userProfile?.userType === 'driver' || userProfile?.userType === 'both') && (
              <Link
                to="/post-ride"
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Post Ride
              </Link>
            )}
            <Link
              to="/my-rides"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              My Rides
            </Link>
            <Link
              to="/chat"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Messages
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
