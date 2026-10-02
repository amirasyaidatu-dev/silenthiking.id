# 🌲 Silent Hiking Indonesia

> **Walk Slowly. Be Present. Feel More.**
> Platform full-stack untuk **booking trip silent hiking**, **toko apparel/gear**, dan **journal/blog**, dilengkapi **Dashboard Admin** lengkap (multi-admin, manajemen booking, status pembayaran, cetak invoice & laporan).

Dibangun dengan **React + Tailwind CSS** (frontend), **FastAPI/Python** (backend), dan **Supabase (PostgreSQL)** sebagai database relasional. Skema dikelola dengan **Alembic** (versioned & reversible) sehingga portabel untuk di-deploy ulang / migrasi ke PostgreSQL self-hosted.

---

## 📑 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Struktur Folder](#-struktur-folder)
4. [Instalasi & Menjalankan](#-instalasi--menjalankan)
5. [Environment Variables](#-environment-variables)
6. [Database & Migrasi (Alembic)](#-database--migrasi-alembic)
7. [ERD (Entity Relationship Diagram)](#-erd-entity-relationship-diagram)
8. [DFD (Data Flow Diagram)](#-dfd-data-flow-diagram)
9. [Flowchart Fitur](#-flowchart-fitur)
10. [Ringkasan API Endpoint](#-ringkasan-api-endpoint)
11. [Kredensial Admin Default](#-kredensial-admin-default)

---

## ✨ Fitur Utama

### Sisi Publik (Pengunjung)
- **Landing page** editorial bertema hutan/mindful (hero, filosofi, trip terdekat, koleksi apparel, testimoni, journal, FAQ, kontak).
- **Daftar & Detail Trip** — 1 trip memiliki **banyak jadwal**, kuota **maks 15 orang per jadwal**, slot realtime.
- **Alur Booking Trip (4 langkah)**:
  1. Pilih jadwal (menampilkan slot tersisa).
  2. Data diri + **wajib pilih ukuran kaos (XS–XXL)** + **wajib pilih bonus minuman (Kopi / Cokelat)**.
  3. Pembayaran — **manual transfer** (detail rekening + upload bukti transfer).
  4. Konfirmasi + **kode booking unik** + **invoice** siap cetak.
- **Toko Apparel** (terpisah dari booking trip) — katalog + filter kategori, **detail produk dengan kustomisasi ukuran & warna**, quantity, checkout manual transfer, kode pesanan.
- **Journal/Blog** — daftar artikel + filter kategori, halaman detail artikel.
- **Invoice & Status** — cek booking via kode, cetak invoice, dan **kirim ulasan** (hanya untuk booking yang sudah **APPROVED**).

### Dashboard Admin
- **Login JWT** (multi-admin, peran `admin` & `superadmin`).
- **Overview** — statistik booking, pendapatan trip & apparel, ulasan pending.
- **Kelola Trip** — CRUD trip + banyak jadwal (kuota maks 15), termasuk daftar fasilitas & timeline.
- **Manajemen Booking** — filter status, **edit data pemesan**, ubah **status pembayaran** (PENDING/APPROVED/REJECTED), lihat bukti transfer, **cetak invoice otomatis**.
- **Katalog Apparel** — CRUD produk (ukuran, warna, galeri, stok).
- **Pesanan & Laporan Apparel** — kelola status pesanan + **laporan agregat (per produk & ukuran) siap cetak**.
- **Blog/Journal** — CRUD artikel.
- **Ulasan** — moderasi ulasan yang **terikat pada booking pengguna** (anti ulasan palsu).
- **Pengaturan** — brand (nama, logo, warna, hero), **mode pembayaran**, rekening bersama, biaya proses, kontak.
- **Admin & Peran** — (khusus `superadmin`) tambah/hapus admin, atur peran.
- **Database & Migrasi** — info engine/versi/revisi Alembic + **export seluruh data (JSON)** untuk backup/migrasi.

---

## 🏗 Arsitektur & Tech Stack

| Layer | Teknologi |
|------|-----------|
| Frontend | React 19, React Router, Tailwind CSS, shadcn/ui, lucide-react, sonner, axios |
| Backend | FastAPI, SQLAlchemy 2 (async), asyncpg, Alembic, PyJWT, bcrypt |
| Database | Supabase (PostgreSQL, via Transaction Pooler) |
| Auth | JWT (Bearer token) + bcrypt password hashing |

```mermaid
graph LR
    subgraph Client["🖥️ Browser"]
        R[React SPA<br/>Tailwind + shadcn]
    end
    subgraph Server["⚙️ FastAPI :8001"]
        API["/api/* routes"]
        AUTH[JWT Auth<br/>bcrypt]
        ORM[SQLAlchemy async]
    end
    subgraph DB["🗄️ Supabase PostgreSQL"]
        PG[(Tables + Alembic)]
    end
    R -->|REST / JSON<br/>axios| API
    API --> AUTH
    API --> ORM
    ORM -->|asyncpg<br/>Transaction Pooler| PG
```

---

## 📂 Struktur Folder

```
/app
├── backend
│   ├── server.py          # FastAPI app + semua route
│   ├── database.py        # Engine & session async
│   ├── models.py          # Model SQLAlchemy (tabel)
│   ├── auth.py            # JWT, bcrypt, guard peran
│   ├── seed.py           # Seed admin + data contoh
│   ├── alembic/          # Migrasi database
│   └── .env              # ENV backend (DATABASE_URL, JWT_SECRET, ...)
└── frontend
    ├── src
    │   ├── App.js             # Routing
    │   ├── context/           # Auth & Settings context
    │   ├── lib/               # api client, format
    │   ├── components/site/   # Navbar, Footer, TripCard
    │   └── pages/            # Landing, Trip, Shop, Journal, Admin, ...
    └── .env                  # REACT_APP_BACKEND_URL
```

---

## 🚀 Instalasi & Menjalankan

### Prasyarat
- **Node.js 18+** & **Yarn**
- **Python 3.11+**
- Akun **Supabase** (gratis) → ambil **Transaction Pooler connection string** (port `6543`)

### 1) Backend
```bash
cd backend

# buat virtualenv (opsional)
python -m venv venv && source venv/bin/activate

# install dependency
pip install -r requirements.txt

# konfigurasi .env (lihat bagian Environment Variables)
# jalankan migrasi untuk membuat semua tabel
alembic upgrade head

# jalankan server (dev)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
> Saat pertama start, `seed.py` otomatis membuat admin default + data contoh (trip, apparel, blog, settings).

### 2) Frontend
```bash
cd frontend
yarn install
# set REACT_APP_BACKEND_URL di frontend/.env
yarn start          # dev  → http://localhost:3000
# atau
yarn build          # produksi (folder build/)
```

### 3) Buka aplikasi
- Situs publik: `http://localhost:3000`
- Dashboard admin: `http://localhost:3000/admin/login`

> **Catatan platform Emergent:** backend berjalan di `0.0.0.0:8001` dan frontend di `3000` melalui supervisor. Semua route backend memakai prefix `/api`. Frontend selalu memanggil `REACT_APP_BACKEND_URL`.

---

## 🔐 Environment Variables

### `backend/.env`
```env
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
JWT_SECRET="<random-64-hex>"
ADMIN_EMAIL="programingdistributor@gmail.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<password-admin>"
FRONTEND_URL="https://<frontend-url>"
```
> Jika password mengandung karakter khusus (`#`, `,`, `@`, dll), **URL-encode** bagian password (mis. `#` → `%23`, `,` → `%2C`).

### `frontend/.env`
```env
REACT_APP_BACKEND_URL=https://<backend-public-url>
```

---

## 🗃 Database & Migrasi (Alembic)

```bash
cd backend

alembic revision --autogenerate -m "pesan perubahan"   # buat migrasi dari perubahan model
alembic upgrade head                                    # terapkan migrasi
alembic downgrade -1                                    # rollback 1 langkah
alembic current                                         # cek revisi aktif
```
- Skema di-track & reversible → aman untuk **deploy ulang** / **migrasi ke PostgreSQL self-hosted (VPS)**.
- **Export data**: Dashboard Admin → **Database** → *Export Semua Data (JSON)* untuk backup/portabilitas.

---

## 🧩 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    ADMINS ||--o{ BLOGS : "menulis"
    TRIPS ||--o{ TRIP_SCHEDULES : "punya banyak jadwal"
    TRIPS ||--o{ BOOKINGS : "dipesan pada"
    TRIP_SCHEDULES ||--o{ BOOKINGS : "jadwal dipilih"
    TRIPS ||--o{ BLOGS : "opsional terkait"
    BOOKINGS ||--|| REVIEWS : "menghasilkan (1:1)"
    TRIPS ||--o{ REVIEWS : "diulas"
    APPAREL ||--o{ APPAREL_ORDERS : "dipesan"

    ADMINS {
        uuid id PK
        string username UK
        string email UK
        string name
        string password_hash
        string role "admin | superadmin"
        bool is_active
    }
    TRIPS {
        uuid id PK
        string title
        string slug UK
        string location
        string meeting_point
        string difficulty "Easy|Moderate|Private"
        string duration
        int price
        text description
        json included
        json timeline
        string wa_group_link
        string image_url
        bool is_active
    }
    TRIP_SCHEDULES {
        uuid id PK
        uuid trip_id FK
        date event_date
        int quota "maks 15"
        bool is_active
    }
    BOOKINGS {
        uuid id PK
        string booking_code UK
        uuid trip_id FK
        uuid schedule_id FK
        string full_name
        string whatsapp_number
        string email
        string emergency_contact
        text health_notes
        int participants
        string shirt_size "WAJIB XS-XXL"
        string drink_bonus "WAJIB kopi|cokelat"
        bool agreed_terms
        int total_amount
        string payment_method
        string payment_status "PENDING|APPROVED|REJECTED"
        text payment_proof
    }
    APPAREL {
        uuid id PK
        string name
        string slug UK
        string category
        int price
        string image_url
        json gallery_urls
        json sizes
        json colors
        int stock
        text description
        bool is_active
    }
    APPAREL_ORDERS {
        uuid id PK
        string order_code UK
        uuid apparel_id FK
        string product_name
        string full_name
        string whatsapp_number
        string size
        string color
        int quantity
        int total_amount
        string payment_status
        text payment_proof
    }
    BLOGS {
        uuid id PK
        uuid trip_id FK
        uuid author_id FK
        string title
        string slug UK
        string category
        string read_time
        string image_url
        text excerpt
        text content
        bool is_published
    }
    REVIEWS {
        uuid id PK
        uuid booking_id FK "UK (1:1)"
        uuid trip_id FK
        string reviewer_name
        int rating
        text comment
        bool is_approved
    }
    SETTINGS {
        string key PK
        text value
    }
```

---

## 🔄 DFD (Data Flow Diagram)

### DFD Level 0 — Konteks
```mermaid
graph TD
    V([Pengunjung]) -->|cari trip, booking, beli apparel, baca blog| S{{Silent Hiking System}}
    S -->|invoice, kode booking, status| V
    A([Admin / Superadmin]) -->|kelola konten, verifikasi bayar, laporan| S
    S -->|data, statistik, invoice, laporan| A
    S <-->|baca/tulis data| DB[(Supabase PostgreSQL)]
```

### DFD Level 1 — Proses Utama
```mermaid
graph TD
    V([Pengunjung]) --> P1[1.0 Jelajah Trip/Apparel/Blog]
    V --> P2[2.0 Booking Trip]
    V --> P3[3.0 Pesan Apparel]
    V --> P6[6.0 Kirim Ulasan]
    A([Admin]) --> P4[4.0 Autentikasi]
    A --> P5[5.0 Manajemen & Verifikasi]
    A --> P7[7.0 Laporan & Invoice]

    P1 --> D1[(trips/apparel/blogs)]
    P2 --> D2[(bookings)]
    P2 --> D3[(trip_schedules)]
    P3 --> D4[(apparel_orders)]
    P4 --> D5[(admins)]
    P5 --> D2
    P5 --> D4
    P5 --> D1
    P6 --> D6[(reviews)]
    P6 -.cek APPROVED.-> D2
    P7 --> D2
    P7 --> D4
    P5 --> D7[(settings)]
```

---

## 🧭 Flowchart Fitur

### 1) Alur Booking Trip
```mermaid
flowchart TD
    A[Buka Detail Trip] --> B[Pilih Jadwal<br/>cek slot tersisa]
    B --> C{Slot tersedia?}
    C -- Tidak --> B
    C -- Ya --> D[Isi Data Diri]
    D --> E[Pilih Ukuran Kaos WAJIB]
    E --> F[Pilih Bonus Minuman<br/>Kopi / Cokelat WAJIB]
    F --> G{Setuju S&K?}
    G -- Tidak --> F
    G -- Ya --> H[Transfer Manual<br/>+ Upload Bukti]
    H --> I[Buat Booking<br/>status PENDING]
    I --> J[Kode Booking + Invoice]
    J --> K[Admin Verifikasi Bayar]
    K --> L{Disetujui?}
    L -- Ya --> M[Status APPROVED<br/>+ link Grup WA]
    L -- Tidak --> N[Status REJECTED]
    M --> O[User bisa kirim Ulasan]
```

### 2) Alur Pesan Apparel (toko terpisah)
```mermaid
flowchart TD
    A[Buka Detail Produk] --> B[Pilih Ukuran & Warna]
    B --> C[Atur Quantity]
    C --> D[Buy Now - Form Checkout]
    D --> E[Isi Nama, WA, Alamat]
    E --> F[Transfer Manual + Upload Bukti]
    F --> G[Buat Pesanan<br/>status PENDING]
    G --> H[Kode Pesanan]
    H --> I[Admin Verifikasi]
    I --> J{Disetujui?}
    J -- Ya --> K[APPROVED - masuk laporan]
    J -- Tidak --> L[REJECTED]
```

### 3) Alur Admin (Login → Kelola)
```mermaid
flowchart TD
    A[Halaman /admin/login] --> B[Input Username+Password]
    B --> C{Kredensial valid?}
    C -- Tidak --> B
    C -- Ya --> D[JWT Token tersimpan]
    D --> E[Dashboard: Overview]
    E --> F[Kelola Trip/Jadwal]
    E --> G[Verifikasi Booking<br/>+ Cetak Invoice]
    E --> H[Katalog & Pesanan Apparel]
    E --> I[Laporan Apparel Cetak]
    E --> J[Moderasi Ulasan]
    E --> K[Pengaturan & Mode Bayar]
    E --> L{Superadmin?}
    L -- Ya --> M[Kelola Admin & Peran]
    L -- Ya --> N[Export Data / Migrasi]
    L -- Tidak --> E
```

---

## 🔌 Ringkasan API Endpoint

Semua endpoint diawali `/api`. Endpoint admin butuh header `Authorization: Bearer <token>`.

### Publik
| Method | Path | Deskripsi |
|-------|------|-----------|
| GET | `/settings/public` | Pengaturan brand/bank/kontak |
| GET | `/trips` | Daftar trip aktif + slot |
| GET | `/trips/{slug}` | Detail trip |
| POST | `/bookings` | Buat booking |
| GET | `/bookings/{code}` | Lihat booking/invoice |
| GET | `/apparel` | Daftar produk |
| GET | `/apparel/{slug}` | Detail produk |
| POST | `/apparel-orders` | Buat pesanan apparel |
| GET | `/apparel-orders/{code}` | Lihat pesanan |
| GET | `/blogs` · `/blogs/{slug}` | Daftar & detail artikel |
| GET | `/reviews` | Ulasan tampil |
| POST | `/reviews` | Kirim ulasan (butuh booking APPROVED) |

### Auth
| Method | Path |
|-------|------|
| POST | `/auth/login` |
| GET | `/auth/me` |
| POST | `/auth/logout` |

### Admin
| Resource | Endpoint |
|----------|----------|
| Overview | `GET /admin/overview` |
| Trips | `POST/PUT/DELETE /admin/trips[/{id}]` |
| Bookings | `GET /admin/bookings` · `PUT/DELETE /admin/bookings/{id}` |
| Apparel | `POST/PUT/DELETE /admin/apparel[/{id}]` |
| Apparel Orders | `GET /admin/apparel-orders` · `PUT /admin/apparel-orders/{id}` |
| Report | `GET /admin/reports/apparel` |
| Blogs | `POST/PUT/DELETE /admin/blogs[/{id}]` |
| Reviews | `GET /admin/reviews` · `PUT/DELETE /admin/reviews/{id}` |
| Settings | `GET/PUT /admin/settings` |
| Admins (superadmin) | `GET/POST/PUT/DELETE /admin/admins[/{id}]` |
| Database | `GET /admin/db-info` · `GET /admin/export` |

---

## 🔑 Kredensial Admin Default

| Field | Nilai |
|------|-------|
| URL | `/admin/login` |
| Username | `admin` |
| Password | *(sesuai `ADMIN_PASSWORD` di `backend/.env`)* |
| Role | `superadmin` |

> ⚠️ Segera ganti password default setelah login pertama (menu **Admin & Peran**).

---

© Silent Hiking Indonesia — dibangun dengan ketenangan. 🌿
