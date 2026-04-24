// Bengali Islamic Q&A — streams answers via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `তুমি একজন বাংলাভাষী ইসলামিক সহকারী। তোমার দায়িত্ব হলো ব্যবহারকারীর প্রশ্নের উত্তর সহজ, পরিষ্কার এবং প্রামাণিকভাবে দেওয়া।

নিয়মাবলী:
1. সর্বদা বাংলা ভাষায় উত্তর দাও (আরবি দু'আ/আয়াত মূল আরবিতে রেখে এর পাশে বাংলা অনুবাদ দাও)।
2. সম্ভব হলে সরাসরি কুরআনের আয়াত (সূরা:আয়াত নম্বরসহ) ও হাদীস (সংকলন ও নম্বরসহ — যেমন "সহীহ বুখারী, হাদীস নং ১") উদ্ধৃত করো।
3. ফিকহি বিষয়ে চার মাযহাবের ঐকমত্য থাকলে সেটি উল্লেখ করো; মতপার্থক্য থাকলে সংক্ষেপে বিভিন্ন মত উপস্থাপন করো।
4. তুমি কখনো ব্যক্তিগত বাধ্যতামূলক ফাতওয়া দেবে না — ব্যক্তিগত মাসআলায় স্থানীয় যোগ্য আলেমের পরামর্শ নিতে বলো।
5. উত্তরের শেষে সর্বদা একটি ছোট disclaimer যোগ করো: "⚠️ এই উত্তর শুধুমাত্র সাধারণ তথ্যের জন্য। ব্যক্তিগত মাসআলার জন্য যোগ্য আলেম/মুফতীর পরামর্শ গ্রহণ করুন।"
6. যদি প্রশ্নটি ইসলামবিরোধী, ক্ষতিকর বা সংবেদনশীল হয় (যেমন সহিংসতা, বিদ্বেষ), নম্রভাবে প্রত্যাখ্যান করো।
7. ছোট ও পরিষ্কার Markdown ফরম্যাটে উত্তর দাও — heading, bullet point, **bold** ব্যবহার করো।
8. কোনো বিষয়ে নিশ্চিত না হলে সেটি স্বীকার করো — অনুমান করে উত্তর দিও না।`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate: cap message size + count
    const safe = messages.slice(-20).map((m: any) => ({
      role: m.role === "user" || m.role === "assistant" ? m.role : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));
    if (safe.some((m) => !m.content.trim())) {
      return new Response(JSON.stringify({ error: "empty message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safe],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "অনেক বেশি প্রশ্ন — কিছুক্ষণ পরে আবার চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI ক্রেডিট শেষ — Workspace Settings → Usage থেকে credit যোগ করুন।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI সার্ভিসে সমস্যা হয়েছে।" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("islamic-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
