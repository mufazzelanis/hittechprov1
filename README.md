# HiT Tech Pro (Next.js + Prisma + MySQL)

Premium group-buy tools store: Next.js 14 (App Router) + Tailwind + Framer Motion on the front end,
Prisma 5 + MySQL for data, and a fully custom admin panel (no third-party CMS/dashboard).

- [1. Tech stack](#1-tech-stack)
- [2. Local development setup](#2-local-development-setup)
- [3. Environment variables](#3-environment-variables)
- [4. Admin panel](#4-admin-panel)
- [5. Mobile app (PWA)](#5-mobile-app-pwa)
- [6. Customer area, affiliate and payments](#6-customer-area-affiliate-and-payments)
- [7. Pushing this project to GitHub](#7-pushing-this-project-to-github)
- [8. Deploying to Namecheap](#8-deploying-to-namecheap)
  - [8.1 Which Namecheap plan do you have?](#81-which-namecheap-plan-do-you-have)
  - [8.2 Option A - Shared/Business hosting (cPanel "Setup Node.js App")](#82-option-a---sharedbusiness-hosting-cpanel-setup-nodejs-app)
  - [8.3 Option B - Namecheap VPS](#83-option-b---namecheap-vps)
- [9. Updating the live site later](#9-updating-the-live-site-later)
- [10. Go-live checklist](#10-go-live-checklist)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18 |
| Styling / motion | Tailwind CSS, Framer Motion |
| Database | MySQL, via Prisma 5 ORM (`prisma/schema.prisma`) |
| Auth | Custom JWT cookies (`jsonwebtoken` + `bcryptjs`), no third-party auth service |
| Admin panel | Fully custom, under `/admin`, built from the same Next.js app (no separate CMS) |
| Icons | `lucide-react` + `react-icons` (brand/social logos) |
| Uploads | Saved to `public/uploads/` on local disk, served through `app/uploads/[name]/route.js` |

There is no external API, no serverless-functions requirement, and no build step outside `next build` -
it runs anywhere Node.js + MySQL are available, which is what makes Namecheap hosting (shared/cPanel or
VPS) a workable target (see [section 8](#8-deploying-to-namecheap)).

## 2. Local development setup

1. Start MySQL (XAMPP works fine). Create an empty database, e.g. `hittechpro_next`.
2. Copy the example environment file and fill in real values:
   ```
   cp .env.example .env
   ```
   (PowerShell: `Copy-Item .env.example .env`.) See [section 3](#3-environment-variables) for what each
   value means.
3. Install dependencies:
   ```
   npm install
   ```
   This also runs `prisma generate` automatically (a `postinstall` script), so the Prisma client matches
   `schema.prisma`.
4. Create the tables:
   ```
   npm run db:push
   ```
5. Seed an admin user + sample tools/bundles/reviews/FAQs:
   ```
   npm run seed
   ```
6. Start the dev server:
   ```
   npm run dev
   ```
   → http://localhost:3000

Whenever you change `prisma/schema.prisma`: stop `npm run dev` first (Windows locks the Prisma engine
file while the dev server is running), then run `npm run db:push` and `npx prisma generate`, then start
`npm run dev` again.

## 3. Environment variables

All of these live in `.env` (never committed - see `.env.example` for the documented template).

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | MySQL connection string: `mysql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `JWT_SECRET` | Long random string used to sign login sessions. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Use a **different** value in production than in local dev. |
| `ADMIN_EMAIL` | Email of the admin account created by `npm run seed` |
| `ADMIN_PASSWORD` | Password of that seeded admin account - **change it from the admin panel after your first real login** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional. Needed for "Forgot password" and order-delivery emails to actually send. Without these, reset links/delivery emails are only printed to the server console. |
| `SMMIU_API_KEY` | Optional. Needed only for the SMM Panel feature (my.smmiu.com). |
| `INDEXNOW_KEY` | Optional. Lets the site auto-notify Bing/Yandex when a page changes. Any random string. |

See `.env.example` for the full, commented template - copy it to `.env` and fill in real values.

## 4. Admin panel

- URL: `/admin`
- Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then immediately go to **Settings → Security** and set a
  real password and a fresh `JWT_SECRET` before the site is public.
- Everything on the site is editable from here: Orders, Tools, Categories, Bundles, Custom Packs,
  Reviews, FAQs, Free Offers, AI Prompt Vault, Affiliates/Payouts, Analytics, Notifications, and every
  piece of on-page text/contact/social link/payment method under **Settings** and **Page Content**.
- Admin-uploaded images (logo, favicon, tool covers, prompt covers) are saved to `public/uploads/` on
  the server's disk. That folder is intentionally excluded from git (`.gitignore`) since it's runtime
  data, not source code - see [section 9](#9-updating-the-live-site-later) for why that matters when you
  redeploy, and [section 10](#10-go-live-checklist) for backing it up.
- Paid files for Digital Products and Services (Canva templates, delivered design files) are saved to
  `storage/private/` - deliberately **outside** `public/`, so they can never be downloaded by a direct
  URL, only through the signed `/api/downloads/...` route after checking the buyer actually paid. This
  folder is also excluded from git and needs exactly the same redeploy/backup care as `public/uploads/`.

## 5. Mobile app (PWA)

- Installable on phones/tablets/desktop: Android/Chrome shows an Install banner; iPhone/iPad: Share →
  Add to Home Screen.
- The admin panel is a separate installable app ("HiT Admin", `/admin.webmanifest`).
- The service worker (`public/sw.js`) only registers in production: run `npm run build && npm start` to
  test it locally. Installing only works on `localhost` or a real HTTPS domain (not a plain
  `http://192.168.x.x` address) - one more reason the site needs real HTTPS once it's live.
- Logo/favicon: Admin → Settings → Branding. All generated app icons and the social-share image come
  from `brand/logo-original.jpg` via `powershell -ExecutionPolicy Bypass -File scripts/make-logo-assets.ps1`
  (replace that JPG to rebrand).

## 6. Customer area, affiliate and payments

- `/login` to register/sign in, `/account` for orders + the affiliate dashboard (referral link
  `/?ref=CODE`, 30-day cookie).
- Commission = Settings → "Actual commission rate", counted only on PAID/DELIVERED orders.
- Payments are manual: the buyer picks a method (Settings → Payment methods), sends money, enters the
  Transaction ID; you verify it in Admin → Orders and mark it PAID. Payout requests: Admin → Payouts.
- `/privacy`, `/terms`, `/refund` contain starter text - have it reviewed before launch.

---

## 7. Pushing this project to GitHub

This folder is not a git repository yet, so these are first-time steps (you only do this section once).

1. **Create the repository on GitHub first** (github.com → New repository, e.g. named `hittechprov1`).
   Leave it empty - do **not** tick "Add a README" or ".gitignore", since this project already has both.
   Copy the repository's HTTPS URL, e.g. `https://github.com/<you>/hittechprov1.git`.

2. **In this project folder**, turn it into a git repo and make the first commit:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Double-check `.env` is **not** in that commit (`git status` should never list it - it's excluded by
   `.gitignore`). If you ever see `.env` staged, run `git reset .env` before committing.

3. **Point it at GitHub and push:**
   ```
   git branch -M main
   git remote add origin https://github.com/<you>/hittechprov1.git
   git push -u origin main
   ```
   If it asks for a password, GitHub no longer accepts your account password over HTTPS - use a
   [Personal Access Token](https://github.com/settings/tokens) instead (paste it where it asks for the
   password), or push over SSH, or install the `gh` CLI and run `gh auth login` once.

From then on, every future change is just:
```
git add .
git commit -m "describe what changed"
git push
```

## 8. Deploying to Namecheap

### 8.1 Which Namecheap plan do you have?

Namecheap sells a few different kinds of hosting - which one you have decides how you deploy:

| Plan | Runs Node.js apps? | Use |
|---|---|---|
| **EasyWP** | No (WordPress-only) | Not usable for this project |
| **Shared / Stellar / Stellar Plus / Business hosting (cPanel)** | Yes, *if* cPanel shows **Setup Node.js App** under Software | [Option A](#82-option-a---sharedbusiness-hosting-cpanel-setup-nodejs-app) |
| **VPS (Pulsar/Quasar/Accelerator) or Dedicated Server** | Yes, full control | [Option B](#83-option-b---namecheap-vps) |

If you're not sure, log into cPanel and look for a **"Setup Node.js App"** icon under the *Software*
section. If it's there, use Option A. If you don't have cPanel at all (you SSH into a bare Ubuntu/AlmaLinux
server), you have a VPS - use Option B.

Either way you'll also need a **MySQL database** on the same account (cPanel → MySQL® Database Wizard, or
`mysql`/`mariadb` installed on the VPS) - Namecheap shared/VPS plans include this.

### 8.2 Option A - Shared/Business hosting (cPanel "Setup Node.js App")

**1) Create the MySQL database**
cPanel → *MySQL® Database Wizard* → create a database and a user, add the user to the database with ALL
PRIVILEGES. cPanel prefixes both names with your account username, e.g. `myuser_hittechpro` and
`myuser_dbuser`. Your `DATABASE_URL` will look like:
```
mysql://myuser_dbuser:the-password@localhost:3306/myuser_hittechpro
```

**2) Get the code onto the server** - the clean way is cPanel's own Git integration, pulling straight
from the GitHub repo from [section 7](#7-pushing-this-project-to-github):
cPanel → *Git™ Version Control* → **Create** → paste your GitHub repo's HTTPS URL → set a **Repository
Path** *outside* `public_html`, e.g. `/home/myuser/hittechpro-app` (Node apps on cPanel don't live inside
`public_html`; the Node.js App setup takes care of routing the domain to it).
(No Git Version Control option? Download a ZIP of the repo from GitHub and upload/extract it via cPanel's
File Manager into that same folder instead.)

**3) Create the Node.js App**
cPanel → *Setup Node.js App* → **Create Application**:
- **Node.js version**: pick the newest available (18.x or 20.x LTS; this project needs Node ≥ 18.18)
- **Application mode**: Production
- **Application root**: the folder from step 2, e.g. `hittechpro-app`
- **Application URL**: your domain (or a subdomain, e.g. `app.yourdomain.com`)
- **Application startup file**: `server.js` (see step 4 - Next.js doesn't ship one, you add a tiny one)

Next.js's own server doesn't speak cPanel's Passenger protocol directly, so this repo ships a tiny
`server.js` at the project root just for this - Passenger sets `process.env.PORT` itself; you don't
choose a port.

**4) Environment variables**
In the same *Setup Node.js App* page, use **Add Variable** to set `DATABASE_URL`, `JWT_SECRET`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD` (use fresh, real production values - not the ones from local `.env`) and
`NODE_ENV=production`.

**5) Install, build, set up the database**
Still on the *Setup Node.js App* page there's an **"Run NPM Install"** button - use it (it runs npm
inside the correct virtual environment for that app). Then open the app's **"Enter to virtual environment"**
terminal command it shows you (or use cPanel → *Terminal* / SSH if your plan includes it) and run:
```
npm run build
npx prisma db push
npm run seed
```
If shared hosting's CPU/memory limit kills `npm run build` (common on the cheapest plans), build it on
your own computer instead and upload the result: run `npm run build` locally, then upload the generated
`.next/` folder, `public/`, `package.json`, `package-lock.json`, `prisma/`, `server.js` and `next.config.js`
to the server (`node_modules` is not needed if you still run "Run NPM Install" on the server afterwards).

**6) Start it**
Back in *Setup Node.js App*, press **Restart**. Visit your domain - the site should load. If it doesn't,
check that page's **Log** / **Errors** button first.

**7) HTTPS**
cPanel → *SSL/TLS Status* → run **AutoSSL** (free) for the domain, or install a purchased Namecheap
PositiveSSL certificate the same way. Then set the real `https://yourdomain.com` address in
Admin → Settings → SEO & Tracking → "Website address", so sitemap/social-share links are correct.

### 8.3 Option B - Namecheap VPS

This is a normal Linux server, so it's a standard Node.js deployment:

```bash
# 1) System packages (Ubuntu example)
sudo apt update && sudo apt install -y mysql-server nginx git

# 2) Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 3) Get the code
git clone https://github.com/<you>/hittechprov1.git
cd hittechprov1
cp .env.example .env
nano .env   # fill in real DATABASE_URL / JWT_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD

# 4) Create the MySQL database (adjust user/password)
sudo mysql -e "CREATE DATABASE hittechpro; CREATE USER 'htp'@'localhost' IDENTIFIED BY 'a-real-password'; GRANT ALL ON hittechpro.* TO 'htp'@'localhost'; FLUSH PRIVILEGES;"

# 5) Install, build, set up tables
npm install
npm run db:push
npm run seed
npm run build

# 6) Run it permanently with PM2
sudo npm install -g pm2
pm2 start npm --name hittechpro -- start
pm2 save
pm2 startup   # then run the one command it prints, so it survives a reboot
```

Then put Nginx in front of it as a reverse proxy (`sudo nano /etc/nginx/sites-available/hittechpro`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/hittechpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com   # free HTTPS
```

## 9. Updating the live site later

Whichever option you used, the redeploy steps are the same shape:
```
git pull                      # get the latest code (or re-run cPanel's Git "Update from Remote")
npm install                   # in case dependencies changed (runs prisma generate automatically)
npx prisma db push            # only if prisma/schema.prisma changed
npm run build
```
then restart the app (cPanel: *Setup Node.js App* → Restart, or `pm2 restart hittechpro` on a VPS).
`public/uploads/` and `storage/private/` are never touched by `git pull` - your real uploaded images and
paid customer files stay exactly where they are.

## 10. Go-live checklist

- [ ] Real `JWT_SECRET` in production (different from local `.env`, long and random)
- [ ] Admin password changed from the seeded default (Admin → Settings → Security)
- [ ] Real payment numbers entered (Admin → Settings → Payments - they start as `01XXXXXXXXX` placeholders)
- [ ] `Website address` in Admin → Settings → SEO set to the real `https://` domain
- [ ] HTTPS working (AutoSSL on cPanel, or Certbot on a VPS)
- [ ] A test order placed end-to-end and marked PAID, to confirm email/notification flow works
- [ ] `/privacy`, `/terms`, `/refund` reviewed for your actual business
- [ ] A backup plan for the MySQL database (cPanel → *Backup Wizard*, or a cron'd `mysqldump` on a VPS)
      and for `public/uploads/` and `storage/private/` (real uploaded images and paid customer files -
      neither is in git, and losing `storage/private/` means losing files customers already paid for)

## 11. Troubleshooting

- **`npm install` fails at the `postinstall` step on Windows with an EPERM / file-lock error** - stop
  `npm run dev` first (it holds a lock on the Prisma engine file), then re-run `npm install`.
- **Never copy `node_modules` or a generated `.prisma` folder from your Windows machine to the Linux
  server.** Prisma downloads a different binary per operating system. Always run `npm install` (which
  runs `prisma generate`) directly on the server - copying Windows binaries over will crash every
  database call on Linux.
- **Images uploaded through the admin panel 404 on the live site** - `next start` only serves files that
  existed in `public/` when the server started; anything uploaded afterwards is served through
  `app/uploads/[name]/route.js` instead (already handled by the code) - a 404 here usually means the
  `public/uploads/` folder isn't writable by the app's user, or the app was restarted mid-upload.
- **A paid template/service file won't download, or the admin file upload fails** - same cause as above
  but for `storage/private/`: the app creates this folder itself on first upload, so it just needs the
  app's user to have write permission on the application root. If it still fails, create the folder by
  hand (`mkdir -p storage/private` in the app root) and check its permissions.
- **Site works over `http://` but the "Install app" banner / push-style features don't show** - PWA
  install and some browser APIs only work on `localhost` or real HTTPS - finish step 8's SSL setup first.
- **cPanel Node app shows "Application could not be started"** - open its **Log** in *Setup Node.js App*;
  the most common causes are a missing environment variable (step 8.2.4) or `npm run build` never having
  been run (step 8.2.5).
