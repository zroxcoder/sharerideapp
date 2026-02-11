import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Chat } from '../../../types';
import { ChatWindow } from './ChatWindow';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Helper function to convert Date | Timestamp to Date
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
    if (!currentUser) return;

    const fetchChats = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const chatsData: Chat[] = [];
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Get last message
            const messagesRef = collection(db, 'chats', doc.id, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
            const messagesSnapshot = await getDocs(messagesQuery);
            
            let lastMessage = '';
            let lastMessageTime: Date | undefined;
            
            if (!messagesSnapshot.empty) {
              const lastMsg = messagesSnapshot.docs[0].data();
              lastMessage = lastMsg.text;
              lastMessageTime = lastMsg.timestamp instanceof Timestamp 
                ? lastMsg.timestamp.toDate() 
                : new Date(lastMsg.timestamp);
            }

            chatsData.push({
              id: doc.id,
              ...data,
              lastMessage,
              lastMessageTime,
              createdAt: data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate() 
                : new Date(data.createdAt),
            } as Chat);
          }

          // Sort by last message time
          chatsData.sort((a, b) => {
            const timeA = toDate(a.lastMessageTime)?.getTime() || 0;
            const timeB = toDate(b.lastMessageTime)?.getTime() || 0;
            return timeB - timeA;
          });

          setChats(chatsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to load chats');
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUser]);

  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participants.find(id => id !== currentUser?.uid);
    return otherUserId ? chat.participantDetails[otherUserId] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
            {/* Chat List */}
            <div className="border-r border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-2">Book a ride to start chatting</p>
                </div>
              ) : (
                chats.map((chat) => {
                  const otherUser = getOtherParticipant(chat);
                  const lastMsgTime = toDate(chat.lastMessageTime);
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 border-b border-gray-200 hover:bg-blue-50 transition text-left ${
                        selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {otherUser?.name.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {otherUser?.name || 'User'}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {chat.lastMessage || 'No messages yet'}
                          </div>
                        </div>
                        {lastMsgTime && (
                          <div className="text-xs text-gray-500 flex-shrink-0">
                            {format(lastMsgTime, 'MMM dd')}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <ChatWindow chat={selectedChat} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <svg className="h-20 w-20 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-600 text-lg">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};