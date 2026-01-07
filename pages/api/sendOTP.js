export default function handler(req, res) {
  // OTP System Disabled - Switched to Google Login
  res.status(200).json({ message: "OTP disabled" });
}
