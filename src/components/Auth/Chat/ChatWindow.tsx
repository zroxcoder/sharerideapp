import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Chat, Message } from '../../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  chat: Chat;
}

const toDate = (value: Date | Timestamp): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
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
    setNewMessage(''); // Clear immediately for better UX
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

      // Add message to subcollection
      await addDoc(collection(db, 'chats', chat.id, 'messages'), messageData);

      // ✅ FIX: Update chat document with last message
      try {
        const chatRef = doc(db, 'chats', chat.id);
        await updateDoc(chatRef, {
          lastMessage: messageText,
          lastMessageTime: Timestamp.now(),
        });
      } catch (updateError) {
        console.error('Error updating chat document:', updateError);
        // Don't throw - message was sent successfully
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
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
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold">
          {otherUserDetails?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="font-semibold text-white">{otherUserDetails?.name || 'User'}</div>
          <div className="text-xs text-blue-100">Active now</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUser?.uid;
            const msgTime = toDate(message.timestamp);
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white text-gray-900 shadow'
                    }`}
                  >
                    <p className="break-words">{message.text}</p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {format(msgTime, 'HH:mm')}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};