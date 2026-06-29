# Kurir, Batasan & Aturan Bisnis

Sumber: `includes/class-wm-constants.php` & `class-wm-shipping-method-base.php`.

## 1. Kurir yang didukung

Ada **tiga "ruang nama" kurir** yang berbeda di plugin — penting dipahami agar tidak salah kirim:

1. **Key estimasi** — key yang muncul di response `/order/estimate` (`response.data[KEY]`). Lowercase, banyak varian.
2. **Nama shipment** — nilai `courier` yang dikirim ke `POST /order`, hasil `map_courier_name_for_shipment()`.
   Hanya 8 nilai: `JNE`, `SiCepat`, `Sap`, `iDexpress`, `JT`, `Ninja`, `lion`, `anteraja` (`ALLOWED_COURIERS`).
3. **Label tampilan** — string yang dilihat customer di checkout (`courier_name_mapping()`).

### 1.1 Tabel pemetaan lengkap

| Key estimasi (API) | Label tampilan | Nama shipment (POST /order) | Service type |
|--------------------|----------------|------------------------------|--------------|
| `jne` | JNE Express | `JNE` | regular |
| `jnecargo` / `jne trucking` / `jne trucking (cargo)` | JNE Trucking (JTR) | `JNE` | cargo |
| `sicepat` | SiCepat Ekspress | `SiCepat` | regular |
| `sicepatcargo` / `sicepat gokil` | SiCepat Cargo Kilat (Gokil) | `SiCepat` | cargo |
| `sap` | SAP Express | `Sap` | regular |
| `saplite` | SAP Lite | `Sap` | lite |
| `sapcargo` | SAP Cargo | `Sap` | cargo |
| `idexpress` | IDExpress | `iDexpress` | regular |
| `idlite` / `idl` | IDExpress IDLite (Flat) | `iDexpress` | lite |
| `idexpresscargo` / `idexpress cargo` | IDExpress IDTruck (Cargo) | `iDexpress` | cargo |
| `jt` | J&T Express | `JT` | regular |
| `lion` | Lion Parcel | `lion` | regular |
| `anteraja` | Anteraja | `anteraja` | regular |
| `ninja` | Ninja Xpress | `Ninja` | regular |
| `paxel` | Paxel | (lihat catatan) | regular |
| `wahana` | Wahana | (lihat catatan) | regular |
| `pos` | POS Indonesia | (lihat catatan) | regular |

> Catatan: `paxel`, `wahana`, `pos` ada di whitelist/label-mapping tetapi class shipping method-nya
> tidak aktif (mis. `WM_Shipping_Pos` di-disable). Mereka bisa muncul di estimasi `all` tapi belum tentu
> bisa dibuat shipment-nya. Service type ditentukan dari nama: mengandung `cargo`/`trucking`/`gokil` → cargo,
> `lite`/`idl` → lite, selain itu → regular.

### 1.2 Class shipping method → kurir

| Class | courier_name (estimasi) | Judul metode |
|-------|-------------------------|--------------|
| `WM_Shipping_All` | `all` | Mengantar All Couriers (dinamis per kurir) |
| `WM_Shipping_JNE` | `JNE` | Mengantar JNE |
| `WM_Shipping_Sicepat` | `SiCepat` | Mengantar SiCepat |
| `WM_Shipping_JT` | `J&T Express` | Mengantar J&T Express |
| `WM_Shipping_Lion` | `Lion Parcel` | Mengantar Lion Parcel |
| `WM_Shipping_Ninja` | `Ninja` | Mengantar Ninja |
| `WM_Shipping_Anteraja` | `Anteraja` | Mengantar Anteraja |
| `WM_Shipping_SAP` | `SAP` | Mengantar SAP |
| `WM_Shipping_IDExpress` | `IDExpress` | Mengantar IDExpress |

WC method ID berformat `woo_mengantar_shipping_{courier}` (mis. `woo_mengantar_shipping_jne`).
Untuk metode `all`, rate per kurir punya ID `..._jne`, `..._sicepat`, dst.

---

## 2. Batas berat per jenis layanan

| Service type | Batas berat |
|--------------|-------------|
| Regular | 50 kg |
| Cargo | 100 kg |
| Lite | 0.5 kg |

Rate kurir di-skip bila berat paket melebihi batas service type-nya.
Berat minimum yang dikirim ke API: **1 kg** (di-clamp `max(1, weight)`).

---

## 3. Aturan COD (Cash on Delivery)

### Batas minimum COD

| Kurir | Min COD (IDR) |
|-------|---------------|
| Umum | 1.000 |
| Lion | 10.000 |

### Batas maksimum COD per kurir

| Kurir | Max COD (IDR) |
|-------|---------------|
| JNE | 5.000.000 |
| iDexpress | 5.000.000 |
| Lion | 5.000.000 |
| SiCepat | 2.500.000 |
| J&T (JT) | 2.000.000 |
| AnterAja | 2.000.000 |
| Ninja | 10.000.000 |

### Aturan tambahan COD
- **SAP Cargo tidak mendukung COD** → di-skip saat metode bayar = COD.
- Saat memilih rate untuk order COD, plugin mengirim `cod_amount` = nilai isi keranjang.
- Rate di-skip bila `cod_amount` di luar rentang min–max kurir.

