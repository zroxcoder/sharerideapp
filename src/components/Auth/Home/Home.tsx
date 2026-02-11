import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const Home: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RideShare Connect
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Save money, reduce traffic, and make your daily commute more sustainable with carpooling
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition">
            <div className="text-4xl font-bold text-blue-600 mb-2">50%</div>
            <div className="text-gray-600">Save on Travel Costs</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition">
            <div className="text-4xl font-bold text-green-600 mb-2">70%</div>
            <div className="text-gray-600">Reduce Carbon Footprint</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition">
            <div className="text-4xl font-bold text-purple-600 mb-2">1000+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Link
            to="/find-rides"
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition transform hover:-translate-y-1"
          >
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Find a Ride</h3>
                <p className="text-gray-600">
                  Search for available rides to your destination and save on travel costs
                </p>
              </div>
            </div>
          </Link>

          {(userProfile?.userType === 'driver' || userProfile?.userType === 'both') && (
            <Link
              to="/post-ride"
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-xl p-3">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Offer a Ride</h3>
                  <p className="text-gray-600">
                    Share your empty seats and earn money while helping others commute
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose RideShare Connect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Secure & Safe</h3>
              <p className="text-gray-600 text-sm">Verified users and secure payment system</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Real-time Chat</h3>
              <p className="text-gray-600 text-sm">Communicate directly with drivers and riders</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Rating System</h3>
              <p className="text-gray-600 text-sm">Build trust through peer reviews</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Save Money</h3>
              <p className="text-gray-600 text-sm">Split fuel costs and reduce expenses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
