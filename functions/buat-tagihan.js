// Fungsi Helper HMAC-SHA256 bawaan Cloudflare
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
  // Set HEADERS standar JSON respon agar frontend tidak mengira respon kosong
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    const MERCHANT_CODE = "DS31775";
    const API_KEY = "235ededda8e44413deae7ac77fb132ca";

    let judulArtikel = "Opini Publik";
    let paymentAmount = 3000; 

    // Proteksi ekstra pembacaan JSON body agar aman di ekosistem Cloudflare
    try {
      const clonedRequest = context.request.clone();
      const body = await clonedRequest.json();
      if (body) {
        if (body.judulArtikel) judulArtikel = body.judulArtikel;
        if (body.hargaPaket) paymentAmount = parseInt(body.hargaPaket);
      }
    } catch(e) {
      console.error("Sistem membaca request body kosong, menggunakan default paket.", e);
    }

    const merchantOrderId = "MH-" + Date.now(); 
    const productDetails = `Publikasi MediaHub - Paket Rp${paymentAmount.toLocaleString('id-ID')} (${judulArtikel})`;

    const email = "pembeli@mediahub.com";
    const phoneNumber = "081234567890";

    const stringToSign = MERCHANT_CODE + merchantOrderId + paymentAmount;
    const signature = await generateHmacSha256(stringToSign, API_KEY);

    const payload = {
      merchantCode: MERCHANT_CODE,
      paymentAmount: paymentAmount, 
      paymentMethod: "SP", 
      merchantOrderId: merchantOrderId,
      productDetails: productDetails,
      customerVaName: "Pembeli MediaHub",
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

    // Jika response API Duitku bermasalah / offline
    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Duitku API Eror: ${response.status} - ${errText}` }), { status: 500, headers: jsonHeaders });
    }

    const result = await response.json();

    if (result && result.paymentUrl) {
      return new Response(JSON.stringify({ paymentUrl: result.paymentUrl }), {
        headers: jsonHeaders
      });
    } else {
      return new Response(JSON.stringify({ error: `Duitku Reject: ${result.statusMessage || "Gagal memperoleh link payment"}` }), { 
        status: 400,
        headers: jsonHeaders
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: `Eror Sistem Server: ${error.message}` }), { 
      status: 500,
      headers: jsonHeaders
    });
  }
}
