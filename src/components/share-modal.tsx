"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onShare: (email: string) => Promise<void>;
}

export function ShareModal({ isOpen, onClose, message, onShare }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleShare = async () => {
    setError(null);

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await onShare(email);
      toast.success("Message shared successfully!", {
        description: `Sent to ${email}`,
      });
      setEmail("");
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to share message";
      setError(errorMessage);
      toast.error("Failed to share message", {
        description: errorMessage === "User not found" 
          ? "The email address is not registered"
          : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share with Friend</DialogTitle>
          <DialogDescription>
            Share this message with another registered user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                placeholder="Enter friend's email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={error ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">{message}</p>
            </div>
          </div>
          <Button 
            onClick={handleShare} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Share Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
