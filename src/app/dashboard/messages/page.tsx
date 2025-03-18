'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { useSocket } from '@/providers/SocketProvider';

type User = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  senderId: string;
  receiverId: string;
  sender: User;
  receiver: User;
};

type Conversation = {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
  lastMessageAt: string;
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages');
        const data = await response.json();

        if (response.ok) {
          setConversations(data.conversations);
        } else {
          console.error('Error fetching conversations:', data.error);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status]);

  const { socket } = useSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      try {
        const response = await fetch(`/api/messages?userId=${selectedConversation}`);
        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages);
          scrollToBottom();
        } else {
          console.error('Error fetching messages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      // Add message to state if it belongs to current conversation
      if (
        selectedConversation &&
        (message.senderId === selectedConversation || message.receiverId === selectedConversation)
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }

      // Update conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.otherUser.id === message.senderId
            ? {
                ...conv,
                lastMessage: message,
                lastMessageAt: message.createdAt,
                unreadCount: conv.unreadCount + 1,
              }
            : conv
        )
      );
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        scrollToBottom();

        // Update conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.otherUser.id === selectedConversation
              ? {
                  ...conv,
                  lastMessage: data,
                  lastMessageAt: data.createdAt,
                }
              : conv
          )
        );
      } else {
        console.error('Error sending message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 divide-x divide-gray-200 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="col-span-4 overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.otherUser.id}
                    onClick={() => setSelectedConversation(conversation.otherUser.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none ${
                      selectedConversation === conversation.otherUser.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {conversation.otherUser.image ? (
                          <Image
                            src={conversation.otherUser.image}
                            alt={conversation.otherUser.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(conversation.lastMessageAt), 'MMM d')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {conversations.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <ChatBubbleLeftIcon className="w-8 h-8 mx-auto mb-2" />
                    <p>No messages yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="col-span-8 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b">
                    {conversations.find(c => c.otherUser.id === selectedConversation)?.otherUser.name}
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender.id === session?.user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender.id === session?.user?.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
