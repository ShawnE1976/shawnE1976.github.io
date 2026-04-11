/* ============================================================
   LaunchTube — Faceless YouTube Beginner Guide Engine
   ============================================================ */

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────────
  const textarea     = document.getElementById("topicInput");
  const generateBtn  = document.getElementById("generateBtn");
  const results      = document.getElementById("results");
  const summaryBar   = document.getElementById("summaryBar");
  const cardsGrid    = document.getElementById("cardsGrid");
  const bonusSection = document.getElementById("bonusSection");
  const pills        = document.querySelectorAll(".pill");

  // ── Niche knowledge base ──────────────────────────────────
  // Maps keyword fragments to enriched metadata so the
  // heuristic engine can tailor advice per niche.

  const nicheDB = {
    scar:   { niche: "Scary / Horror Stories",       style: "narration",    audience: "18-34",  monetize: "Ad revenue + merch",         tiktok: "Post 30-sec creepy clips with cliffhanger endings" },
    horror: { niche: "Scary / Horror Stories",       style: "narration",    audience: "18-34",  monetize: "Ad revenue + merch",         tiktok: "Post 30-sec creepy clips with cliffhanger endings" },
    money:  { niche: "Personal Finance / Money Tips", style: "list / tips",  audience: "18-45",  monetize: "Affiliate links + courses",  tiktok: "Quick money-saving hacks under 60 seconds" },
    financ: { niche: "Personal Finance / Money Tips", style: "list / tips",  audience: "18-45",  monetize: "Affiliate links + courses",  tiktok: "Quick money-saving hacks under 60 seconds" },
    invest: { niche: "Investing & Wealth",            style: "explainer",    audience: "25-45",  monetize: "Affiliate + sponsors",       tiktok: "One investing tip per day, text-on-screen format" },
    ai:     { niche: "AI & Tech News",                style: "news recap",   audience: "18-40",  monetize: "Sponsors + newsletter",      tiktok: "AI tool demos in 30 seconds with screen recordings" },
    tech:   { niche: "AI & Tech News",                style: "news recap",   audience: "18-40",  monetize: "Sponsors + newsletter",      tiktok: "AI tool demos in 30 seconds with screen recordings" },
    motiv:  { niche: "Motivational / Self-Improvement",style: "compilation", audience: "16-35",  monetize: "Ad revenue + digital products",tiktok: "Overlay quotes on cinematic stock footage" },
    quote:  { niche: "Motivational / Self-Improvement",style: "compilation", audience: "16-35",  monetize: "Ad revenue + digital products",tiktok: "Overlay quotes on cinematic stock footage" },
    histor: { niche: "History & Facts",               style: "documentary",  audience: "20-50",  monetize: "Ad revenue + Patreon",       tiktok: "\"Things they don't teach you\" series with text overlays" },
    fact:   { niche: "History & Facts",               style: "documentary",  audience: "20-50",  monetize: "Ad revenue + Patreon",       tiktok: "\"Things they don't teach you\" series with text overlays" },
    health: { niche: "Health & Fitness",              style: "tips / how-to",audience: "20-45",  monetize: "Affiliate + sponsors",       tiktok: "Quick exercise demos or myth-busting clips" },
    fit:    { niche: "Health & Fitness",              style: "tips / how-to",audience: "20-45",  monetize: "Affiliate + sponsors",       tiktok: "Quick exercise demos or myth-busting clips" },
    cook:   { niche: "Cooking & Recipes",             style: "tutorial",     audience: "20-55",  monetize: "Affiliate (kitchen gear) + ads",tiktok: "Overhead recipe clips sped up to 60 seconds" },
    recipe: { niche: "Cooking & Recipes",             style: "tutorial",     audience: "20-55",  monetize: "Affiliate (kitchen gear) + ads",tiktok: "Overhead recipe clips sped up to 60 seconds" },
    food:   { niche: "Cooking & Recipes",             style: "tutorial",     audience: "20-55",  monetize: "Affiliate (kitchen gear) + ads",tiktok: "Overhead recipe clips sped up to 60 seconds" },
    space:  { niche: "Space & Astronomy",             style: "documentary",  audience: "16-45",  monetize: "Ad revenue + merch",         tiktok: "\"Mind-blowing space facts\" with NASA footage" },
    astro:  { niche: "Space & Astronomy",             style: "documentary",  audience: "16-45",  monetize: "Ad revenue + merch",         tiktok: "\"Mind-blowing space facts\" with NASA footage" },
    game:   { niche: "Gaming Tips & Lore",            style: "explainer",    audience: "14-30",  monetize: "Affiliate + sponsors",       tiktok: "Quick game tips or lore stories under 60 sec" },
    travel: { niche: "Travel & Hidden Gems",          style: "slideshow",    audience: "20-45",  monetize: "Affiliate + tourism sponsors",tiktok: "Top 5 hidden spots in [city] with stock footage" },
    crypto: { niche: "Crypto & Web3",                 style: "news recap",   audience: "20-40",  monetize: "Affiliate + sponsors",       tiktok: "Explain one crypto concept in 30 seconds" },
    pet:    { niche: "Pets & Animals",                style: "compilation",  audience: "all ages",monetize: "Affiliate (pet products)",   tiktok: "Cute animal clips with fun-fact text overlay" },
    animal: { niche: "Pets & Animals",                style: "compilation",  audience: "all ages",monetize: "Affiliate (pet products)",   tiktok: "Cute animal clips with fun-fact text overlay" },
    psycho: { niche: "Psychology & Human Behavior",   style: "explainer",    audience: "18-40",  monetize: "Ad revenue + book affiliates",tiktok: "\"Psychology trick #42\" short text videos" },
    mind:   { niche: "Psychology & Human Behavior",   style: "explainer",    audience: "18-40",  monetize: "Ad revenue + book affiliates",tiktok: "\"Psychology trick #42\" short text videos" },
    myster: { niche: "Unsolved Mysteries",            style: "narration",    audience: "18-40",  monetize: "Ad revenue + Patreon",       tiktok: "Mini-mystery teasers: \"Nobody can explain this\"" },
    true:   { niche: "True Crime",                    style: "narration",    audience: "18-45",  monetize: "Ad revenue + Patreon",       tiktok: "60-second case summaries with dramatic text" },
    crime:  { niche: "True Crime",                    style: "narration",    audience: "18-45",  monetize: "Ad revenue + Patreon",       tiktok: "60-second case summaries with dramatic text" },
  };

  const defaultMeta = {
    niche: null,
    style: "explainer / list",
    audience: "18-40",
    monetize: "Ad revenue + affiliate links",
    tiktok: "Repurpose your best clips into vertical Shorts under 60 seconds",
  };

  // ── Helper: detect niche ──────────────────────────────────
  function detectNiche(topic) {
    const lower = topic.toLowerCase();
    for (const key of Object.keys(nicheDB)) {
      if (lower.includes(key)) return nicheDB[key];
    }
    return { ...defaultMeta, niche: topic.trim() || "General" };
  }

  // ── Helper: pick random items ─────────────────────────────
  function pick(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  // ── Build the step cards ──────────────────────────────────
  function buildSteps(topic, meta) {
    const niceName = meta.niche || topic;

    return [
      {
        step: "Step 1",
        title: "Pick Your Exact Sub-Niche",
        body: `You chose "${niceName}" — great start! Now narrow it down. Instead of a broad channel, focus on one specific angle. For example: "AI tools nobody talks about" or "creepy stories from Reddit." A focused channel grows faster because YouTube knows exactly who to show it to.`,
        tools: ["ChatGPT (free)", "Google Trends"],
      },
      {
        step: "Step 2",
        title: "Write a Script with AI",
        body: `Open ChatGPT or Google Gemini and type: "Write a 5-minute YouTube script about [your topic]. Make it engaging, use a hook in the first 10 seconds, and end with a question." That's it — you'll have a full script in 30 seconds. Edit it to add your own spin.`,
        tools: ["ChatGPT", "Gemini", "Claude"],
      },
      {
        step: "Step 3",
        title: "Generate a Voiceover",
        body: `You don't need to use your own voice. Use a free AI voice tool to turn your script into natural-sounding audio. Just paste your script, pick a voice style that fits "${niceName}", and download the audio file. The ${meta.style} style works perfectly here.`,
        tools: ["ElevenLabs (free tier)", "NaturalReader", "TTSMaker"],
      },
      {
        step: "Step 4",
        title: "Get Free Stock Footage & Images",
        body: `Search for clips that match your script. For a "${niceName}" channel, look for ${meta.style === "narration" ? "atmospheric and moody footage" : meta.style === "documentary" ? "cinematic and educational clips" : "clean, relevant B-roll footage"}. All of these sites are 100% free to use, even for monetised videos.`,
        tools: ["Pexels", "Pixabay", "Unsplash"],
      },
      {
        step: "Step 5",
        title: "Edit Your Video (No Experience Needed)",
        body: `Drag your footage and voiceover into a free editor. Add simple text overlays, zoom effects, and background music. Don't overthink it — your first videos won't be perfect, and that's fine. Aim for "good enough to publish" not "Hollywood production."`,
        tools: ["CapCut (free)", "DaVinci Resolve", "Canva Video"],
      },
      {
        step: "Step 6",
        title: "Design a Click-Worthy Thumbnail",
        body: `Thumbnails decide whether people click. Use big, bold text (3-5 words max), a bright background, and one clear focal image. Stick with your channel colours and keep the style consistent across all videos so people recognise your brand.`,
        tools: ["Canva (free)", "Adobe Express", "Photopea"],
      },
      {
        step: "Step 7",
        title: "Optimise Title, Description & Tags",
        body: `Your title should trigger curiosity. Try formats like: "Why Nobody Talks About [Topic]" or "I Tried [Topic] for 30 Days." In the description, write 2-3 sentences about the video, add relevant keywords, and include timestamps. This helps YouTube show your video to the right audience (${meta.audience} age range).`,
        tools: ["TubeBuddy (free)", "VidIQ (free)", "ChatGPT"],
      },
      {
        step: "Step 8",
        title: "Upload & Set a Schedule",
        body: `Upload your first video and commit to a schedule — even once a week is fine. Consistency beats perfection. Set your upload as "Public," pick a category, and add an end screen linking to your next video. The YouTube algorithm rewards channels that post regularly.`,
        tools: ["YouTube Studio"],
      },
      {
        step: "Step 9",
        title: "Repurpose for TikTok & Shorts",
        body: `${meta.tiktok}. Take your best 30-60 second moments, reformat to 9:16 vertical, and post as YouTube Shorts and TikTok. This is free extra traffic — many faceless channels get more views from Shorts than long-form videos.`,
        tools: ["CapCut", "TikTok", "YouTube Shorts"],
      },
      {
        step: "Step 10",
        title: "Monetise & Grow",
        body: `${meta.monetize} — those are your best paths to income in the "${niceName}" niche. To get into the YouTube Partner Programme you need 1,000 subscribers and 4,000 watch hours. While you build up, add affiliate links in your description and grow an email list for future products.`,
        tools: ["YouTube Partner Programme", "Amazon Affiliates", "Gumroad"],
      },
    ];
  }

  // ── Build bonus tips ──────────────────────────────────────
  function buildBonusTips(meta) {
    const tips = [
      `<strong>Post consistently:</strong> 1-2 videos per week beats 5 videos then silence.`,
      `<strong>Study competitors:</strong> Find 3 faceless channels in "${meta.niche}" and note their thumbnails, titles, and video length.`,
      `<strong>Use playlists:</strong> Group related videos to increase watch time.`,
      `<strong>Engage with comments:</strong> Reply to every comment in your first 30 days — it signals YouTube to push your content.`,
      `<strong>Don't buy subscribers:</strong> Fake subs hurt your channel. Grow organically.`,
      `<strong>Batch your work:</strong> Script 3-4 videos at once, then record, then edit. It's much faster.`,
      `<strong>Track analytics weekly:</strong> Check which videos get the most click-through rate and double down on that style.`,
      `<strong>Collaborate early:</strong> Comment on similar creators' videos — the community helps you grow.`,
    ];
    return tips;
  }

  // ── Render functions ──────────────────────────────────────
  function renderSummary(topic, meta) {
    summaryBar.innerHTML = `
      <div class="summary-item">
        <span class="label">Your Niche</span>
        <span class="value">${meta.niche}</span>
      </div>
      <div class="summary-item">
        <span class="label">Video Style</span>
        <span class="value">${capitalize(meta.style)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Target Audience</span>
        <span class="value">Age ${meta.audience}</span>
      </div>
      <div class="summary-item">
        <span class="label">Top Revenue Path</span>
        <span class="value">${meta.monetize.split("+")[0].trim()}</span>
      </div>
    `;
  }

  function renderCards(steps) {
    cardsGrid.innerHTML = steps
      .map(
        (s) => `
      <div class="card">
        <span class="card-step">${s.step}</span>
        <h3 class="card-title">${s.title}</h3>
        <p class="card-body">${s.body}</p>
        <div class="card-tools">
          ${s.tools.map((t) => `<span class="card-tool">${t}</span>`).join("")}
        </div>
      </div>`
      )
      .join("");
  }

  function renderBonus(tips) {
    bonusSection.innerHTML = `
      <h3 class="bonus-title"><span class="icon">&#9889;</span> Pro Tips for Beginners</h3>
      <ul class="bonus-list">
        ${tips.map((t) => `<li>${t}</li>`).join("")}
      </ul>
    `;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Main generate function ────────────────────────────────
  function generate() {
    const topic = textarea.value.trim();
    if (!topic) return;

    const meta = detectNiche(topic);
    const steps = buildSteps(topic, meta);
    const tips = buildBonusTips(meta);

    renderSummary(topic, meta);
    renderCards(steps);
    renderBonus(tips);

    results.hidden = false;
    results.style.animation = "none";
    // Trigger reflow to restart animation
    void results.offsetHeight;
    results.style.animation = "fadeUp .4s ease both";

    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Event listeners ───────────────────────────────────────
  textarea.addEventListener("input", function () {
    generateBtn.disabled = textarea.value.trim().length === 0;
  });

  generateBtn.addEventListener("click", function () {
    generate();
  });

  // Allow Enter key (without Shift) to trigger generation
  textarea.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textarea.value.trim().length > 0) {
        generate();
      }
    }
  });

  // Quick-pick pills
  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      // Remove active class from all pills
      pills.forEach(function (p) { p.classList.remove("active"); });
      pill.classList.add("active");

      textarea.value = pill.getAttribute("data-topic");
      generateBtn.disabled = false;
      generate();
    });
  });
})();
