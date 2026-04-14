import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto utilities for VAPID
async function generateVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const urlObj = new URL(endpoint);
  const audience = `${urlObj.protocol}//${urlObj.host}`;
  
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: now + 86400,
    sub: "mailto:admin@zursapp.com",
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const unsignedToken = `${header}.${payload}`;
  
  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const key = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER to raw signature if needed
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4;
    r = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigBytes.slice(sStart, sStart + sLen);
    
    // Remove leading zeros
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
  }

  // Pad to 32 bytes
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 32 - r.length);
  rawSig.set(s, 64 - s.length);
  
  const sigBase64 = uint8ArrayToBase64Url(rawSig);
  const jwt = `${unsignedToken}.${sigBase64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userIds, title, body, data, tag } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userIds array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Sending to ${userIds.length} users: ${title}`);

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

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: title || "ZursApp",
      body: body || "Notifikasi baru",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || "zursapp-notification",
      data: data || {},
    });

    let successCount = 0;
    const failedSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          TTL: "86400",
          Urgency: "high",
        };

        // Add VAPID authorization if keys are available
        if (vapidPublicKey && vapidPrivateKey) {
          try {
            const vapidHeaders = await generateVapidAuthHeader(
              sub.endpoint,
              vapidPublicKey,
              vapidPrivateKey
            );
            headers["Authorization"] = vapidHeaders.authorization;
            headers["Crypto-Key"] = vapidHeaders.cryptoKey;
          } catch (vapidErr) {
            console.error("[Push] VAPID header generation failed:", vapidErr);
          }
        }

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers,
          body: payload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
        } else {
          console.log(`[Push] Failed: ${response.status} for ${sub.endpoint.substring(0, 50)}...`);
          if (response.status === 404 || response.status === 410) {
            failedSubscriptions.push(sub.id);
          }
        }
      } catch (err) {
        console.error(`[Push] Error sending:`, err);
      }
    }

    if (failedSubscriptions.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", failedSubscriptions);
    }

    console.log(`[Push] Sent ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ sent: successCount, total: subscriptions.length, failed: failedSubscriptions.length }),
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
