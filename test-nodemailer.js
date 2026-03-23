import nodemailer from "nodemailer";

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
    console.log(nodemailer.getTestMessageUrl(info) + "\n");
    console.log(
      "👉 Visit the link above to see your test email in a browser!\n",
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// OPTION 2: Using Gmail SMTP
// Requires Gmail account and App Password
// ============================================
// async function testWithGmail() {
//   console.log('🧪 Testing Nodemailer with Gmail...\n');

//   // IMPORTANT: Use an App Password, not your regular Gmail password
//   // Get App Password: https://myaccount.google.com/apppasswords
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'your-email@gmail.com',           // Replace with your Gmail
//       pass: 'your-app-password',               // Replace with App Password
//     },
//   });

//   try {
//     const info = await transporter.sendMail({
//       from: '"Your Name" <your-email@gmail.com>',
//       to: 'recipient@example.com',             // Replace with recipient
//       subject: '✅ Nodemailer Test Email',
//       text: 'This is a test email from Nodemailer!',
//       html: '<b>This is a test email from Nodemailer!</b><p>If you see this, nodemailer is working correctly.</p>',
//     });

//     console.log('✓ Email sent successfully!');
//     console.log(`  Message ID: ${info.messageId}\n`);

//   } catch (error) {
//     console.error('❌ Error:', error.message);
//     if (error.message.includes('Invalid login')) {
//       console.error('💡 Tip: Make sure you\'re using an App Password, not your regular Gmail password');
//     }
//   }
// }

// ============================================
// OPTION 3: Using Custom SMTP Service
// Works with SendGrid, Mailgun, etc.
// ============================================
async function testWithCustomSMTP() {
  console.log("🧪 Testing Nodemailer with Custom SMTP...\n");

  const transporter = nodemailer.createTransport({
    host: "smtp.titan.email", // Replace with your provider
    port: 465,
    secure: true,
    auth: {
      user: "support@realworldfin.xyz", // Replace with your username
      pass: "realworldfin10$", // Replace with your password
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
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// QUICK CONNECTION TEST (WITHOUT SENDING)
// ============================================
async function testConnection() {
  console.log("🧪 Testing SMTP Connection...\n");

  const transporter = nodemailer.createTransport({
    host: "smtp.titan.email", // Replace with your provider
    port: 587,
    secure: false,
    auth: {
      user: "support@interactiveglobecopy10$", // Replace with your username
      pass: "interactiveglobe10$", // Replace with your password
    },
  });

  try {
    await transporter.verify();
    console.log("✓ Connection successful! SMTP is working correctly.\n");
  } catch (error) {
    console.error("❌ Connection failed:", error.message + "\n");
  }
}

// ============================================
// RUN TESTS
// ============================================
async function runAllTests() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║     NODEMAILER TEST SUITE              ║");
  console.log("╚════════════════════════════════════════╝\n");

  // Uncomment the test you want to run:

  // Test with Ethereal (RECOMMENDED FOR QUICK TESTING)
  //   await testWithEthereal();

  // Test with Gmail
  // await testWithGmail();

  // Test with Custom SMTP
  await testWithCustomSMTP();

  // Test connection only
  // await testConnection();
}

// Run the tests
runAllTests().catch(console.error);
