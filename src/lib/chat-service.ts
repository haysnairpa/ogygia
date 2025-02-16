import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Chat, Message } from './types';
import { getGeminiResponse } from './gemini';

export class ChatService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async createChat(): Promise<string> {
    const chat: Omit<Chat, 'id'> = {
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: this.userId,
    };

    try {
      const docRef = await addDoc(collection(db, 'chats'), chat);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create new chat');
    }
  }

  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const docRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || 'New Chat',
        messages: data.messages || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        userId: data.userId
      } as Chat;
    } catch (error) {
      console.error('Error getting chat:', error);
      return null;
    }
  }

  async getUserChats(): Promise<Chat[]> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', this.userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'New Chat',
          messages: data.messages || [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          userId: data.userId
        } as Chat;
      });
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    if (!content?.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const message: Message = {
      id: Math.random().toString(36).substring(2, 9),
      content: content.trim(),
      role: 'user',
      timestamp: Date.now(),
    };

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chat = await this.getChat(chatId);
      
      if (!chat) {
        throw new Error('Chat not found');
      }

      const messages = chat.messages || [];
      const updatedMessages = [...messages, message];

      // Add user message
      await updateDoc(chatRef, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });

      try {
        // Get AI response
        const aiResponse = await getGeminiResponse(content);
        
        // Add AI message
        const aiMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          content: aiResponse,
          role: 'assistant',
          timestamp: Date.now(),
        };

        const finalMessages = [...updatedMessages, aiMessage];
        
        // Update chat with AI response
        await updateDoc(chatRef, {
          messages: finalMessages,
          updatedAt: Date.now(),
          title: messages.length === 0 ? this.generateTitle(content) : chat.title,
        });
      } catch (aiError) {
        console.error('Error getting AI response:', aiError);
        // Add error message as AI response
        const errorMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          content: "Sorry, I encountered an error while processing your request.",
          role: 'assistant',
          timestamp: Date.now(),
        };
        await updateDoc(chatRef, {
          messages: [...updatedMessages, errorMessage],
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  private generateTitle(firstMessage: string): string {
    if (!firstMessage) return 'New Chat';
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage;
  }
}
