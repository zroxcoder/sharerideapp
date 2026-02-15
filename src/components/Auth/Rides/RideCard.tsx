import React from 'react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Ride } from '../../../types';

interface RideCardProps {
  ride: Ride;
  onBook?: () => void;
  isOwner?: boolean;
  showBookButton?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onBook, isOwner, showBookButton = true }) => {
  const rideDate = ride.date instanceof Date 
    ? ride.date 
    : ride.date instanceof Timestamp 
      ? ride.date.toDate() 
      : new Date(ride.date);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Driver Info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
              {ride.driverName.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-900">{ride.driverName}</div>
              <div className="flex items-center text-sm text-gray-600 mt-0.5">
                <span className="text-yellow-500 mr-1">⭐</span>
                {ride.driverRating?.toFixed(1) || '5.0'}
              </div>
            </div>
          </div>
          {isOwner && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              Your Ride
            </span>
          )}
        </div>
      </div>

      {/* Route Info */}
      <div className="p-5 space-y-4">
        {/* From Location */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">Pickup</div>
            <div className="font-medium text-gray-900 truncate">{ride.from}</div>
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-3 h-8 flex items-center justify-center">
              <div className="w-0.5 h-full bg-gray-300"></div>
            </div>
          </div>
        </div>

        {/* To Location */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-3 h-3 bg-black"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">Dropoff</div>
            <div className="font-medium text-gray-900 truncate">{ride.to}</div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(rideDate, 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {ride.time}
          </div>
        </div>

        {/* Description */}
        {ride.description && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">{ride.description}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'}
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            ${ride.pricePerSeat}
          </div>
        </div>
        {showBookButton && !isOwner && (
          <button
            onClick={onBook}
            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
          >
            Book
          </button>
        )}
      </div>
    </div>
  );
};