// Fungsi Helper Enkripsi MD5 Murni JavaScript
function md5(string) {
  function k(a, b) { return (a << b) | (a >>> (32 - b)); }
  function b(a, b) { return (a + b) & 4294967295; }
  var m = [], r = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21],
    s = [1, 5, 9, 13, 0, 4, 8, 12, 5, 8, 11, 14, 1, 4, 7, 10], i, j;
  for (i = 0; i < 64; i++) m[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  var h = [1732584193, 4023233417, 2562383102, 271733878],
    g = unescape(encodeURIComponent(string)), l = g.length, n = [(l + 8 >> 6) + 1 << 4], o, p, q;
  for (i = 0; i < l; i++) n[i >> 2] |= g.charCodeAt(i) << ((i % 4) << 3);
  n[l >> 2] |= 128 << ((l % 4) << 3); n[n.length - 2] = l * 8;
  for (i = 0; i < n.length; i += 16) {
    o = h.slice();
    for (j = 0; j < 64; j++) {
      var f = (j < 16) ? (o[1] & o[2] | ~o[1] & o[3]) : (j < 32) ? (o[3] & o[1] | ~o[3] & o[2]) : (j < 48) ? (o[1] ^ o[2] ^ o[3]) : (o[2] ^ (o[1] | ~o[3]));
      var e = o[3]; o[3] = o[2]; o[2] = o[1];
      o[1] = b(o[1], k(b(b(o[0], f), b(m[j], n[i + ((j < 16) ? j : (j < 32) ? (5 * j + 1) % 16 : (j < 48) ? (3 * j + 5) % 16 : (7 * j) % 16)])), r[j]));
      o[0] = e;
    }
    for (j = 0; j < 4; j++) h[j] = b(h[j], o[j]);
  }
  for (i = 0; i < 4; i++) {
    for (j = 0; j < 4; j++) {
      var d = (h[i] >> (j * 8)) & 255;
      g += (d < 16 ? "0" : "") + d.toString(16);
    }
  }
  return g.substring(l);
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

    // Hitung localSignature memakai enkripsi manual
    const localSignature = md5(merchantCode + amount + merchantOrderId + API_KEY);

    if (localSignature === dkuSignature && resultCode === "00") {
      return new Response("OK", { status: 200 });
    } else {
      return new Response("Bad Signature or Unpaid", { status: 400 });
    }

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
