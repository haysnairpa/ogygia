"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail } from "lucide-react";

interface SharedMessage {
  id: string;
  content: string;
  senderEmail: string;
  timestamp: number;
}

interface MailModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SharedMessage[];
}

export function MailModal({ isOpen, onClose, messages }: MailModalProps) {
  const [selectedMessage, setSelectedMessage] = useState<SharedMessage | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {selectedMessage ? "Shared Message" : "Inbox"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>From: {selectedMessage.senderEmail}</span>
                <span>{new Date(selectedMessage.timestamp).toLocaleString()}</span>
              </div>
              <div className="rounded-lg border p-4">
                {selectedMessage.content}
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-sm text-blue-500 hover:underline"
              >
                Back to Inbox
              </button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Mail className="w-8 h-8 mb-2" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className="w-full p-4 text-left rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{message.senderEmail}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {message.content}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
