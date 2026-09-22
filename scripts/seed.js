// Run: npm run seed   (safe to re-run: skips if data already exists)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@hittechpro.net").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) throw new Error("Set ADMIN_PASSWORD (10+ characters) in .env before seeding.");
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Admin", email, password: await bcrypt.hash(password, 10), role: "ADMIN" },
  });
  console.log("Admin:", email);

  const fresh = (await prisma.bundle.count()) === 0;
  const cats = {};
  const CATS = ["Design & Creative Assets", "SEO & Analytics", "AI Tools", "Bulk Pack", "Personal", "AI Copilots & Writing", "Audio", "Learning & Education", "Privacy & Security", "Developer & No-Code"];
  for (const [i, name] of CATS.entries()) {
    const c = await prisma.category.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name), sort: i } });
    cats[name] = c.id;
  }

  const tools = [
    ["Freepik", "Design & Creative Assets", 359, "#2563EB", "Daily 10 download limit per day. Creative asset library for designers: vectors, photos, PSDs and icons."],
    ["Student Pack", "Bulk Pack", 959, "#0D9488", "An academic productivity bundle for students: writing, research, design and study tools in one plan."],
    ["VidIQ Boost", "Personal", 719, "#1D4ED8", "YouTube growth and optimization toolkit for video creators, on your own personal ID."],
    ["Canva Pro", "Design & Creative Assets", 239, "#7C3AED", "Graphic design and visual content platform for effortless creation with premium templates and brand kit."],
    ["CapCut Pro", "Design & Creative Assets", 719, "#111827", "Professional video editing made simple: premium effects, auto captions and cloud storage."],
    ["Leonardo AI", "AI Tools", 719, "#A21CAF", "Ultimate plan. AI image generation platform for creators, with upscale included."],
    ["Veed.io", "AI Tools", 719, "#65A30D", "Online video editing platform. 1 hour subtitles per month, unlimited video projects."],
    ["Video Pack", "Bulk Pack", 1151, "#4338CA", "A complete creator bundle for editors, marketers and YouTubers: editing, stock and AI video."],
    ["Ahrefs", "SEO & Analytics", 2159, "#E8352B", "Full backlink and keyword suite with site audit and rank tracking."],
    ["SEMrush Guru", "SEO & Analytics", 959, "#EA580C", "Competitor research, keyword gap analysis and site audit access."],
  ];
  const more = [
    ["Adobe Creative Cloud (1M)", "Design & Creative Assets", 1799, "#DC2626", "30 days"],
    ["Capcut Pro Personal 6M", "Design & Creative Assets", 3599, "#111827", "6 months"],
    ["Duolingo Super 1Y", "Learning & Education", 2999, "#65A30D", "year"],
    ["PhotoGPT AI", "AI Tools", 599, "#374151", "30 days"],
    ["Nord VPN", "Privacy & Security", 1079, "#2563EB", "30 days"],
    ["Coursera Personal 1Y", "Learning & Education", 2399, "#1D4ED8", "12 months"],
    ["SellerAmp", "SEO & Analytics", 479, "#0891B2", "30 days"],
    ["SuperGrok Personal 3M", "AI Copilots & Writing", 3479, "#18181B", "90 days"],
    ["LinkedIn Premium Career", "Personal", 2399, "#0A66C2", "3 months"],
    ["Monday Pro Personal", "Personal", 11880, "#7C3AED", "12 months"],
    ["Gamma", "AI Tools", 479, "#4338CA", "30 days"],
    ["Entertainment Pack", "Audio", 419, "#B91C1C", "30 days"],
    ["AI Pack", "AI Tools", 1199, "#7E22CE", "30 days"],
    ["Jogg Ai", "AI Tools", 479, "#1E40AF", "30 days"],
    ["Design Pack", "Bulk Pack", 839, "#D97706", "30 days"],
    ["Artlist io Personal", "Personal", 2999, "#CA8A04", "30 days"],
    ["Microsoft 365 Business Basic", "Design & Creative Assets", 1799, "#EA580C", "year"],
    ["ilovePDF.COM", "Design & Creative Assets", 359, "#DC2626", "30 days"],
    ["ChatHub", "AI Copilots & Writing", 839, "#6D28D9", "30 days"],
    ["Hailuo AI", "AI Tools", 1079, "#C2410C", "30 days"],
    ["Claude Pro Personal", "AI Copilots & Writing", 2159, "#EA580C", "30 days"],
    ["ChatGPT Business (Personal)", "AI Copilots & Writing", 2039, "#059669", "30 days"],
    ["Google AI Pro (Personal) 18M", "AI Copilots & Writing", 599, "#2563EB", "18 months"],
    ["Producer AI", "AI Tools", 479, "#9333EA", "30 days"],
    ["PIXLR", "Design & Creative Assets", 359, "#1D4ED8", "30 days"],
    ["GitHub Student Pack Personal", "Developer & No-Code", 3000, "#111827", "24 months"],
    ["Perplexity Personal 12M", "AI Copilots & Writing", 7199, "#0F766E", "year"],
    ["Spotify Personal 1Y", "Audio", 2999, "#16A34A", "12 months"],
    ["Bolt.New Personal", "AI Tools", 4319, "#1E3A8A", "12 months"],
    ["Replit Personal 1M", "AI Tools", 959, "#EA580C", "30 days"],
  ];
  const all = [...tools.map((x, i) => [x[0], x[1], x[2], x[3], "30 days", x[4], i]), ...more.map((x, i) => [x[0], x[1], x[2], x[3], x[4], x[0] + " — premium access at a fraction of the retail price. Verified before delivery.", 100 + i])];
  for (const [name, cat, price, accent, duration, description, sort] of all) {
    const s = slug(name);
    if (await prisma.tool.findUnique({ where: { slug: s } })) continue;
    await prisma.tool.create({ data: { name, slug: s, categoryId: cats[cat], price, accent, duration, description, sort, featured: sort < 4 } });
  }
  if (!fresh) return console.log("Tools topped up; other content already exists.");

  const bundles = [
    ["SEO Combo Pack", "Best 10 SEO tools", 959, "zap", false, "Ahrefs\nSEMrush\nMoz Pro\nUbersuggest\nSpyFu\nKeywordTool.io\nSerpstat\nWoorank\nSEOsitecheckup\nScreaming Frog"],
    ["Ahrefs Combo", "Ahrefs + Semrush Combo", 2159, "star", true, "Ahrefs\nSEMrush"],
    ["Design Pack", "Most 10 popular design tools", 840, "palette", false, "Canva Pro\nFreepik\nEnvato Elements\nAdobe Express\nPicsart\nFlaticon\nVecteezy\nMotion Array\nCreative Fabrica\nDesignBundles"],
    ["Writing Pack", "Most 10 popular writing tools", 840, "pen", false, "ChatGPT\nGrammarly\nQuillBot\nJasper\nCopy.ai\nWordtune\nSurfer SEO\nNeuronWriter\nScribbr\nHemingway"],
    ["Student Pack", "Affordable tools for students", 959, "graduation", false, "Coursera\nGrammarly\nQuillBot\nChegg\nSkillshare\nCanva Pro"],
    ["Video Pack", "Complete video creation toolkit", 1151, "video", false, "CapCut Pro\nVeed.io\nEnvato Elements\nRunwayML\nVidIQ\nInVideo"],
    ["AI Pack", "Premium AI tools collection", 1199, "bot", false, "ChatGPT Plus\nMidjourney\nLeonardo AI\nRunwayML\nGoogle Veo\nElevenLabs"],
    ["Entertainment Pack", "Streaming services bundle", 419, "tv", false, "Netflix\nPrime Video\nSpotify\nDisney+ Hotstar"],
  ];
  for (const [i, [name, tagline, price, icon, popular, t]] of bundles.entries()) {
    await prisma.bundle.create({ data: { name, tagline, price, icon, popular, tools: t, sort: i } });
  }

  const plans = [
    ["Medium Pack", "Perfect for small businesses and freelancers", 1319, "star", "Choose any 10 tools from our list", true],
    ["Heavy Pack", "Ideal for growing agencies and businesses", 1559, "zap", "Choose any 15 tools from our list", false],
    ["Mega Pack", "Complete solution for large organizations", 1799, "crown", "Choose any 20 tools from our list", false],
    ["Mega Combo Pack", "Everything you need to dominate search results", 3359, "gem", "Get access to all of our tools", false],
  ];
  for (const [i, [name, tagline, price, icon, feature, popular]] of plans.entries()) {
    await prisma.packPlan.create({ data: { name, tagline, price, icon, feature, popular, sort: i } });
  }

  const reviews = [
    ["Rashed Jaman", "facebook", "Onek valo service. 100% recommended!"],
    ["Sarah Khan", "facebook", "Good after sale support. Good luck HiT Tech Pro!"],
    ["Freelancer Shamim", "facebook", "Semrush niyechilam. Satisfied."],
    ["Nasir Ahmed", "facebook", "They are professional."],
    ["Lisa Thompson", "trustpilot", "The SEMrush package's analytics and keyword research tools completely transformed how we approach SEO. Worth every penny!"],
    ["James Park", "trustpilot", "The Ahrefs subscription is fantastic. Their competitive analysis tools helped us identify key opportunities we were missing. Support is top-notch too!"],
    ["Rachel Green", "trustpilot", "Just got the AI writing package, absolutely game-changing! It has cut our writing time in half and setup was super smooth."],
    ["Daniel Reyes", "trustpilot", "Fast activation and the team replied within minutes when I had a question."],
  ];
  for (const [i, [name, source, text]] of reviews.entries()) {
    await prisma.review.create({ data: { name, source, text, sort: i } });
  }

  const faqs = [
    ["What does Group Buy mean?", "Several verified members share access to one licensed subscription and split the cost between them, so everyone pays a fraction of the retail price."],
    ["Are these shared accounts or dedicated accounts?", "It depends on the tool. Some are private slots, others are shared. Each listing states which one you get."],
    ["Do you provide login details? How do I get access?", "Yes. After your payment is confirmed, access details are delivered to you by email and in your client area."],
    ["How do I get help if I need any? What are your support details?", "Reach us through live chat, WhatsApp, Telegram or email. Support is available 24/7."],
    ["Are there any limitations in the accounts?", "Some tools have fair-use limits (for example daily download limits). These are written in each tool's description."],
    ["Do we support refunds?", "Yes. If access does not work and we cannot fix it, we refund automatically within 24 hours of your report."],
    ["Do you guarantee all tools work all the time?", "We monitor every tool continuously and replace failing accounts quickly, but we cannot guarantee zero downtime from third-party providers."],
    ["Are these tools available for MAC?", "Yes. Tools are browser or cloud based and work on Mac, Windows and Linux."],
    ["Can I share your tools with others?", "No. Access is for your own use only. Sharing credentials can get the account suspended."],
    ["When will I get tools access?", "Usually within minutes of payment confirmation during working hours."],
  ];
  for (const [i, [question, answer]] of faqs.entries()) {
    await prisma.faq.create({ data: { question, answer, sort: i } });
  }

  console.log("Seeded content.");
}

main().finally(() => prisma.$disconnect());
