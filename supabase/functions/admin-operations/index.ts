import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const { operation, data } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (operation) {
      case "get_users":
        result = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        break;

      case "get_servers":
        result = await supabase
          .from("servers")
          .select("*, profiles(username)")
          .order("created_at", { ascending: false });
        break;

      case "get_channels":
        result = await supabase
          .from("channels")
          .select("*, servers(name)")
          .order("created_at", { ascending: false });
        break;

      case "get_flagged_messages":
        result = await supabase
          .from("flagged_messages")
          .select("*, messages(*), direct_messages(*)")
          .eq("reviewed", false)
          .order("created_at", { ascending: false });
        break;

      case "ban_user":
        const { user_id, server_id, reason, is_global } = data;
        result = await supabase.from("bans").insert({
          user_id,
          server_id,
          reason,
          is_global,
          banned_by: "admin",
        });

        await supabase.from("moderation_logs").insert({
          action_type: "user_banned",
          performed_by: "admin",
          target_user_id: user_id,
          details: { reason, is_global },
        });
        break;

      case "ip_ban":
        const { ip_address, ban_reason } = data;
        result = await supabase.from("ip_bans").insert({
          ip_address,
          reason: ban_reason,
          banned_by: "admin",
        });

        await supabase.from("moderation_logs").insert({
          action_type: "ip_banned",
          performed_by: "admin",
          details: { ip_address, reason: ban_reason },
        });
        break;

      case "delete_message":
        const { message_id, is_dm } = data;
        if (is_dm) {
          result = await supabase
            .from("direct_messages")
            .update({ is_deleted: true })
            .eq("id", message_id);
        } else {
          result = await supabase
            .from("messages")
            .update({ is_deleted: true })
            .eq("id", message_id);
        }

        await supabase.from("moderation_logs").insert({
          action_type: "message_deleted",
          performed_by: "admin",
          details: { message_id, is_dm },
        });
        break;

      case "delete_channel":
        const { channel_id } = data;
        result = await supabase
          .from("channels")
          .delete()
          .eq("id", channel_id);

        await supabase.from("moderation_logs").insert({
          action_type: "channel_deleted",
          performed_by: "admin",
          details: { channel_id },
        });
        break;

      case "get_moderation_logs":
        result = await supabase
          .from("moderation_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        break;

      case "review_flagged_message":
        const { flagged_id, action } = data;
        result = await supabase
          .from("flagged_messages")
          .update({
            reviewed: true,
            reviewed_by: "admin",
            action_taken: action,
          })
          .eq("id", flagged_id);
        break;

      default:
        throw new Error("Unknown operation");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
