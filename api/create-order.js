export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay keys are not configured"
      });
    }

    // ₹99 = 9900 paise
    const amount = 9900;

    const auth = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString("base64");

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amount,
          currency: "INR",
          receipt: `srpdf_${Date.now()}`,
          payment_capture: 1
        })
      }
    );

    const order = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: order.error?.description || "Razorpay order creation failed"
      });
    }

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}
