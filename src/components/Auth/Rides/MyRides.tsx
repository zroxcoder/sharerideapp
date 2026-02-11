import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Ride, Booking } from '../../../types';
import { RideCard } from './RideCard';
import toast from 'react-hot-toast';

export const MyRides: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'posted' | 'booked'>('posted');
  const [postedRides, setPostedRides] = useState<Ride[]>([]);
  const [bookedRides, setBookedRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchRides();
    }
  }, [currentUser]);

  const fetchRides = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Fetch posted rides
      const postedQuery = query(
        collection(db, 'rides'),
        where('driverId', '==', currentUser.uid)
      );
      const postedSnapshot = await getDocs(postedQuery);
      const posted: Ride[] = [];
      postedSnapshot.forEach((doc) => {
        const data = doc.data();
        posted.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Ride);
      });
      setPostedRides(posted);

      // Fetch booked rides
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('riderId', '==', currentUser.uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const rideIds: string[] = [];
      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data() as Booking;
        rideIds.push(booking.rideId);
      });

      if (rideIds.length > 0) {
        const ridesQuery = collection(db, 'rides');
        const ridesSnapshot = await getDocs(ridesQuery);
        const booked: Ride[] = [];
        ridesSnapshot.forEach((doc) => {
          if (rideIds.includes(doc.id)) {
            const data = doc.data();
            booked.push({
              id: doc.id,
              ...data,
              date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            } as Ride);
          }
        });
        setBookedRides(booked);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const currentRides = activeTab === 'posted' ? postedRides : bookedRides;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Rides</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex space-x-2">
          <button
            onClick={() => setActiveTab('posted')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === 'posted'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Posted Rides ({postedRides.length})
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
              activeTab === 'booked'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Booked Rides ({bookedRides.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading rides...</p>
          </div>
        ) : currentRides.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} rides
            </h3>
            <p className="text-gray-600">
              {activeTab === 'posted'
                ? 'Start by posting a ride to share your journey'
                : 'Browse available rides and book your next trip'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                isOwner={activeTab === 'posted'}
                showBookButton={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
