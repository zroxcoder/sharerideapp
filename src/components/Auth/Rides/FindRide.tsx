import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp, 
  doc, 
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Ride } from '../../../types';
import { RideCard } from './RideCard';
import toast from 'react-hot-toast';

const toDate = (dateOrTimestamp: Date | Timestamp): Date => {
  if (dateOrTimestamp instanceof Timestamp) {
    return dateOrTimestamp.toDate();
  }
  return dateOrTimestamp;
};

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
      const q = query(ridesRef, where('status', '==', 'upcoming'));

      const querySnapshot = await getDocs(q);
      const ridesData: Ride[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ridesData.push({
          id: docSnap.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Ride);
      });

      let filteredRides = ridesData.filter(ride => 
        ride.driverId !== currentUser?.uid && 
        ride.availableSeats > 0
      );

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
          const rideDate = toDate(ride.date);
          return rideDate.toISOString().split('T')[0] === searchDate;
        });
      }

      filteredRides.sort((a, b) => {
        const dateA = toDate(a.date);
        const dateB = toDate(b.date);
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

    if (ride.availableSeats < 1) {
      toast.error('No available seats for this ride');
      return;
    }

    const loadingToast = toast.loading('Booking ride...');

    try {
      // ✅ Check for existing bookings
      const existingBookingsQuery = query(
        collection(db, 'bookings'),
        where('rideId', '==', ride.id),
        where('riderId', '==', currentUser.uid)
      );
      const existingBookings = await getDocs(existingBookingsQuery);

      if (!existingBookings.empty) {
        toast.dismiss(loadingToast);
        toast.error('You have already booked this ride');
        return;
      }

      // ✅ Create chat FIRST, then book the ride
      const chatId = await createOrGetChat(ride);

      if (!chatId) {
        toast.dismiss(loadingToast);
        toast.error('Failed to create chat. Please try again.');
        return;
      }

      // ✅ Book the ride in a transaction
      await runTransaction(db, async (transaction) => {
        const rideRef = doc(db, 'rides', ride.id);
        const rideDoc = await transaction.get(rideRef);

        if (!rideDoc.exists()) {
          throw new Error('Ride not found');
        }

        const currentSeats = rideDoc.data().availableSeats;
        if (currentSeats < 1) {
          throw new Error('No available seats');
        }

        const bookingRef = doc(collection(db, 'bookings'));
        const bookingData = {
          rideId: ride.id,
          riderId: currentUser.uid,
          riderName: userProfile.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          riderPhoto: userProfile.photoURL || '',
          seatsBooked: 1,
          totalPrice: ride.pricePerSeat,
          status: 'confirmed',
          createdAt: Timestamp.now(),
          chatId: chatId, // ✅ Link to chat
        };

        transaction.set(bookingRef, bookingData);
        transaction.update(rideRef, {
          availableSeats: currentSeats - 1,
          passengers: [...(rideDoc.data().passengers || []), currentUser.uid]
        });
      });

      toast.dismiss(loadingToast);
      toast.success('✅ Ride booked! Check Messages to contact the driver.');
      fetchRides();
    } catch (error: any) {
      console.error('Error booking ride:', error);
      toast.dismiss(loadingToast);
      
      if (error.message === 'No available seats') {
        toast.error('Sorry, this ride is now full');
      } else if (error.message === 'Ride not found') {
        toast.error('This ride is no longer available');
      } else if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your Firestore rules.');
      } else {
        toast.error('Failed to book ride. Please try again.');
      }
    }
  };

  // ✅ Return chat ID and ensure both users can access it
  const createOrGetChat = async (ride: Ride): Promise<string | null> => {
    if (!currentUser || !userProfile) {
      console.error('No current user or profile');
      return null;
    }

    try {
      // ✅ Check if chat already exists for this ride
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('rideId', '==', ride.id),
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const existingChats = await getDocs(q);
      
      if (!existingChats.empty) {
        console.log('✅ Chat already exists:', existingChats.docs[0].id);
        return existingChats.docs[0].id;
      }

      // ✅ Create new chat with proper structure
      const participants = [currentUser.uid, ride.driverId];
      const chatData = {
        participants: participants,
        participantDetails: {
          [currentUser.uid]: {
            name: userProfile.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
            photo: userProfile.photoURL || '',
          },
          [ride.driverId]: {
            name: ride.driverName || 'Driver',
            photo: ride.driverPhoto || '',
          },
        },
        rideId: ride.id,
        lastMessage: 'Ride booked - Start chatting!',
        lastMessageTime: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      const chatDocRef = await addDoc(chatsRef, chatData);
      console.log('✅ Chat created successfully:', chatDocRef.id);
      return chatDocRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find a Ride</h1>

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