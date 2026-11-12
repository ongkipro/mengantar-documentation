# Integrasi Mengantar di PHP & Laravel

Panduan integrasi Mengantar Public API untuk aplikasi berbasis **PHP Native** dan framework **Laravel**.
Mencakup pembuatan client cURL server-side, kalkulasi estimasi ongkir, pembuatan order, serta penanganan **Webhook resmi (HMAC-SHA256)**.

---

## 1. Konfigurasi Environment (`.env`)

```ini
MENGANTAR_API_KEY=your_production_api_key
MENGANTAR_SANDBOX_KEY=your_sandbox_api_key
MENGANTAR_SANDBOX=false
MENGANTAR_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
MENGANTAR_ORIGIN_WILAYAH_ID=5fc63038f8f44b34aa4c1cc4
MENGANTAR_PICKUP_ADDRESS_ID=632d6c76361422945dbaafd8
```

---

## 2. Webhook Handler Resmi (Penerima Notifikasi Status Real-Time)

### 2.1 Native PHP (`webhook.php`)

```php
<?php
declare(strict_types=1);

$secret = getenv('MENGANTAR_WEBHOOK_SECRET') ?: 'your_webhook_secret';

// 1. Ambil raw body SEBELUM json_decode
$rawBody = file_get_contents('php://input');

$timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
$receivedSig = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

if (empty($timestamp) || empty($receivedSig)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing signature headers']);
    exit;
}

// 2. Hitung HMAC-SHA256 dari "{timestamp}.{rawBody}"
$expectedSig = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

// 3. Verifikasi constant-time untuk cegah timing attack
if (!hash_equals($expectedSig, $receivedSig)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// 4. Cegah replay attack (toleransi waktu 5 menit)
$nowMs = (int) round(microtime(true) * 1000);
if (abs($nowMs - (int) $timestamp) > 5 * 60 * 1000) {
    http_response_code(401);
    echo json_encode(['error' => 'Timestamp expired']);
    exit;
}

// 5. Parse payload & update status di database Anda
$data = json_decode($rawBody, true);
$cnoteNo = $data['cnote_no'] ?? null;
$orderId = $data['order_id'] ?? null;
$courier = $data['courier'] ?? null;
$statusCategory = $data['status_category'] ?? null;

// TODO: Eksekusi SQL Update Status Order Anda di sini
// error_log("Order $orderId ($cnoteNo) status: $statusCategory");

// 6. Respon 200 OK secepat mungkin (< 5 detik)
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
```

### 2.2 Laravel Controller (`MengantarWebhookController.php`)

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MengantarWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $secret = config('services.mengantar.webhook_secret');

        // Penting di Laravel: gunakan getContent() untuk mendapatkan raw body asli
        $rawBody = $request->getContent();
        $timestamp = $request->header('x-timestamp');
        $receivedSig = $request->header('x-signature');

        if (!$timestamp || !$receivedSig) {
            return response()->json(['error' => 'Missing signature headers'], 401);
        }

        $expectedSig = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

        if (!hash_equals($expectedSig, $receivedSig)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Toleransi usia request 5 menit
        $nowMs = (int) round(microtime(true) * 1000);
        if (abs($nowMs - (int) $timestamp) > 300000) {
            return response()->json(['error' => 'Timestamp expired'], 401);
        }

        $payload = json_decode($rawBody, true);
        
        // Update database order di background / job
        Log::info("Mengantar Webhook received for {$payload['order_id']}: {$payload['status_category']}");

        return response()->json(['received' => true], 200);
    }
}
```

> **Catatan Middleware Laravel:** Pastikan route webhook Anda dikecualikan dari middleware `VerifyCsrfToken` di `bootstrap/app.php` atau `app/Http/Middleware/VerifyCsrfToken.php`:
> ```php
> ->validateCsrfTokens(except: [
>     'api/webhook/mengantar',
> ])
> ```

---

## 3. Client Sederhana Mengantar PHP (`MengantarClient.php`)

```php
<?php
declare(strict_types=1);

