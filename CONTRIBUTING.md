# Contributing to MCP Auto Clipper

Terima kasih atas minat Anda untuk berkontribusi pada MCP Auto Clipper! Dokumentasi ini akan memandu Anda melalui proses kontribusi.

## Cara Berkontribusi

### 1. Melaporkan Bug
- Cek apakah bug sudah dilaporkan di [Issues](https://github.com/Strong-Bee/MCP-Auto-Clip/issues)
- Jika belum, buat issue baru dengan template "Bug Report"
- Sertakan: versi Node.js, OS, langkah reproduksi, expected vs actual behavior, log error

### 2. Mengusulkan Fitur
- Buat issue dengan template "Feature Request"
- Jelaskan use case, manfaat, dan implementasi yang diusulkan
- Diskusikan dengan maintainer sebelum mulai implementasi

### 3. Pull Request
- Fork repository
- Buat branch baru: `git checkout -b feature/nama-fitur` atau `fix/nama-bug`
- Commit dengan pesan yang jelas (conventional commits)
- Push ke fork Anda
- Buat Pull Request ke branch `main`

## Standar Kode

### TypeScript
- Gunakan TypeScript strict mode
- Ikuti konfigurasi `tsconfig.json`
- Jalankan `npm run build` sebelum commit untuk memastikan tidak ada error

### Linting & Formatting
```bash
# Lint
npm run lint

# Build (includes type checking)
npm run build
```

### Commit Messages
Ikuti [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: tambahkan provider NVIDIA untuk transkripsi`
- `fix: memperbaiki bug sinkronisasi subtitle`
- `docs: update README dengan konfigurasi NVIDIA`
- `refactor: perbaiki struktur repository`
- `test: tambahkan unit test untuk viral scorer`

### Code Style
- Gunakan async/await daripada Promise chains
- Hindari `any` type, gunakan interface yang proper
- Tambahkan JSDoc untuk fungsi public
- Error handling yang konsisten dengan try/catch

## Struktur Project

```
src/
├── ai/              # AI services (transcription, highlights)
├── config/          # Configuration & database
├── database/        # SQLite schema, migrations, repositories
├── metadata/        # Viral metadata & scoring
├── mcp/             # MCP server implementation
├── qc/              # Quality control
├── queue/           # BullMQ job queue
├── security/        # Guardrails
├── subtitle/        # Subtitle generation
├── video/           # FFmpeg engine, ingestion, clip planning
├── workers/         # Job processing workers
└── types/           # Core type definitions
```

## Development Setup

```bash
# Clone & install
git clone https://github.com/Strong-Bee/MCP-Auto-Clip.git
cd MCP-Auto-Clip
npm install

# Build
npm run build

# Development mode
npm run dev

# Run tests
npm test

# Run migrations
npm run migrate
```

## Testing

- Tambahkan unit test untuk fitur baru di `__tests__/`
- Jalankan `npm test` sebelum PR
- Pastikan coverage tidak menurun

## Documentation

- Update README.md untuk perubahan user-facing
- Update CLAUDE.md jika ada perubahan arsitektur
- Update AGENTS.md untuk perubahan integrasi agent
- Tambahkan komentar di kode untuk logika kompleks

## Security

- JANGAN commit API keys, secrets, atau credentials
- Gunakan `.env` untuk konfigurasi lokal
- Laporkan vulnerability keamanan via private issue

## Lisensi

Dengan berkontribusi, Anda menyetujui bahwa kontribusi Anda akan dilisensikan di bawah [MIT License](LICENSE).

## Tanya Jawab

- **Apakah perlu tanda tangan CLA?** Tidak, MIT license sudah mencakup kontribusi.
- **Bagaimana cara testing tanpa API key?** Gunakan mock provider atau mode development.
- **Bisakah menambah provider AI baru?** Ya, ikuti pola `ProviderAdapter` di `src/types/index.ts`.

## Kode Etik

Proyek ini mengikuti [Contributor Covenant](https://www.contributor-covenant.org/). Dengan berpartisipasi, Anda diharapkan mematuhi kode etik ini.

---

Terima kasih telah berkontribusi! 🎬✨