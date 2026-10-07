# Graph Report - .  (2026-10-07)

## Corpus Check
- 263 files · ~143,308 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1137 nodes · 1478 edges · 183 communities (140 shown, 43 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.77)
- Token cost: 530,432 input · 0 output

## Community Hubs (Navigation)
- Global UI Widgets (Basket, Logo, Chat)
- Admin Bulk Actions & Inputs
- Admin Resource API Helpers
- Affiliate Page & Misc Routes
- Package Dependencies
- Affiliate Tracking & SEO/Mail Utils
- Content Admin CRUD
- Admin Global Search
- Settings & Content Defaults
- Team Admin Management
- Checkout Form Client
- Admin Auth & Permissions
- Deployment & Go-Live Guide
- Homepage Trust Sections
- User Auth & Free Offers
- Bundles & Custom Pack UI
- Admin Order Detail View
- Coming Soon & Lead Capture
- Email Validation Utilities
- SMM Panel Ordering UI
- Analytics Dashboard
- XLSX Export Builder
- Brand Icon & Offers Grid
- Homepage Hero Section
- Language Translation System
- SMMIU Reseller API Client
- Tool Limits Public Table
- Prompt Vault & Tools Grid
- Customer Account Page
- Payment Transaction Verification
- Dhaka Timezone Utilities
- Bangladeshi Phone Validation
- Team Roles API
- Account Wallet & Payout UI
- Login/Register Form
- Account Purchases List
- Dark/Light Theme System
- Database Seed Script
- Manual Order API
- SMM Order Sync API
- Admin Sales Report API
- Admin Team Member API
- Lead Submission API
- Legal Pages (Privacy/TOS)
- Service Detail Page
- Why Choose Us Comparison
- Contact Channels Config
- GA Event Tracking
- PWA Offline & Manifest
- Custom Node Server
- Admin Dashboard Page
- SMM Report Page
- Order Delivery Confirm API
- Order Events Timeline API
- Order Files Delivery API
- Admin Role Update API
- Free Offer Claim API
- Public Order Create API
- Root App Layout
- Services Listing Page
- Tool Detail Page
- JS Path Config
- GeoIP Lookup
- Rate Limiting
- Sales Popup Fake Names
- Logo Asset Generator Script
- Customer Login Page
- Admin Affiliates Page
- Admin Analytics Page
- Admin Panel Layout
- Admin Sales Page
- Analytics Sessions List API
- Order Pay Link API
- SMM Send Order API
- Admin File Upload API
- Visit Tracking API
- Translate API
- Wallet Topup Request API
- Checkout Page
- Forgot Password Page
- Admin Login Page
- 404 Not Found Page
- Brand Identity & OG Image
- Reset Password Page
- Private File Download Route
- Shared Form Field UI
- Next.js Middleware
- Next.js Config
- Original Logo & Tagline
- Brand Wordmark & App Icon
- Service Worker Cache List
- Twitter Preview Image
- Site Favicon
- PWA App Icon 192px
- PWA App Icon 512px
- Maskable PWA Icon
- Logo Mark Asset
- Customer/Affiliate Payments Concept
- Framer Motion Dependency
- Tailwind CSS Dependency

## God Nodes (most connected - your core abstractions)
1. `useCheckout()` - 19 edges
2. `useCart()` - 18 edges
3. `x()` - 16 edges
4. `Reveal()` - 14 edges
5. `RichText()` - 14 edges
6. `v()` - 11 edges
7. `parsePackages()` - 10 edges
8. `scripts` - 10 edges
9. `ToolCover()` - 9 edges
10. `parseFiles()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Progress()` --indirect_call--> `x()`  [INFERRED]
  components/LoadingSystem.jsx → app/feeds/pinterest.xml/route.js
- `httpLinks()` --indirect_call--> `x()`  [INFERRED]
  lib/seo.js → app/feeds/pinterest.xml/route.js
- `Counter()` --indirect_call--> `v()`  [INFERRED]
  components/DemoStats.jsx → tailwind.config.js
- `findCopyables()` --indirect_call--> `v()`  [INFERRED]
  lib/txn.js → tailwind.config.js
