"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Menu, Settings, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ChatService } from "@/lib/chat-service";
import { Chat, Message, SharedMessage } from "@/lib/types";
import { LoadingDots } from "@/components/loading-dots";
import { ShareModal } from "@/components/share-modal";
import { MailModal } from "@/components/mail-modal";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [selectedMessageToShare, setSelectedMessageToShare] = useState<string>("");
  const [sharedMessages, setSharedMessages] = useState<SharedMessage[]>([]);
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
      // Add a small delay to ensure user profile is loaded
      setTimeout(loadSharedMessages, 1000);
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

  const loadSharedMessages = async () => {
    if (!chatService) return;
    try {
      const messages = await chatService.getSharedMessages();
      setSharedMessages(messages);
    } catch (error) {
      // Ignore the error for now, just set empty messages
      setSharedMessages([]);
      console.log('Info: No shared messages available yet');
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

  const handleShare = async (email: string) => {
    if (!chatService) return;
    await chatService.shareMessage(selectedMessageToShare, email);
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
    <div className="flex h-screen relative">
      {/* Overlay for closing sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out flex flex-col w-64 bg-background/80 backdrop-blur-sm border-r z-50`}
      >
        <div className="p-4 border-b bg-background/90">
          <h2 className="font-semibold">Chats</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={createNewChat}
            >
              New Chat
            </Button>
            <div className="space-y-2">
              {chats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className={`w-full justify-start ${
                    chat.id === currentChatId ? "bg-accent" : ""
                  }`}
                  onClick={() => loadChat(chat.id)}
                >
                  <span className="truncate">{chat.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background/90">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout}>
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMailModalOpen(true)}
            className="relative"
          >
            <Mail className="h-6 w-6" />
            {sharedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {sharedMessages.length}
              </span>
            )}
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative group max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                  {message.role === "assistant" && (
                    <button
                      onClick={() => {
                        setSelectedMessageToShare(message.content);
                        setIsShareModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute -bottom-6 right-0 text-xs text-muted-foreground hover:text-foreground transition-opacity"
                    >
                      Share to friend?
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        message={selectedMessageToShare}
        onShare={handleShare}
      />

      <MailModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        messages={sharedMessages}
      />
    </div>
  );
}
