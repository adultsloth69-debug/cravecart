import { dbAdmin } from '../../lib/firebaseAdmin';
import twilio from 'twilio';

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') return res.status(405).end();

  const { phoneNumber } = req.body;
  
  // 2. Generate Random 4-Digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // 3. Save to Secure Admin Database (Expires in 5 mins)
  await dbAdmin.collection('secure_otps').doc(phoneNumber).set({
    code: otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60000) 
  });

  // 4. Setup Twilio Client
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  // Twilio Sandbox Number (Standard)
  const whatsappFrom = 'whatsapp:+14155238886'; 

  // Check if keys exist in Vercel
  if (!accountSid || !authToken) {
      console.log(`[TEST MODE] OTP for ${phoneNumber} is ${otp}`);
      return res.status(200).json({ success: true, message: "Check Vercel Logs for OTP" });
  }

  const client = twilio(accountSid, authToken);

  try {
      // 5. SEND WHATSAPP MESSAGE
      await client.messages.create({
          body: `Your CraveCart verification code is ${otp}. Please do not share this code with anyone. This code will expire in 5 minutes. - Team CraveCart`,
          from: whatsappFrom,
          to: `whatsapp:${phoneNumber}` // MUST add 'whatsapp:' prefix
      });
      
      console.log(`WhatsApp Sent to ${phoneNumber}`);
      res.status(200).json({ success: true });
      
  } catch (error) {
      console.error("Twilio WhatsApp Error:", error);
      res.status(500).json({ success: false, error: error.message });
  }
}
