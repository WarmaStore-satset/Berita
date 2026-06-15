// Fungsi Helper untuk memvalidasi HMAC-SHA256 saat Duitku mengirim laporan sukses
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
    const API_KEY = "235ededda8e44413deae7ac77fb132ca";

    const formData = await context.request.formData();
    const merchantCode = formData.get("merchantCode");
    const amount = formData.get("amount");
    const merchantOrderId = formData.get("merchantOrderId");
    const resultCode = formData.get("resultCode");
    const dkuSignature = formData.get("signature");

    // Rumus Baru Callback sesuai Dokumentasi: merchantCode + amount + merchantOrderId
    const stringToSign = merchantCode + amount + merchantOrderId;
    const localSignature = await generateHmacSha256(stringToSign, API_KEY);

    if (localSignature === dkuSignature && resultCode === "00") {
      return new Response("OK", { status: 200 });
    } else {
      return new Response("Bad Signature or Unpaid", { status: 400 });
    }

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
