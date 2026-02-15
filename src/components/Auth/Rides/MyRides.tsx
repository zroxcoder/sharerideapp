import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const ridesQuery = query(
      collection(db, 'rides'),
      where('driverId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const posted: Ride[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        posted.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Ride);
      });
      setPostedRides(posted);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posted rides:', error);
      toast.error('Failed to load posted rides');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('riderId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
      const rideIds: string[] = [];
      snapshot.forEach((doc) => {
        const booking = doc.data() as Booking;
        rideIds.push(booking.rideId);
      });

      if (rideIds.length > 0) {
        const ridesRef = collection(db, 'rides');
        const ridesSnapshot = await getDocs(ridesRef);
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
      } else {
        setBookedRides([]);
      }
    }, (error) => {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booked rides');
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteRide = async (rideId: string) => {
    if (!currentUser) return;

    const loadingToast = toast.loading('Deleting ride...');

    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('rideId', '==', rideId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const deletePromises = bookingsSnapshot.docs.map(bookingDoc => 
        deleteDoc(doc(db, 'bookings', bookingDoc.id))
      );
      await Promise.all(deletePromises);

      const chatsQuery = query(
        collection(db, 'chats'),
        where('rideId', '==', rideId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatDeletePromises = chatsSnapshot.docs.map(chatDoc =>
        deleteDoc(doc(db, 'chats', chatDoc.id))
      );
      await Promise.all(chatDeletePromises);

      await deleteDoc(doc(db, 'rides', rideId));

      toast.dismiss(loadingToast);
      toast.success('Ride deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to delete ride');
    }
  };

  const currentRides = activeTab === 'posted' ? postedRides : bookedRides;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">My rides</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('posted')}
            className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
              activeTab === 'posted'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Posted ({postedRides.length})
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
              activeTab === 'booked'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Booked ({bookedRides.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading rides...</p>
          </div>
        ) : currentRides.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No {activeTab} rides
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'posted'
                ? 'Start by posting a ride to share your journey'
                : 'Browse available rides and book your next trip'}
            </p>
            {activeTab === 'posted' ? (
              <a
                href="/post-ride"
                className="inline-block px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition text-sm"
              >
                Post a ride
              </a>
            ) : (
              <a
                href="/find-rides"
                className="inline-block px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition text-sm"
              >
                Find rides
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRides.map((ride) => (
              <div key={ride.id}>
                <RideCard
                  ride={ride}
                  isOwner={activeTab === 'posted'}
                  showBookButton={false}
                />
                
                {activeTab === 'posted' && (
                  <div className="mt-3">
                    {deleteConfirm === ride.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-800 mb-3">
                          Delete this ride? All bookings will be cancelled.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteRide(ride.id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(ride.id)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete ride
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};