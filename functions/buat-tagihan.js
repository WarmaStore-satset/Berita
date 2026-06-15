export async function onRequestPost(context) {
  try {
    const MERCHANT_CODE = "DS31775";
    const API_KEY = "235ededda8e44413deae7ac77fb132ca";

    const { judulArtikel } = await context.request.json();

    const paymentAmount = 3000; // Harga Rp3.000
    const merchantOrderId = "MH-" + Date.now(); // Bikin ID Transaksi unik otomatis
    const productDetails = `Publikasi Artikel: ${judulArtikel || 'Opini Publik'}`;

    const email = "pembeli@mediahub.com";
    const phoneNumber = "081234567890";

    // Rumusnya: merchantCode + merchantOrderId + paymentAmount + apiKey
    const buffer = new TextEncoder().encode(MERCHANT_CODE + merchantOrderId + paymentAmount + API_KEY);
    const hashBuffer = await crypto.subtle.digest("MD5", buffer);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const payload = {
      merchantCode: MERCHANT_CODE,
      paymentAmount: paymentAmount,
      merchantOrderId: merchantOrderId,
      productDetails: productDetails,
      email: email,
      phoneNumber: phoneNumber,
      signature: signature,
      expiryPeriod: 10, // Masa berlaku QRIS (10 menit)
      callbackUrl: "https://mediahub-indonesia.pages.dev/functions/callback", // Nanti kita bikin
      returnUrl: "https://mediahub-indonesia.pages.dev/sukses",
    };

    const response = await fetch("https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.paymentUrl) {
      return new Response(JSON.stringify({ paymentUrl: result.paymentUrl }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: result.resultMessage || "Gagal membuat tagihan" }), { status: 400 });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

