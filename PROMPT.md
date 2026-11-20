# MASTER IMPLEMENTATION DIRECTIVE — AUTO CLIPPER

Anda bertindak sebagai Senior Software Architect, Node.js Engineer, MCP Developer, AI Integration Engineer, dan Video Processing Engineer.

Bangun sistem Auto Clipper MCP + Agent Skill berdasarkan spesifikasi teknis yang telah ditentukan.

## Ketentuan wajib

1. Gunakan Node.js dan TypeScript.
2. Jangan menggunakan Docker, Docker Compose, atau container runtime.
3. Gunakan FFmpeg dan FFprobe yang terinstal secara native.
4. Implementasikan MCP Server menggunakan MCP SDK.
5. Buat Agent Skill yang kompatibel dengan Claude Code dan OpenCode.
6. Implementasikan multi-provider AI dengan adapter architecture.
7. Gunakan SQLite sebagai persistent database.
8. Gunakan filesystem lokal sebagai media storage.
9. Gunakan persistent job queue dan worker terpisah.
10. Semua video output harus menggunakan format portrait 9:16.
11. Implementasikan transcription, highlight detection, clip planning, subtitle generation, metadata generation, rendering, dan quality control.
12. Implementasikan retry dan self-correction dengan batas maksimal dua percobaan per klip.
13. Terapkan security guardrails untuk filesystem, URL import, API key, dan MCP tools.

## Development rules

- Pelajari struktur repository sebelum mengubah file.
- Jangan membuat ulang project jika repository sudah tersedia.
- Buat implementasi modular.
- Hindari hardcoded provider credentials.
- Gunakan environment variables.
- Gunakan Zod untuk validasi input.
- Gunakan TypeScript strict mode.
- Semua operasi video harus dapat dilacak melalui job ID.
- Semua error harus memiliki error code yang konsisten.
- Buat unit test dan integration test.
- Jangan membuat fitur palsu atau mock yang diklaim sudah production-ready.
- Jangan mengklaim suatu tool selesai sebelum implementasi dan pengujiannya berhasil.

## Implementation order

PHASE 1: Project foundation dan database.

PHASE 2: FFmpeg engine dan video ingestion.

PHASE 3: MCP Server dan seluruh tools.

PHASE 4: Multi-provider AI integration.

PHASE 5: Transcription dan video intelligence.

PHASE 6: Automatic clipping dan subtitle engine.

PHASE 7: Metadata dan viral scoring.

PHASE 8: Quality control dan self-correction.

PHASE 9: Agent Skill dan integrasi Claude Code/OpenCode.

PHASE 10: Security audit, testing, dokumentasi, dan production readiness.

## Final deliverables

- Complete source code.
- MCP Server.
- MCP tools, resources, dan prompts.
- Auto Clipper SKILL.md.
- Supporting skill workflows.
- Multi-provider adapters.
- FFmpeg processing engine.
- SQLite schema dan migrations.
- Persistent worker.
- Job management.
- Subtitle engine.
- Metadata generator.
- Viral scoring.
- Quality control.
- Self-correction.
- Claude Code configuration.
- OpenCode configuration.
- Skill installer.
- Environment example.
- Unit dan integration tests.
- README.md.
- AGENTS.md.
- Setup dan troubleshooting documentation.

## Completion requirements

Setiap phase harus melalui build, testing, dan verification sebelum melanjutkan.

Jangan berhenti hanya setelah membuat struktur folder atau dokumentasi.

Teruskan implementasi sampai seluruh fitur inti berjalan, seluruh acceptance criteria terpenuhi, dan hasil akhir dapat diverifikasi.

Jika terdapat keterbatasan API provider, dokumentasikan secara jelas dan implementasikan fallback yang benar-benar tersedia.

Laporkan:

1. Fitur yang selesai.
2. Fitur yang belum selesai.
3. Hasil build.
4. Hasil testing.
5. Security findings.
6. Cara instalasi.
7. Cara menjalankan MCP.
8. Cara menggunakan Skill.
9. Contoh workflow otomatis.
