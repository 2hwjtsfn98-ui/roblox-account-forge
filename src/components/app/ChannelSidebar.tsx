import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hash, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface ChannelSidebarProps {
  serverId: string | null;
  onSelectChannel: (channelId: string) => void;
  selectedChannel: string | null;
}

const ChannelSidebar = ({ serverId, onSelectChannel, selectedChannel }: ChannelSidebarProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [serverName, setServerName] = useState("");

  useEffect(() => {
    if (serverId) {
      loadChannels();
      loadServerInfo();
    }
  }, [serverId]);

  const loadChannels = async () => {
    if (!serverId) return;

    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("server_id", serverId)
      .order("position");

    if (!error && data) {
      setChannels(data);
      if (data.length > 0 && !selectedChannel) {
        onSelectChannel(data[0].id);
      }
    }
  };

  const loadServerInfo = async () => {
    if (!serverId) return;

    const { data } = await supabase
      .from("servers")
      .select("name")
      .eq("id", serverId)
      .single();

    if (data) {
      setServerName(data.name);
    }
  };

  if (!serverId) {
    return (
      <div className="w-60 bg-secondary/50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a server</p>
      </div>
    );
  }

  return (
    <div className="w-60 bg-secondary/50 flex flex-col">
      <div className="h-12 border-b border-border px-4 flex items-center font-semibold">
        {serverName}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">TEXT CHANNELS</p>
          {channels
            .filter((c) => c.type === "text")
            .map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-start ${selectedChannel === channel.id ? "bg-primary/10" : ""}`}
                onClick={() => onSelectChannel(channel.id)}
              >
                <Hash className="h-4 w-4 mr-2" />
                {channel.name}
              </Button>
            ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">VOICE CHANNELS</p>
          {channels
            .filter((c) => c.type === "voice")
            .map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className="w-full justify-start"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {channel.name}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelSidebar;
