import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ServerSidebar from "@/components/app/ServerSidebar";
import ChannelSidebar from "@/components/app/ChannelSidebar";
import ChatArea from "@/components/app/ChatArea";
import DMSidebar from "@/components/app/DMSidebar";

const AppPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showDMs, setShowDMs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedChannel(null);
    setSelectedDM(null);
    setShowDMs(false);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId);
    setSelectedDM(null);
  };

  const handleShowDMs = () => {
    setShowDMs(true);
    setSelectedServer(null);
    setSelectedChannel(null);
  };

  const handleSelectDM = (userId: string) => {
    setSelectedDM(userId);
    setSelectedChannel(null);
  };

  return (
    <div className="h-screen flex bg-background">
      <ServerSidebar
        userId={user.id}
        onSelectServer={handleSelectServer}
        onShowDMs={handleShowDMs}
        selectedServer={selectedServer}
      />
      {showDMs ? (
        <>
          <DMSidebar userId={user.id} onSelectDM={handleSelectDM} selectedDM={selectedDM} />
          <ChatArea
            userId={user.id}
            channelId={selectedChannel}
            dmUserId={selectedDM}
            isDM={true}
          />
        </>
      ) : (
        <>
          <ChannelSidebar
            serverId={selectedServer}
            onSelectChannel={handleSelectChannel}
            selectedChannel={selectedChannel}
          />
          <ChatArea
            userId={user.id}
            channelId={selectedChannel}
            dmUserId={null}
            isDM={false}
          />
        </>
      )}
    </div>
  );
};

export default AppPage;