- `SettingsForm()` --indirect_call--> `save()`  [INFERRED]
  components/admin/SettingsForm.jsx → app/api/admin/free-offers/route.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PWA Offline/Install Mechanism** — readme_pwa, readme_service_worker, readme_admin_webmanifest, public_offline_offline_page [INFERRED 0.80]
- **Runtime Uploaded/Paid Content Storage Pattern** — readme_admin_panel, readme_public_uploads, readme_storage_private, readme_api_downloads_route [INFERRED 0.75]

## Communities (183 total, 43 thin omitted)

### Community 0 - "Global UI Widgets (Basket, Logo, Chat)"
Cohesion: 0.05
Nodes (39): Basket(), BrandLogo(), glowOf(), LOGO_COLOR, PATH, REACT_ICONS, ChatWidget(), COLOR (+31 more)

### Community 1 - "Admin Bulk Actions & Inputs"
Cohesion: 0.06
Nodes (44): BulkBar(), Check3(), ConfirmDelete(), downloadCsv(), Modal(), plural(), useSelection(), FilesInput() (+36 more)

### Community 2 - "Admin Resource API Helpers"
Cohesion: 0.06
Nodes (36): BULK_TYPES, POST(), buildData(), requireAdmin(), getSession(), images(), isStoredName(), lines() (+28 more)

