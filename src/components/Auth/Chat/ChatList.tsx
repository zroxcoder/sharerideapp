import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Chat } from '../../../types';
import { ChatWindow } from './ChatWindow';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const toDate = (value: Date | Timestamp | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return undefined;
};

export const ChatList: React.FC = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData: Chat[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const data = chatDoc.data();
        
        if (!data.participants || !Array.isArray(data.participants)) {
          console.warn('Invalid participants array in chat:', chatDoc.id);
          continue;
        }

        if (!data.participants.includes(currentUser.uid)) {
          console.warn('User not in participants, skipping chat:', chatDoc.id);
          continue;
        }

        const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        let lastMessage = data.lastMessage || '';
        let lastMessageTime: Date | undefined;
        
        if (!messagesSnapshot.empty) {
          const lastMsg = messagesSnapshot.docs[0].data();
          lastMessage = lastMsg.text || '';
          lastMessageTime = lastMsg.timestamp instanceof Timestamp 
            ? lastMsg.timestamp.toDate() 
            : new Date(lastMsg.timestamp);
        } else if (data.lastMessageTime) {
          lastMessageTime = data.lastMessageTime instanceof Timestamp 
            ? data.lastMessageTime.toDate() 
            : new Date(data.lastMessageTime);
        }

        chatsData.push({
          id: chatDoc.id,
          participants: data.participants,
          participantDetails: data.participantDetails || {},
          rideId: data.rideId,
          lastMessage,
          lastMessageTime,
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt),
        } as Chat);
      }

      chatsData.sort((a, b) => {
        const timeA = toDate(a.lastMessageTime)?.getTime() || 0;
        const timeB = toDate(b.lastMessageTime)?.getTime() || 0;
        return timeB - timeA;
      });

      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error('Error in chat listener:', error);
      toast.error('Failed to load chats');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherParticipant = (chat: Chat) => {
    if (!currentUser) return null;
    const otherUserId = chat.participants?.find(id => id !== currentUser.uid);
    return otherUserId ? chat.participantDetails?.[otherUserId] : null;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
              <p className="text-sm text-gray-500">Start a conversation by booking a ride</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => {
                const otherUser = getOtherParticipant(chat);
                const lastMsgTime = toDate(chat.lastMessageTime);
                const isSelected = selectedChat?.id === chat.id;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      isSelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-lg">
                        {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {otherUser?.name || 'User'}
                        </h3>
                        {lastMsgTime && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatDistanceToNow(lastMsgTime, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat && selectedChat.id ? (
            <ChatWindow chat={selectedChat} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};