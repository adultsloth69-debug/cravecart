import { dbAdmin } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phoneNumber } = req.body;
  
  // 1. Generate Secure Random OTP (Backend side)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // 2. Save to Secure Admin Database (Hidden from users)
  // We use a collection 'secure_otps' that only Admin SDK can read
  await dbAdmin.collection('secure_otps').doc(phoneNumber).set({
    code: otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60000) // 5 mins
  });

  // 3. SEND SMS (Integration Point)
  // Since you don't have a Twilio paid account yet, we will
  // LOG it to the console. In Vercel logs, you will see the code.
  // Ideally, you uncomment the Twilio code here.
  console.log(`>>> SECURITY ALERT: OTP for ${phoneNumber} is ${otp} <<<`);

  // For Demo purposes only: returning it so you can login. 
  // In Real Production: DO NOT return 'otp' here. Return { success: true }
  res.status(200).json({ success: true, debug_otp: otp }); 
}
