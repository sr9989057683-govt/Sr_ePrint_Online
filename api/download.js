import crypto from "crypto";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(403).send("Access denied");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).send("Server configuration error");
    }

    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [timestamp, signature] = decoded.split(".");

    if (!timestamp || !signature) {
      return res.status(403).send("Invalid download link");
    }

    // Link valid for 10 minutes
    const age = Date.now() - Number(timestamp);

    if (age < 0 || age > 10 * 60 * 1000) {
      return res.status(403).send("Download link expired");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(403).send("Invalid download link");
    }

    const pdfPath = path.join(
      process.cwd(),
      "private-files",
      "file.pdf"
    );

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).send("PDF file not found");
    }

    const pdf = fs.readFileSync(pdfPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SR-ePrint-Online.pdf"'
    );

    return res.status(200).send(pdf);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Download failed");
  }
}
