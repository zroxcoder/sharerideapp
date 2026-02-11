import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  userType: 'driver' | 'rider' | 'both';
  rating?: number;
  totalRides?: number;
  createdAt: Date | Timestamp; // ✅ Allow both
  bio?: string;
  vehicleInfo?: VehicleInfo;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  seats: number;
}

export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  driverRating?: number;
  from: string;
  to: string;
  date: Date | Timestamp; // ✅ Allow both
  time: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleInfo?: VehicleInfo;
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: Date | Timestamp; // ✅ Allow both
  passengers?: string[];
}

export interface Booking {
  id?: string; // ✅ Make optional (auto-generated)
  rideId: string;
  riderId: string;
  riderName: string;
  riderPhoto?: string;
  seatsBooked: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date | Timestamp; // ✅ Allow both
}

export interface Message {
  id?: string; // ✅ Make optional
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  timestamp: Date | Timestamp; // ✅ Allow both
  read: boolean;
}

export interface Chat {
  id?: string; // ✅ Make optional
  participants: string[];
  participantDetails: {
    [key: string]: {
      name: string;
      photo?: string;
    }
  };
  lastMessage?: string;
  lastMessageTime?: Date | Timestamp; // ✅ Allow both
  rideId?: string;
  createdAt: Date | Timestamp; // ✅ Allow both
}

// Helper type for creating new documents (without id)
export type CreateBooking = Omit<Booking, 'id'>;
export type CreateChat = Omit<Chat, 'id'>;
export type CreateMessage = Omit<Message, 'id'>;