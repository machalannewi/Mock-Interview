import express from "express";
import nodemailer from "nodemailer";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ============================================
// OPTION 1: Using Ethereal Email (FREE TEST SERVICE)
// No real credentials needed - perfect for testing
// ============================================
async function testWithEthereal() {
  console.log("🧪 Testing Nodemailer with Ethereal Email...\n");

  try {
    // Create test account automatically
    const testAccount = await nodemailer.createTestAccount();
    console.log("✓ Test account created");
    console.log(`  Email: ${testAccount.user}`);
    console.log(`  Password: ${testAccount.pass}\n`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send test email
    const info = await transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: "recipient@example.com",
      subject: "✅ Nodemailer Test Email",
      text: "This is a test email from Nodemailer!",
      html: "<b>This is a test email from Nodemailer!</b><p>If you see this, nodemailer is working correctly.</p>",
    });

    console.log("✓ Email sent successfully!");
    console.log(`  Message ID: ${info.messageId}\n`);
    console.log("📧 Preview URL:");
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(previewUrl + "\n");

    return {
      success: true,
      message: "✅ Email sent successfully via Ethereal!",
      messageId: info.messageId,
      previewUrl: previewUrl,
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// OPTION 2: Using Gmail SMTP
// Requires Gmail account and App Password
// ============================================
async function testWithGmail() {
  console.log("🧪 Testing Nodemailer with Gmail...\n");

  // IMPORTANT: Use an App Password, not your regular Gmail password
  // Get App Password: https://myaccount.google.com/apppasswords
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER || "your-email@gmail.com",
      pass: process.env.GMAIL_PASS || "your-app-password",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.GMAIL_USER || "your-email@gmail.com"}>`,
      to: process.env.EMAIL_TO || "recipient@example.com",
      subject: "✅ Nodemailer Test Email",
      text: "This is a test email from Nodemailer!",
      html: "<b>This is a test email from Nodemailer!</b><p>If you see this, nodemailer is working correctly.</p>",
    });

    console.log("✓ Email sent successfully!");
    console.log(`  Message ID: ${info.messageId}\n`);

    return {
      success: true,
      message: "✅ Email sent successfully via Gmail!",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      success: false,
      error: error.message,
      tip: error.message.includes("Invalid login")
        ? "Make sure you're using an App Password, not your regular Gmail password"
        : null,
    };
  }
}

// ============================================
// OPTION 3: Using Custom SMTP Service
// Works with SendGrid, Mailgun, Titan, etc.
// ============================================
async function testWithCustomSMTP() {
  console.log("🧪 Testing Nodemailer with Custom SMTP...\n");

  const transporter = nodemailer.createTransport({
    host: "smtp.titan.email",
    port: 465,
    secure: true,
    auth: {
      user: "support@realworldfin.xyz",
      pass: "realworldfin10$",
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log("✓ SMTP connection verified\n");

    const info = await transporter.sendMail({
      from: '"Test Sender" <support@realworldfin.xyz>',
      to: "danielekene6b@gmail.com",
      subject: "✅ Nodemailer Test Email",
      text: "This is a test email from Nodemailer!",
      html: "<b>This is a test email from Nodemailer!</b><p>If you see this, nodemailer is working correctly.</p>",
    });

    console.log("✓ Email sent successfully!");
    console.log(`  Message ID: ${info.messageId}\n`);

    return {
      success: true,
      message: "✅ Email sent successfully via Custom SMTP!",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// QUICK CONNECTION TEST (WITHOUT SENDING)
// ============================================
async function testConnection() {
  console.log("🧪 Testing SMTP Connection...\n");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.your-provider.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "your-username",
      pass: process.env.SMTP_PASS || "your-password",
    },
  });

  try {
    await transporter.verify();
    console.log("✓ Connection successful! SMTP is working correctly.\n");
    return {
      success: true,
      message: "✅ SMTP connection verified!",
    };
  } catch (error) {
    console.error("❌ Connection failed:", error.message + "\n");
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// EXPRESS ROUTES
// ============================================

/**
 * GET / - Server info and available endpoints
 */
app.get("/", (req, res) => {
  res.json({
    status: "🚀 Nodemailer Test Server Running",
    port: PORT,
    endpoints: {
      "GET /": "Server info and available endpoints",
      "GET /test/ethereal":
        "Test with Ethereal Email (Free, No credentials needed)",
      "GET /test/gmail":
        "Test with Gmail SMTP (requires GMAIL_USER, GMAIL_PASS env vars)",
      "GET /test/custom":
        "Test with Custom SMTP (requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars)",
      "GET /test/connection": "Test SMTP connection only (no email sent)",
      "POST /test/ethereal": "Same as GET /test/ethereal",
      "POST /test/gmail": "Same as GET /test/gmail",
      "POST /test/custom": "Same as GET /test/custom",
      "POST /test/connection": "Same as GET /test/connection",
    },
    environment: {
      GMAIL_USER: process.env.GMAIL_USER ? "✅ Set" : "❌ Not set",
      GMAIL_PASS: process.env.GMAIL_PASS ? "✅ Set" : "❌ Not set",
      SMTP_HOST: process.env.SMTP_HOST ? "✅ Set" : "❌ Not set",
      SMTP_PORT: process.env.SMTP_PORT ? "✅ Set" : "❌ Not set",
      SMTP_USER: process.env.SMTP_USER ? "✅ Set" : "❌ Not set",
      SMTP_PASS: process.env.SMTP_PASS ? "✅ Set" : "❌ Not set",
      EMAIL_TO: process.env.EMAIL_TO ? "✅ Set" : "❌ Not set",
    },
  });
});

/**
 * GET/POST /test/ethereal - Test with Ethereal Email
 */
app.get("/test/ethereal", async (req, res) => {
  const result = await testWithEthereal();
  res.json(result);
});

app.post("/test/ethereal", async (req, res) => {
  const result = await testWithEthereal();
  res.json(result);
});

/**
 * GET/POST /test/gmail - Test with Gmail
 */
app.get("/test/gmail", async (req, res) => {
  const result = await testWithGmail();
  res.json(result);
});

app.post("/test/gmail", async (req, res) => {
  const result = await testWithGmail();
  res.json(result);
});

/**
 * GET/POST /test/custom - Test with Custom SMTP
 */
app.get("/test/custom", async (req, res) => {
  const result = await testWithCustomSMTP();
  res.json(result);
});

app.post("/test/custom", async (req, res) => {
  const result = await testWithCustomSMTP();
  res.json(result);
});

/**
 * GET/POST /test/connection - Test SMTP Connection Only
 */
app.get("/test/connection", async (req, res) => {
  const result = await testConnection();
  res.json(result);
});

app.post("/test/connection", async (req, res) => {
  const result = await testConnection();
  res.json(result);
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "🟢 Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: "404 Not Found",
    message: `Endpoint '${req.path}' not found`,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /test/ethereal",
      "GET /test/gmail",
      "GET /test/custom",
      "GET /test/connection",
    ],
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║  🚀 NODEMAILER TEST SERVER STARTED    ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser\n`);
  console.log("📌 Available test endpoints:");
  console.log(`   GET /test/ethereal   - Test with free Ethereal service`);
  console.log(`   GET /test/gmail      - Test with Gmail SMTP`);
  console.log(`   GET /test/custom     - Test with Custom SMTP`);
  console.log(`   GET /test/connection - Test connection only\n`);
  console.log("🧪 Try one: curl http://localhost:" + PORT + "/test/ethereal\n");
});

export default app;
