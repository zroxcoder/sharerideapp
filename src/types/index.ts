export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  userType: 'driver' | 'rider' | 'both';
  rating?: number;
  totalRides?: number;
  createdAt: Date;
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
  date: Date;
  time: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleInfo?: VehicleInfo;
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: Date;
  passengers?: string[]; // Array of user IDs
}

export interface Booking {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  riderPhoto?: string;
  seatsBooked: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [key: string]: {
      name: string;
      photo?: string;
    }
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  rideId?: string;
  createdAt: Date;
}