class MengantarClient
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct(string $apiKey, bool $isSandbox = false)
    {
        $this->apiKey = $apiKey;
        $this->baseUrl = $isSandbox 
            ? 'https://sandbox.mengantar.com' 
            : 'https://api-public.mengantar.com';
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $url = $this->baseUrl . $path;
        $ch = curl_init();

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($method === 'GET' && !empty($data)) {
            $url .= '?' . http_build_query($data);
        } elseif (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL Error: " . $error);
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400 || (isset($decoded['success']) && $decoded['success'] === false)) {
            $msg = $decoded['message'] ?? "Request failed with HTTP $httpCode";
            throw new Exception("Mengantar API Error: $msg", $httpCode);
        }

        return $decoded;
    }

    // 1. Cari wilayah
    public function searchAddress(string $keyword): array
    {
        return $this->request('GET', "/api/public/{$this->apiKey}/address/search", ['keyword' => $keyword]);
    }

    // 2. Cek ongkir akun
    public function estimate(string $originId, string $destinationId, string $courier = 'all', float $weight = 1, ?int $codAmount = null, bool $isDangerousGoods = false): array
    {
        $params = [
            'origin_id' => $originId,
            'destination_id' => $destinationId,
            'courier' => $courier,
            'weight' => $weight,
            'isDangerousGoods' => $isDangerousGoods ? 'true' : 'false',
        ];
        if ($codAmount !== null) {
            $params['COD_AMOUNT'] = $codAmount;
        }

        return $this->request('GET', "/api/public/{$this->apiKey}/order/estimate", $params);
    }

    // 3. Buat order shipment (batch)
    public function createOrder(array $payload): array
    {
        // JT Premium & SiCepat: Jangan kirim secara paralel!
        return $this->request('POST', "/api/public/{$this->apiKey}/order", $payload);
    }

    // 4. Request Cetak Label Asinkron (BETA)
    public function requestLabel(string $orderId, string $courier, string $format = 'thermal-10x15'): array
    {
        return $this->request('POST', "/api/public/{$this->apiKey}/label-generation", [
            'orderId' => $orderId,
            'courier' => $courier,
            'format' => $format,
        ]);
    }

    // 5. Cek Status Label
    public function getLabelStatus(string $labelGenerationId): array
    {
        return $this->request('GET', "/api/public/{$this->apiKey}/label-generation/{$labelGenerationId}");
    }
}
```

---

## 4. Contoh Pembuatan Order di PHP

```php
$client = new MengantarClient(getenv('MENGANTAR_API_KEY'));

$payload = [
    'courier' => 'JNE', // 'JNE', 'SiCepat', 'Sap', 'iDexpress', 'JT', 'lion', 'anteraja', 'pos' ('spx': ada di docs resmi, create-order belum teramati live)
    'pickup' => [
        'type' => 'scheduledPickup',
        'address_id' => getenv('MENGANTAR_PICKUP_ADDRESS_ID'),
        'time_id' => '62e27d81ecf5ae2893bc070b',
        'volume' => 'volumeMobil',
    ],
    'orders' => [
        [
            'goodsValue' => 125000,
            'customerAddressDataId' => '5fc62dd8f8f44b34aa4bc9aa',
            'customerAddress' => 'Jl. Merdeka No. 10, Jakarta Pusat',
            'customerName' => 'Budi Santoso',
            'customerPhone' => '081234567890',
            'parcelContent' => 'Buku Pemrograman',
            'weight' => 1,
            'quantity' => 1,
            'isDangerousGoods' => false,
        ]
    ]
];

try {
    $res = $client->createOrder($payload);
    $orderData = $res['data'][0];
    echo "Sukses! Resi: " . ($orderData['cnote_no'] ?? 'UNPAID / PENDING');
} catch (Exception $e) {
    echo "Gagal: " . $e->getMessage();
}
```

---
<sub>Bagian dari <a href="../README.md">Dokumentasi API Mengantar</a> · oleh <b><a href="https://ongki.pro">ongki.pro</a></b> — Official Partner Mengantar</sub>
