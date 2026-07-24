/**
 * Encode/decode state ke URL hash (BRIEF Bagian 5.3, dipakai persis).
 * State ditaruh di hash (`#...`), BUKAN query string — hash tidak pernah
 * dikirim ke server, jadi isi soal/kode tetap tinggal di browser.
 */

export function encodeState(obj) {
  const json = JSON.stringify(obj);
  const utf8Safe = encodeURIComponent(json).replace(
    /%([0-9A-F]{2})/g,
    function toBytes(match, p1) {
      return String.fromCharCode("0x" + p1);
    },
  );
  return btoa(utf8Safe);
}

export function decodeState(str) {
  const utf8Safe = atob(str);
  const json = decodeURIComponent(
    Array.prototype.map
      .call(utf8Safe, function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
  return JSON.parse(json);
}
