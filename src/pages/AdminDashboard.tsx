import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    const token = sessionStorage.getItem("admin_token");

    try {
      const [usersRes, serversRes, channelsRes, flaggedRes, logsRes] = await Promise.all([
        supabase.functions.invoke("admin-operations", {
          body: { operation: "get_users" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        supabase.functions.invoke("admin-operations", {
          body: { operation: "get_servers" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        supabase.functions.invoke("admin-operations", {
          body: { operation: "get_channels" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        supabase.functions.invoke("admin-operations", {
          body: { operation: "get_flagged_messages" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        supabase.functions.invoke("admin-operations", {
          body: { operation: "get_moderation_logs" },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.data?.data) setUsers(usersRes.data.data);
      if (serversRes.data?.data) setServers(serversRes.data.data);
      if (channelsRes.data?.data) setChannels(channelsRes.data.data);
      if (flaggedRes.data?.data) setFlaggedMessages(flaggedRes.data.data);
      if (logsRes.data?.data) setLogs(logsRes.data.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt("Enter ban reason:");
    if (!reason) return;

    try {
      const token = sessionStorage.getItem("admin_token");
      await supabase.functions.invoke("admin-operations", {
        body: {
          operation: "ban_user",
          data: { user_id: userId, reason, is_global: true },
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User banned");
      loadData();
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const handleIPBan = async () => {
    const ip = prompt("Enter IP address:");
    if (!ip) return;
    const reason = prompt("Enter ban reason:");
    if (!reason) return;

    try {
      const token = sessionStorage.getItem("admin_token");
      await supabase.functions.invoke("admin-operations", {
        body: {
          operation: "ip_ban",
          data: { ip_address: ip, ban_reason: reason },
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("IP banned");
      loadData();
    } catch (error) {
      toast.error("Failed to ban IP");
    }
  };

  const handleDeleteMessage = async (messageId: string, isDM: boolean) => {
    try {
      const token = sessionStorage.getItem("admin_token");
      await supabase.functions.invoke("admin-operations", {
        body: {
          operation: "delete_message",
          data: { message_id: messageId, is_dm: isDM },
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Message deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    try {
      const token = sessionStorage.getItem("admin_token");
      await supabase.functions.invoke("admin-operations", {
        body: {
          operation: "delete_channel",
          data: { channel_id: channelId },
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Channel deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete channel");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Last IP</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>{new Date(user.last_active).toLocaleString()}</TableCell>
                        <TableCell>{user.last_ip || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBanUser(user.id)}
                          >
                            Ban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button onClick={handleIPBan}>Add IP Ban</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server: any) => (
                      <TableRow key={server.id}>
                        <TableCell>{server.name}</TableCell>
                        <TableCell>{server.profiles?.username || "Unknown"}</TableCell>
                        <TableCell>{server.invite_code}</TableCell>
                        <TableCell>{new Date(server.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
            <Card>
              <CardHeader>
                <CardTitle>Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Server</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel: any) => (
                      <TableRow key={channel.id}>
                        <TableCell>{channel.name}</TableCell>
                        <TableCell>{channel.servers?.name || "Unknown"}</TableCell>
                        <TableCell>{channel.type}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteChannel(channel.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedMessages.map((flag: any) => (
                      <TableRow key={flag.id}>
                        <TableCell>{flag.reason}</TableCell>
                        <TableCell>{flag.severity}</TableCell>
                        <TableCell>{new Date(flag.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleDeleteMessage(
                                  flag.message_id || flag.dm_id,
                                  !!flag.dm_id
                                )
                              }
                            >
                              Delete
                            </Button>
                            <Button size="sm" variant="outline">
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.action_type}</TableCell>
                        <TableCell>{log.performed_by}</TableCell>
                        <TableCell>{JSON.stringify(log.details)}</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
