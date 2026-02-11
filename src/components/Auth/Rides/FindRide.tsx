import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Ride, Booking } from '../../../types';
import { RideCard } from './RideCard';
import toast from 'react-hot-toast';

export const FindRide: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const fetchRides = async () => {
    setLoading(true);
    try {
      const ridesRef = collection(db, 'rides');
      let q = query(ridesRef, where('status', '==', 'upcoming'));

      const querySnapshot = await getDocs(q);
      const ridesData: Ride[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ridesData.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Ride);
      });

      // Filter rides
      let filteredRides = ridesData.filter(ride => ride.driverId !== currentUser?.uid);

      if (searchFrom) {
        filteredRides = filteredRides.filter(ride =>
          ride.from.toLowerCase().includes(searchFrom.toLowerCase())
        );
      }

      if (searchTo) {
        filteredRides = filteredRides.filter(ride =>
          ride.to.toLowerCase().includes(searchTo.toLowerCase())
        );
      }

      if (searchDate) {
        filteredRides = filteredRides.filter(ride => {
          const rideDate = ride.date instanceof Date ? ride.date : new Date(ride.date);
          return rideDate.toISOString().split('T')[0] === searchDate;
        });
      }

      // Sort by date
      filteredRides.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      setRides(filteredRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [currentUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  const handleBookRide = async (ride: Ride) => {
    if (!currentUser || !userProfile) {
      toast.error('Please login to book a ride');
      return;
    }

    try {
      const booking: Omit<Booking, 'id'> = {
        rideId: ride.id,
        riderId: currentUser.uid,
        riderName: userProfile.displayName,
        riderPhoto: userProfile.photoURL,
        seatsBooked: 1,
        totalPrice: ride.pricePerSeat,
        status: 'pending',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'bookings'), {
        ...booking,
        createdAt: new Date().toISOString(),
      });

      // Create a chat between rider and driver
      const chatData = {
        participants: [currentUser.uid, ride.driverId],
        participantDetails: {
          [currentUser.uid]: {
            name: userProfile.displayName,
            photo: userProfile.photoURL,
          },
          [ride.driverId]: {
            name: ride.driverName,
            photo: ride.driverPhoto,
          },
        },
        rideId: ride.id,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'chats'), chatData);

      toast.success('Ride booked successfully! Check your messages to contact the driver.');
      fetchRides();
    } catch (error) {
      console.error('Error booking ride:', error);
      toast.error('Failed to book ride');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find a Ride</h1>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
              placeholder="From"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              placeholder="To"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading rides...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rides found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onBook={() => handleBookRide(ride)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
