"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Menu, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ChatService } from "@/lib/chat-service";
import { Chat, Message } from "@/lib/types";
import { LoadingDots } from "@/components/loading-dots";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const chatService = user ? new ChatService(user.uid) : null;

  const loadChats = async () => {
    if (!chatService) return;
    try {
      const userChats = await chatService.getUserChats();
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const createNewChat = async () => {
    if (!chatService) return;
    try {
      const chatId = await chatService.createChat();
      setCurrentChatId(chatId);
      setMessages([]);
      await loadChats();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    if (!chatService) return;
    try {
      const chat = await chatService.getChat(chatId);
      if (chat) {
        setCurrentChatId(chatId);
        setMessages(chat.messages);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatService || isLoading) return;
    
    setIsLoading(true);
    const messageContent = input;
    setInput("");

    // Add user message immediately
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      content: messageContent.trim(),
      role: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (!currentChatId) {
        const chatId = await chatService.createChat();
        setCurrentChatId(chatId);
      }
      
      await chatService.sendMessage(currentChatId!, messageContent);
      await loadChat(currentChatId!);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          content: "Sorry, I encountered an error while processing your request.",
          role: 'assistant',
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <LoadingDots />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 hover:bg-accent"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-[260px] bg-background border-r border-border
          transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="pt-16 px-4 border-b border-border pb-4">
          <Button 
            className="w-full" 
            variant="outline"
            onClick={createNewChat}
          >
            New Chat
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)] p-4">
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors ${
                  currentChatId === chat.id ? 'bg-accent' : ''
                }`}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Settings Section at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 bg-background">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Settings className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="hover:bg-accent"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col pl-16">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-lg bg-muted">
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              size="icon"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
