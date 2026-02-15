import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const Home: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Go anywhere with<br />RideShare
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Request a ride, hop in, and go. Or become a driver and earn on your schedule.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
          <Link
            to="/find-rides"
            className="group bg-gray-50 hover:bg-gray-100 rounded-3xl p-8 transition-all duration-200 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Find a ride</h3>
            <p className="text-gray-600">Search and book rides to your destination</p>
          </Link>

          {(userProfile?.userType === 'driver' || userProfile?.userType === 'both') && (
            <Link
              to="/post-ride"
              className="group bg-gray-50 hover:bg-gray-100 rounded-3xl p-8 transition-all duration-200 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Offer a ride</h3>
              <p className="text-gray-600">Post your ride and earn money</p>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto py-12 border-t border-gray-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">1M+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">100K+</div>
            <div className="text-gray-600">Rides Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">4.9★</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {[
            { icon: '🔒', title: 'Safe & Secure', desc: 'Verified users only' },
            { icon: '💬', title: 'Real-time Chat', desc: 'Connect instantly' },
            { icon: '⭐', title: 'Ratings', desc: 'Trusted community' },
            { icon: '💰', title: 'Save Money', desc: 'Split fuel costs' },
          ].map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};