import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerCreated: () => void;
  userId: string;
}

const CreateServerDialog = ({ open, onOpenChange, onServerCreated, userId }: CreateServerDialogProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Server name is required");
      return;
    }

    setLoading(true);
    try {
      const { data: server, error: serverError } = await supabase
        .from("servers")
        .insert({ name, owner_id: userId })
        .select()
        .single();

      if (serverError) throw serverError;

      await supabase.from("server_members").insert({
        server_id: server.id,
        user_id: userId,
      });

      await supabase.from("channels").insert({
        server_id: server.id,
        name: "general",
        type: "text",
        position: 0,
      });

      toast.success("Server created!");
      setName("");
      onOpenChange(false);
      onServerCreated();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Server</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Server"
            />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Server"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServerDialog;
