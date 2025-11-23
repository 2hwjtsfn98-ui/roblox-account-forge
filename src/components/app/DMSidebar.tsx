import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface DMUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface DMSidebarProps {
  userId: string;
  onSelectDM: (userId: string) => void;
  selectedDM: string | null;
}

const DMSidebar = ({ userId, onSelectDM, selectedDM }: DMSidebarProps) => {
  const [dmUsers, setDmUsers] = useState<DMUser[]>([]);

  useEffect(() => {
    loadDMUsers();
  }, [userId]);

  const loadDMUsers = async () => {
    const { data: sentMessages } = await supabase
      .from("direct_messages")
      .select("recipient_id")
      .eq("sender_id", userId);

    const { data: receivedMessages } = await supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("recipient_id", userId);

    const userIds = new Set([
      ...(sentMessages?.map((m) => m.recipient_id) || []),
      ...(receivedMessages?.map((m) => m.sender_id) || []),
    ]);

    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(userIds));

      if (profiles) {
        setDmUsers(profiles);
      }
    }
  };

  return (
    <div className="w-60 bg-secondary/50 flex flex-col">
      <div className="h-12 border-b border-border px-4 flex items-center font-semibold">
        Direct Messages
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {dmUsers.map((user) => (
          <Button
            key={user.id}
            variant="ghost"
            className={`w-full justify-start ${selectedDM === user.id ? "bg-primary/10" : ""}`}
            onClick={() => onSelectDM(user.id)}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full mr-2" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            {user.username}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DMSidebar;
