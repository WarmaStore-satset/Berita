// Fungsi Helper untuk membuat HMAC-SHA256 murni di ekosistem Cloudflare
async function generateHmacSha256(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", 
    keyData, 
    { name: "HMAC", hash: "SHA-256" }, 
    false, 
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost(context) {
  try {
    const MERCHANT_CODE = "DS31775";
    const API_KEY = "235ededda8e44413deae7ac77fb132ca";

    let judulArtikel = "Opini Publik";
    try {
      const body = await context.request.json();
      if (body && body.judulArtikel) judulArtikel = body.judulArtikel;
    } catch(e) {}

    const paymentAmount = 3000; // Sesuai standarisasi nominal uji coba dokumentasi Duitku
    const merchantOrderId = "MH-" + Date.now(); 
    const productDetails = `Publikasi Artikel: ${judulArtikel}`;

    const email = "pembeli@mediahub.com";
    const phoneNumber = "081234567890";

    // Rumus Baru sesuai Dokumentasi Juni 2026: merchantCode + merchantOrderId + paymentAmount
    const stringToSign = MERCHANT_CODE + merchantOrderId + paymentAmount;
    
    // Generate Signature pakai HMAC-SHA256 sesuai aturan baru
    const signature = await generateHmacSha256(stringToSign, API_KEY);

    const payload = {
      merchantCode: MERCHANT_CODE,
      paymentAmount: paymentAmount,
      paymentMethod: "SP", // WAJIB DIISI: Menggunakan QRIS/E-Wallet ShopeePay Sandbox
      merchantOrderId: merchantOrderId,
      productDetails: productDetails,
      customerVaName: "Pembeli MediaHub", // Parameter wajib konfirmasi bank di dokumentasi
      email: email,
      phoneNumber: phoneNumber,
      callbackUrl: "https://mediahub-indonesia.pages.dev/callback", 
      returnUrl: "https://mediahub-indonesia.pages.dev/sukses",
      signature: signature,
      expiryPeriod: 10
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
      // Menampilkan pesan reject asli dari sistem Duitku biar jelas
      return new Response(JSON.stringify({ error: `Duitku Reject: ${result.statusMessage || "Gagal total"}` }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: `Eror Server: ${error.message}` }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
