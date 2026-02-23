# Ara — ERHA Beauty Advisor Chatbot

Chatbot berbasis AI untuk beauty consultation, dirancang untuk mendorong konversi penjualan ERHA Acneact Acne Cleanser Scrub Beta Plus melalui pendekatan empati, soft-selling, dan alur percakapan yang natural.

---

## Demo

> Pasang API key Groq di `.env.local` lalu jalankan `npm run dev`

---

## AI Model

| Info | Detail |
|---|---|
| **Provider** | [Groq](https://console.groq.com) |
| **Model** | `llama-3.3-70b-versatile` |
| **Max Output Tokens** | 500 |
| **Temperature** | 0.85 |
| **Context Window** | Last 10 messages (windowed) |

Model dipilih karena:
- **Gratis** pada free tier Groq (6.000 req/hari, 30 RPM)
- **Cepat** — inferensi sub-1-detik via Groq's LPU
- **Kualitas** — Llama 3.3 70B setara GPT-4-class untuk bahasa Indonesia

---

## Token Usage

Token usage ditampilkan **per pesan** secara otomatis di bawah setiap respons AI:

```
in:542 · out:187 · total:729
```

Juga tersedia panel debug lengkap (tekan **Info Token** di header) yang menampilkan:
- Model yang digunakan
- Jumlah turn dalam sesi
- Total token sesi
- Breakdown per turn: input / output / total

### Strategi Efisiensi Token

| Teknik | Dampak |
|---|---|
| System prompt dipadatkan (~550 token vs ~900 token sebelumnya) | ~18% lebih hemat per request |
| Message windowing — hanya 10 pesan terakhir dikirim ke API | Prompt token tidak bertumbuh tak terbatas setelah turn ke-5 |
| Instruksi respons 3–5 kalimat di system prompt | Output token lebih terkontrol |

---

## Fitur

### Alur Percakapan (7 Tahap)

AI mengikuti alur percakapan ini secara internal dan otomatis maju ke tahap berikutnya:

1. **Sapa** — sambutan hangat, menanyakan kondisi kulit
2. **Pembukaan** — mengenalkan produk sesuai masalah yang disebut
3. **Konsultasi** — menggali masalah lebih dalam (durasi, rutinitas, produk yang sudah dicoba)
4. **Testimoni** — menyisipkan testimoni real secara natural sebagai social proof
5. **Promo** — menyebutkan harga dan value proposition
6. **Closing** — soft-CTA dengan value anchor, tanpa tekanan
7. **Penutup** — menutup percakapan dengan hangat meski belum ada keputusan beli

### UI Features

- **Contextual quick reply chips** — muncul setelah setiap respons AI, berubah sesuai kedalaman percakapan untuk memandu user melalui 7 tahap
- **Testimonial cards** — tampil otomatis saat AI menyebut Amanda atau Silmi, dengan avatar, handle, dan rating bintang
- **Product card** — tampil otomatis saat AI menyebut harga atau sertifikasi, dilengkapi badge BPOM/Halal/Klinis dan tombol "Pesan Sekarang"
- **Per-message token badge** — `in · out · total` terlihat langsung di bawah setiap respons AI tanpa perlu toggle
- **Markdown rendering** — teks `**bold**` dari AI dirender menggunakan `<strong>`
- **Typing indicator** — animasi tiga titik saat AI sedang memproses
- **Product teaser** — kartu produk di welcome screen untuk membangun konteks sebelum percakapan dimulai

---

## Product Knowledge

**ERHA Acneact Acne Cleanser Scrub Beta Plus (ACSBP)**

| Atribut | Detail |
|---|---|
| Harga | Rp110.900 |
| Kemasan | 60 g |
| Expired | 30 Januari 2028 |
| BPOM | NA18201202832 |
| Halal MUI | 00150086800118 |
| Kandungan utama | BHA, Sulphur, Biodegradable Sphere Scrub |

**Manfaat:**
- Menghambat bakteri penyebab jerawat (Uji In-Vitro)
- Terbukti klinis kontrol sebum hingga 8 jam
- Butiran scrub lembut & biodegradable
- Membersihkan hingga ke pori, mengangkat sel kulit mati

**Cara pakai:** Basahi wajah → aplikasikan & pijat lembut → bilas bersih → 2–3 kali sehari

**Ketentuan komplain:** Wajib disertai video unboxing tanpa putus.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI SDK | groq-sdk |
| Runtime | Node.js |

---

## Cara Menjalankan

**1. Install dependencies**
```bash
npm install
```

**2. Buat file `.env.local`**
```
CHATBOT_API_KEY=your-groq-api-key-here
```
Dapatkan API key gratis di [console.groq.com](https://console.groq.com) → API Keys.

**3. Jalankan dev server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Struktur Proyek

```
app/
├── api/chat/route.ts   # API endpoint — Groq integration, system prompt
├── page.tsx            # Chat UI — components, token display, cards
├── layout.tsx          # Root layout
└── globals.css         # Tailwind base styles
```