### Community 3 - "Affiliate Page & Misc Routes"
Cohesion: 0.06
Nodes (28): AffiliatePage(), faqs, GET(), ALLOWED, POST(), GET(), plain(), x() (+20 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.05
Nodes (43): autoprefixer, bcryptjs, framer-motion, jsonwebtoken, lucide-react, next, nodemailer, dependencies (+35 more)

### Community 5 - "Affiliate Tracking & SEO/Mail Utils"
Cohesion: 0.07
Nodes (22): affiliateStats(), COUNTED, submitUrl(), submitUrls(), getTransporter(), sendMail(), consumePasswordReset(), hashToken() (+14 more)

### Community 6 - "Content Admin CRUD"
Cohesion: 0.07
Nodes (28): POST(), PUT(), save(), ANCHOR, anchorOf(), ContentField(), ContentForm(), META (+20 more)

### Community 7 - "Admin Global Search"
Cohesion: 0.09
Nodes (22): AdminSearch(), CHIPS, COLOR, esc(), ICON, Mark(), ORDER, readRecent() (+14 more)

### Community 8 - "Settings & Content Defaults"
Cohesion: 0.12
Nodes (21): GET(), has(), money(), orAll(), PAGE_OF, SECRET, CONTENT_DEFAULTS, CONTENT_KEYS (+13 more)

### Community 9 - "Team Admin Management"
Cohesion: 0.13
Nodes (18): Activity(), AddMember(), ago(), api(), AREAS, COLORS, describe(), fullDate() (+10 more)

### Community 10 - "Checkout Form Client"
Cohesion: 0.13
Nodes (12): checkName(), COMMON_PW, EmailField(), MSG_STYLE, NameField(), PasswordFields(), passwordInfo(), PhoneField() (+4 more)

### Community 11 - "Admin Auth & Permissions"
Cohesion: 0.17
Nodes (19): audit(), clientIp(), ensureSystemRoles(), getAdmin, guard(), hasPerm(), missingGrants(), otherActiveOwners() (+11 more)

### Community 12 - "Deployment & Go-Live Guide"
Cohesion: 0.12
Nodes (21): Admin Panel, /api/downloads/ Route, app/uploads/[name]/route.js, Certbot HTTPS, cPanel Setup Node.js App (Option A), Environment Variables, Pushing Project to GitHub, Go-live Checklist (+13 more)

### Community 13 - "Homepage Trust Sections"
Cohesion: 0.16
Nodes (6): CARD_STYLE, Counter(), ICONS, Reveal(), RichText(), AVATAR

### Community 14 - "User Auth & Free Offers"
Cohesion: 0.13
Nodes (5): getOffers(), JOIN_TYPES, normalizeJoins(), normalizeOffer(), jwtSecret()

### Community 15 - "Bundles & Custom Pack UI"
Cohesion: 0.19
Nodes (9): BundleCard(), useCheckout(), CustomPack(), tilt, BundlesPanel(), ToolsPanel(), Icon(), MAP (+1 more)

### Community 16 - "Admin Order Detail View"
Cohesion: 0.19
Nodes (9): digits(), EVENT_ICON, fmtDate(), LINE_LABEL, OrderDetail(), SMM_STATUS_STYLE, STATUS_STYLE, STATUSES (+1 more)

### Community 17 - "Coming Soon & Lead Capture"
Cohesion: 0.19
Nodes (10): VARIANTS, COPY, LeadButton(), external(), Glyph, list, LOOK, RequestTool() (+2 more)

### Community 18 - "Email Validation Utilities"
Cohesion: 0.22
Nodes (11): RFC-7505, checkEmail(), DISPOSABLE, isDisposable(), PLACEHOLDER, TYPOS, cache, domainMail() (+3 more)

### Community 19 - "SMM Panel Ordering UI"
Cohesion: 0.22
Nodes (10): EXAMPLE_LINK, NICE_QUANTITIES, nicePresets(), OTHER_PLATFORM, parseServiceName(), PlatformAvatar(), platformFor(), PLATFORMS (+2 more)

### Community 20 - "Analytics Dashboard"
Cohesion: 0.23
Nodes (8): AnalyticsDashboard(), DailyChart(), DEVICE_ICON, fmtDay(), fmtDT(), money(), SessionRow(), timeAgo()

### Community 21 - "XLSX Export Builder"
Cohesion: 0.29
Nodes (10): buildXlsx(), colName(), CRC, crc32(), enc, esc(), safeSheet(), sheetXml() (+2 more)

### Community 22 - "Brand Icon & Offers Grid"
Cohesion: 0.29
Nodes (7): BRAND, BrandIcon(), JOIN_TYPES, Ends(), fmtDate(), isUrl(), OffersGrid()

### Community 23 - "Homepage Hero Section"
Cohesion: 0.22
Nodes (6): container, Hero(), item, parseAnnouncement(), PERK_COLORS, PERK_ICONS

### Community 24 - "Language Translation System"
Cohesion: 0.29
Nodes (7): collectTextNodes(), LangContext, LangProvider(), SKIP_TAGS, sleep(), useLang(), LangToggle()

### Community 25 - "SMMIU Reseller API Client"
Cohesion: 0.38
Nodes (9): call(), smmAddOrder(), smmBalance(), smmCancel(), smmMultiStatus(), smmOrderStatus(), smmRefill(), smmRefillStatus() (+1 more)

### Community 26 - "Tool Limits Public Table"
Cohesion: 0.25
Nodes (3): SORTS, StatusBadge(), STYLE

### Community 27 - "Prompt Vault & Tools Grid"
Cohesion: 0.28
Nodes (3): Card(), isNew(), ToolCover()

### Community 28 - "Customer Account Page"
Cohesion: 0.39
Nodes (7): AccountPage(), fmt(), metadata, publicFiles(), purchaseCards(), STATUS, tk()

### Community 29 - "Payment Transaction Verification"
Cohesion: 0.32
Nodes (5): checkTxn(), extractTxn(), findCopyables(), METHOD_INFO, MFS

### Community 30 - "Dhaka Timezone Utilities"
Cohesion: 0.52
Nodes (6): addDays(), daysBetween(), dhakaDay(), dhakaStart(), pad(), validDay()

### Community 31 - "Bangladeshi Phone Validation"
Cohesion: 0.33
Nodes (5): BD_OPERATORS, checkPhone(), fakeReason(), PHONE_CODES, RULES

### Community 32 - "Team Roles API"
Cohesion: 0.53
Nodes (5): bad(), GET(), POST(), ROLE_ORDER, sortRoles()

### Community 34 - "Login/Register Form"
Cohesion: 0.47
Nodes (5): AuthForm(), STRENGTH_COLOR, STRENGTH_LABEL, strengthOf(), validateField()

### Community 36 - "Dark/Light Theme System"
Cohesion: 0.47
Nodes (4): applyMetaColor(), MODES, ThemeCtx, ThemeProvider()

### Community 37 - "Database Seed Script"
Cohesion: 0.40
Nodes (5): bcrypt, main(), prisma, { PrismaClient }, slug()

### Community 38 - "Manual Order API"
Cohesion: 0.60
Nodes (4): clip(), fail(), POST(), STATUSES

### Community 39 - "SMM Order Sync API"
Cohesion: 0.60
Nodes (4): ADVANCEABLE_FROM, deny(), POST(), PROGRESS_MAP

### Community 40 - "Admin Sales Report API"
Cohesion: 0.60
Nodes (3): ALL, GET(), group()

### Community 41 - "Admin Team Member API"
Cohesion: 0.90
Nodes (4): bad(), DELETE(), loadTarget(), PATCH()

### Community 42 - "Lead Submission API"
Cohesion: 0.50
Nodes (4): clip(), LABEL, POST(), TYPES

### Community 44 - "Service Detail Page"
Cohesion: 0.80
Nodes (4): generateMetadata(), getService(), plain(), ServicePage()

### Community 46 - "Contact Channels Config"
Cohesion: 0.70
Nodes (4): clean(), getChannels(), handle(), isUrl()

### Community 47 - "GA Event Tracking"
Cohesion: 0.50
Nodes (4): GA, gaParams(), PIN, track()

### Community 48 - "PWA Offline & Manifest"
Cohesion: 0.40
Nodes (5): icons/icon-192.png, Offline Fallback Page, /admin.webmanifest, Mobile App (PWA), public/sw.js Service Worker

### Community 49 - "Custom Node Server"
Cohesion: 0.40
Nodes (4): app, { createServer }, handle, next

### Community 50 - "Admin Dashboard Page"
Cohesion: 0.67
Nodes (3): Dashboard(), dayKey(), STATUS_STYLE

### Community 53 - "Order Delivery Confirm API"
Cohesion: 0.83
Nodes (3): deny(), nl2br(), POST()

### Community 55 - "Order Files Delivery API"
Cohesion: 0.83
Nodes (3): DELETE(), deny(), POST()

### Community 57 - "Admin Role Update API"
Cohesion: 0.83
Nodes (3): bad(), DELETE(), PUT()

### Community 58 - "Free Offer Claim API"
Cohesion: 0.83
Nodes (3): clip(), fail(), POST()

### Community 59 - "Public Order Create API"
Cohesion: 0.83
Nodes (3): clip(), fail(), POST()

### Community 62 - "Tool Detail Page"
Cohesion: 0.83
Nodes (3): generateMetadata(), getTool(), ToolPage()

### Community 63 - "JS Path Config"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 64 - "GeoIP Lookup"
Cohesion: 0.67
Nodes (3): cache, geoLookup(), isPrivate()

### Community 65 - "Rate Limiting"
Cohesion: 0.67
Nodes (3): clientIp(), hits, limited()

### Community 90 - "Brand Identity & OG Image"
Cohesion: 0.67
Nodes (3): HitTechPro Brand Identity, Open Graph Preview Image, Unlimited Tech Solution Tagline

## Knowledge Gaps
- **204 isolated node(s):** `PAGES`, `metadata`, `STATUS`, `metadata`, `metadata` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `Settings & Content Defaults` to `Admin Bulk Actions & Inputs`, `Admin Resource API Helpers`, `Affiliate Page & Misc Routes`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `x()` connect `Affiliate Page & Misc Routes` to `Global UI Widgets (Basket, Logo, Chat)`, `Admin Bulk Actions & Inputs`, `Affiliate Tracking & SEO/Mail Utils`, `Content Admin CRUD`, `Why Choose Us Comparison`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `parsePackages()` connect `Admin Resource API Helpers` to `Settings & Content Defaults`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `x()` (e.g. with `AffiliatePage()` and `GET()`) actually correct?**
  _`x()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PAGES`, `metadata`, `STATUS` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Global UI Widgets (Basket, Logo, Chat)` be split into smaller, more focused modules?**
  _Cohesion score 0.05174825174825175 - nodes in this community are weakly interconnected._
- **Should `Admin Bulk Actions & Inputs` be split into smaller, more focused modules?**
  _Cohesion score 0.06328320802005012 - nodes in this community are weakly interconnected._