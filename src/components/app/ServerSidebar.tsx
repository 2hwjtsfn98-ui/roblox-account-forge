import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CreateServerDialog from "./CreateServerDialog";

interface Server {
  id: string;
  name: string;
  icon_url: string | null;
}

interface ServerSidebarProps {
  userId: string;
  onSelectServer: (serverId: string) => void;
  onShowDMs: () => void;
  selectedServer: string | null;
}

const ServerSidebar = ({ userId, onSelectServer, onShowDMs, selectedServer }: ServerSidebarProps) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadServers();
  }, [userId]);

  const loadServers = async () => {
    const { data: memberServers, error } = await supabase
      .from("server_members")
      .select("server_id, servers(id, name, icon_url)")
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to load servers");
      return;
    }

    const serversList = memberServers
      ?.map((ms: any) => ms.servers)
      .filter(Boolean) || [];
    setServers(serversList);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="w-20 bg-secondary flex flex-col items-center py-3 gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full"
        onClick={onShowDMs}
      >
        <Home className="h-6 w-6" />
      </Button>
      <div className="w-8 h-0.5 bg-border rounded-full" />
      {servers.map((server) => (
        <Button
          key={server.id}
          variant="ghost"
          size="icon"
          className={`w-12 h-12 rounded-full ${selectedServer === server.id ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => onSelectServer(server.id)}
        >
          {server.icon_url ? (
            <img src={server.icon_url} alt={server.name} className="w-full h-full rounded-full" />
          ) : (
            <span className="text-lg font-semibold">{server.name[0]}</span>
          )}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full"
        onClick={handleLogout}
      >
        <LogOut className="h-6 w-6" />
      </Button>
      <CreateServerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onServerCreated={loadServers}
        userId={userId}
      />
    </div>
  );
};

export default ServerSidebar;
