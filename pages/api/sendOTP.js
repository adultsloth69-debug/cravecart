export default function handler(req, res) {
  // We switched to Google/Email login, so this file is disabled.
  res.status(200).json({ message: "OTP System Disabled" });
}
