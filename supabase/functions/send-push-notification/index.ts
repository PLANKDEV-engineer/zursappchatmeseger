import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userIds, title, body, data, tag } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userIds array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Sending notification to ${userIds.length} users`);
    console.log(`[Push] Title: ${title}, Body: ${body}`);

    // Fetch subscriptions for all users
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (error) {
      console.error("[Push] Error fetching subscriptions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found for users", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title: title || "ZursApp",
      body: body || "Notifikasi baru",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || "zursapp-notification",
      data: data || {},
    };

    let successCount = 0;
    const failedSubscriptions: string[] = [];

    // Send to all subscriptions using simple fetch
    for (const sub of subscriptions) {
      try {
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            TTL: "86400",
            Urgency: "high",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`[Push] Sent successfully to ${sub.endpoint.substring(0, 50)}...`);
        } else {
          console.log(`[Push] Failed for ${sub.endpoint.substring(0, 50)}... Status: ${response.status}`);
          if (response.status === 404 || response.status === 410) {
            // Subscription expired
            failedSubscriptions.push(sub.id);
          }
        }
      } catch (err) {
        console.error(`[Push] Error sending to subscription:`, err);
      }
    }

    // Clean up expired subscriptions
    if (failedSubscriptions.length > 0) {
      console.log(`[Push] Cleaning up ${failedSubscriptions.length} expired subscriptions`);
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", failedSubscriptions);
    }

    console.log(`[Push] Successfully sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        sent: successCount,
        total: subscriptions.length,
        failed: failedSubscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Push] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
