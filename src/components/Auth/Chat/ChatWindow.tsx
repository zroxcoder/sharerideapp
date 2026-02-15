import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Chat, Message } from '../../../types';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  chat: Chat;
}

const toDate = (value: Date | Timestamp): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
};

const formatMessageTime = (date: Date) => {
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM dd, HH:mm');
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!chat?.id) {
      console.error('Chat ID is missing');
      return;
    }

    const messagesRef = collection(db, 'chats', chat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          chatId: chat.id!,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          text: data.text,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp),
          read: data.read,
        } as Message);
      });
      setMessages(messagesData);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    });

    return () => unsubscribe();
  }, [chat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !userProfile || !chat?.id) {
      if (!chat?.id) {
        toast.error('Chat session error. Please refresh the page.');
      }
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const messageData = {
        chatId: chat.id,
        senderId: currentUser.uid,
        senderName: userProfile.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        senderPhoto: userProfile.photoURL || '',
        text: messageText,
        timestamp: Timestamp.now(),
        read: false,
      };

      await addDoc(collection(db, 'chats', chat.id, 'messages'), messageData);

      try {
        const chatRef = doc(db, 'chats', chat.id);
        await updateDoc(chatRef, {
          lastMessage: messageText,
          lastMessageTime: Timestamp.now(),
        });
      } catch (updateError) {
        console.error('Error updating chat document:', updateError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!chat?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Error: Chat session invalid. Please refresh.</p>
      </div>
    );
  }

  const otherUser = chat.participants?.find(id => id !== currentUser?.uid);
  const otherUserDetails = otherUser ? chat.participantDetails?.[otherUser] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
            {otherUserDetails?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{otherUserDetails?.name || 'User'}</h3>
          <p className="text-xs text-green-600">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUser?.uid;
            const msgTime = toDate(message.timestamp);
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-black text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="break-words text-sm">{message.text}</p>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(msgTime)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-black text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};