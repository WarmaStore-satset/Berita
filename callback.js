export async function onRequestPost(context) {
  try {
    // 1. Amankan Kunci Keramat Sandbox Duitku Lu di Sini (Sama kayak kemarin)
    const MERCHANT_CODE = "DS31775";
    const API_KEY = "235ededda8e44413deae7ac77fb132ca";

    // Ambil data laporan kiriman dari Duitku
    const formData = await context.request.formData();
    const merchantCode = formData.get("merchantCode");
    const amount = formData.get("amount");
    const merchantOrderId = formData.get("merchantOrderId");
    const productDetail = formData.get("productDetail");
    const additionalParam = formData.get("additionalParam");
    const resultCode = formData.get("resultCode");
    const dkuSignature = formData.get("signature");

    // 2. Validasi Signature buat mastiin ini beneran laporan dari Duitku (Bukan hacker)
    // Rumus Callback: MD5(merchantCode + amount + merchantOrderId + apiKey)
    const buffer = new TextEncoder().encode(merchantCode + amount + merchantOrderId + API_KEY);
    const hashBuffer = await crypto.subtle.digest("MD5", buffer);
    const localSignature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Jika signature cocok dan resultCode murni "00" (Artinya Sukses Berhasil Dibayar)
    if (localSignature === dkuSignature && resultCode === "00") {

      return new Response("OK", { status: 200 });

    } else {
      return new Response("Bad Signature or Unpaid", { status: 400 });
    }

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
