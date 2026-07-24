/** Isi awal playground — contoh dari BRIEF Bagian 10 (function + loop + push). */

export const DEFAULT_SOAL = `Buat sebuah function bernama ambilGenap(arr).

Function ini menerima satu array berisi angka, lalu mengembalikan
array BARU yang isinya cuma angka-angka genap dari array tadi.

Contoh:
  ambilGenap([3, 8, 15, 22, 7, 10])  ->  [8, 22, 10]`;

export const DEFAULT_PSEUDOCODE = `MULAI
  siapkan wadah kosong namanya "hasil"

  ULANGI dari angka pertama sampai angka terakhir di arr
    JIKA angka sekarang habis dibagi 2
      masukkan angka itu ke dalam "hasil"
    SELESAI JIKA
  SELESAI ULANGI

  kembalikan "hasil"
SELESAI`;

export const DEFAULT_CODE = `function ambilGenap(arr) {
  var hasil = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      hasil.push(arr[i]);
    }
  }
  return hasil;
}

var output = ambilGenap([3, 8, 15, 22, 7, 10]);
console.log(output);`;