---

## 4. Perhitungan biaya layanan COD (markup)

Plugin menambahkan fee COD di atas ongkir (opsi toko). Variabel terkait:

| Opsi | Default | Arti |
|------|---------|------|
| `wm_cod_courier_fee_percent` | 3 | Persen fee COD dari nilai |
| `wm_cod_fee_type` | `product_shipping` | Basis perhitungan fee |
| `wm_cod_courier_minimal_fee` | 0 | Fee minimum |
| `wm_cod_courier_maximal_fee` | (kosong) | Fee maksimum (opsional) |

**Rumus fee COD per produk** (`calculate_cod_fee`):
```
base    = line_total produk (atau line_total + ongkir, tergantung fee_type)
fee     = base × fee_percent / 100
if (min_fee > 0 && fee < min_fee) fee = min_fee
if (max_fee > 0 && fee > max_fee) fee = max_fee
cod_fee_paket = fee TERBESAR di antara semua item dalam paket
```
- `fee_type = product_only` → base = harga produk saja.
- `fee_type = product_shipping` → base = harga produk + ongkir terpilih.
- Fee ini ditambah ke ongkir yang ditampilkan (`total = ongkir + cod_fee`).

**Override per produk** (meta produk, menimpa setting global bila `_mengantar_cod_override = yes`):
`_mengantar_cod_fee_percent`, `_mengantar_cod_fee_type`, `_mengantar_cod_min_fee`, `_mengantar_cod_max_fee`.

**Hubungan dengan field `COD` di `POST /order`:** nilai `COD` per item = `nilai_barang +
porsi_ongkir + porsi_cod_fee` (proporsional terhadap total nilai keranjang, lalu di-`round()`).
Jadi yang ditagih kurir ke penerima = total belanja + ongkir + fee COD.

> Perhitungan fee ini **logika toko**, bukan dari API Mengantar. Saat membangun ulang, kamu
> bebas memakai aturan COD sendiri — yang penting nilai `COD` yang dikirim ke API benar.

---

## 5. Berat volumetrik (opsional)

| Opsi | Default | Arti |
|------|---------|------|
| `wm_enable_volumetric` | `no` | Aktifkan berat volumetrik |
| `wm_volumetric_divisor` | 6000 | Pembagi umum (cm³ → kg) |
| `wm_volumetric_divisor_jne` | 4000 | Pembagi khusus JNE |

Rumus standar: `berat_volumetrik = (P × L × T) / divisor`. Berat tagih = `max(berat_aktual, berat_volumetrik)`.

---

## 6. Validasi alamat

- Alamat tujuan minimal **10 karakter** (`MIN_DESTINATION_ADDRESS_LENGTH`).
  Plugin menolak checkout bila lebih pendek.

---

## 7. Jenis pickup & volume

| Opsi | Nilai | Default |
|------|-------|---------|
| Tipe pickup | `scheduledPickup` (dijemput) / `dropOff` (antar sendiri) | `scheduledPickup` |
| Volume kendaraan | `volumeMotor` / `volumeMobil` / `volumeTruck` | `volumeMobil` |

Nilai enum di atas dikonfirmasi dari dropdown setting plugin (Scheduled Pickup / Drop Off; Volume Motor / Mobil / Truck).

**Field `assignee` (opsional di `POST /order`):** ID/penanda kurir-lapangan/agen yang ditugaskan
mengambil paket. Plugin hanya mengirimnya bila terisi (mis. dari kolom `Assignee` saat import).
Boleh dikosongkan.

- `scheduledPickup` butuh `time_id` (jadwal dari endpoint `/time`).
- `dropOff` tidak butuh jadwal.
- Jadwal pickup minimal **2 jam ke depan** (`WM_PICKUP_TIME_HORIZON_SECONDS = 7200`).
- Auto-schedule: bila tidak ada jadwal cocok, plugin bisa otomatis `POST /time` membuat slot baru,
  atau menandai shipment `pending_pickup_time` untuk dipilih manual (lihat [04-how-it-works.md](04-how-it-works.md)).

---

## 8. Mode sandbox

- Aktif bila opsi `wm_sandbox_mode = yes` **dan** sandbox API key terisi.
- Saat aktif: base URL → `https://sandbox.mengantar.com`, dan key produksi diganti sandbox key.
- Gunakan sandbox untuk semua testing create-order agar tidak membuat shipment asli.

---

## 9. Checklist alur end-to-end

1. **Origin**: pastikan ada minimal satu alamat pickup (`GET /address`) → simpan `origin_id`.
2. **Destination**: autocomplete `GET /address/search?keyword=` → ambil `id` sebagai `destination_id`.
3. **Estimasi**: `GET /order/estimate?origin_id=&destination_id=&courier=all&weight=` → tampilkan harga per kurir.
4. **Validasi**: cek batas berat & (jika COD) batas COD kurir terpilih.
5. **(Jika scheduledPickup)**: `GET /time?address={origin_id}` → pilih `time_id`.
6. **Create**: `POST /order` dengan `courier` (nama shipment), `pickup`, `orders[]` → simpan `cnote_no` (resi) + `ORDER_ID`.
7. **Tracking**: `GET /order?order_id=` / `?tracking_id=` untuk update status; tautkan ke halaman tracking Mengantar.
