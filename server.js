// Entry point for cPanel's "Setup Node.js App" (Phusion Passenger) - see README.md section 8.2.
// Not used by `npm run dev` or a VPS deploy (those use `next dev` / `next start` directly); this file
// only exists because Passenger needs an app that listens on the PORT it assigns, not Next.js's own CLI.
const { createServer } = require("http");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000);
});
