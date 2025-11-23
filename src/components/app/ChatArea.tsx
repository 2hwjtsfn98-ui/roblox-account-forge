import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatAreaProps {
  userId: string;
  channelId: string | null;
  dmUserId: string | null;
  isDM: boolean;
}

const ChatArea = ({ userId, channelId, dmUserId, isDM }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDM && dmUserId) {
      loadDMMessages();
      subscribeToDMMessages();
    } else if (channelId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [channelId, dmUserId, isDM]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!channelId) return;

    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (!error && messagesData) {
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const messagesWithProfiles = messagesData.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id)
      }));
      setMessages(messagesWithProfiles);
    }
  };

  const loadDMMessages = async () => {
    if (!dmUserId) return;

    const { data: dmsData, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${dmUserId}),and(sender_id.eq.${dmUserId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (!error && dmsData) {
      const userIds = [...new Set(dmsData.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const messagesWithProfiles = dmsData.map(m => ({
        ...m,
        user_id: m.sender_id,
        profiles: profileMap.get(m.sender_id)
      }));
      setMessages(messagesWithProfiles as any);
    }
  };

  const subscribeToMessages = () => {
    if (!channelId) return;

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, profiles: profile } as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToDMMessages = () => {
    if (!dmUserId) return;

    const channel = supabase
      .channel(`dms:${userId}:${dmUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const dm = payload.new;
          if (
            (dm.sender_id === userId && dm.recipient_id === dmUserId) ||
            (dm.sender_id === dmUserId && dm.recipient_id === userId)
          ) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", dm.sender_id)
              .single();

            setMessages((prev) => [
              ...prev,
              { ...dm, user_id: dm.sender_id, profiles: profile } as Message,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      if (isDM && dmUserId) {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: userId,
          recipient_id: dmUserId,
          content: newMessage,
        });

        if (error) throw error;
      } else if (channelId) {
        const { error } = await supabase.from("messages").insert({
          channel_id: channelId,
          user_id: userId,
          content: newMessage,
        });

        if (error) throw error;
      }

      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!channelId && !dmUserId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a channel or DM to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {message.profiles?.avatar_url ? (
                <img
                  src={message.profiles.avatar_url}
                  alt={message.profiles.username}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {message.profiles?.username?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">{message.profiles?.username || "Unknown"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
