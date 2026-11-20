# ADDITIONAL REQUIREMENT — AUTO CLIPPER AGENT SKILL

## 1. Tujuan

Buat Agent Skill bernama `auto-clipper` yang terintegrasi langsung dengan MCP Auto Clip.

Skill harus kompatibel dengan:

- Claude Code
- OpenCode
- Agent lain yang mendukung format Agent Skills

Skill bukan sekadar dokumentasi. Skill harus berisi instruksi operasional yang dapat digunakan agent untuk menjalankan seluruh workflow clipping melalui MCP tools.

## 2. Struktur Skill

Buat struktur berikut:

```text
skills/
└── auto-clipper/
    ├── SKILL.md
    ├── README.md
    ├── workflows/
    │   ├── auto-clip.md
    │   ├── import-video.md
    │   ├── analyze-video.md
    │   ├── find-highlights.md
    │   ├── create-clips.md
    │   ├── subtitle-generation.md
    │   ├── generate-metadata.md
    │   ├── quality-control.md
    │   └── batch-processing.md
    ├── strategies/
    │   ├── podcast.md
    │   ├── interview.md
    │   ├── educational.md
    │   ├── storytelling.md
    │   ├── gaming.md
    │   └── entertainment.md
    ├── references/
    │   ├── mcp-tools.md
    │   ├── video-formats.md
    │   ├── subtitle-guidelines.md
    │   ├── highlight-scoring.md
    │   └── troubleshooting.md
    └── templates/
        ├── clip-plan.json
        ├── clip-metadata.json
        └── quality-report.json
```

## 3. SKILL.md

Buat `SKILL.md` dengan metadata Agent Skills yang valid:

```yaml
---
name: auto-clipper
description: Automatically analyze long-form videos, identify engaging moments, create vertical short-form clips, generate subtitles and social media metadata, render videos, and validate output using MCP Auto Clip.
---
```

Isi instruksi utama harus mencakup:

- Kapan skill harus digunakan.
- Cara menemukan dan memanggil MCP Auto Clip.
- Cara memeriksa ketersediaan MCP tools.
- Cara mengimpor dan memvalidasi video.
- Cara menganalisis transkrip, scene, audio, dan visual.
- Cara menemukan highlight.
- Cara menyusun clip plan.
- Cara melakukan clipping otomatis.
- Cara membuat subtitle.
- Cara menghasilkan judul, deskripsi, hashtag, dan viral score.
- Cara melakukan quality control.
- Cara memperbaiki hasil yang gagal.
- Cara menyimpan dan melaporkan hasil.

## 4. Autonomous Workflow

Skill wajib mampu menjalankan workflow berikut:

1. Menerima file video atau URL sumber yang didukung.
2. Memvalidasi sumber dan mengimpor video.
3. Mengambil metadata menggunakan FFprobe.
4. Melakukan transkripsi.
5. Menganalisis scene, speaker, audio, dan visual.
6. Menemukan kandidat highlight.
7. Memberikan skor dan alasan untuk setiap kandidat.
8. Membuat clip plan.
9. Memastikan setiap klip mempunyai konteks yang cukup.
10. Melakukan smart crop ke format 9:16.
11. Menghasilkan subtitle dan melakukan sinkronisasi.
12. Melakukan render video.
13. Menghasilkan judul, deskripsi, hashtag, dan viral score.
14. Menjalankan pemeriksaan kualitas menggunakan FFprobe dan quality review.
15. Memperbaiki hasil yang gagal secara terbatas.
16. Menyimpan seluruh hasil dan membuat laporan akhir.

Gunakan MCP tools yang benar-benar tersedia. Jangan mengarang nama tool atau menganggap proses berhasil tanpa hasil dari MCP.

## 5. Autonomous Decision Making

Agent dapat mengambil keputusan secara otomatis untuk:

- Memilih momen terbaik.
- Menentukan durasi klip.
- Menentukan titik awal dan akhir.
- Memilih rasio dan posisi crop.
- Menentukan gaya subtitle.
- Memilih AI provider yang tersedia.
- Mengatur prioritas proses.
- Menentukan urutan rendering.
- Melakukan retry jika terjadi kegagalan.

Default konfigurasi:

```json
{
  "mode": "fully-automatic",
  "aspectRatio": "9:16",
  "resolution": "1080x1920",
  "format": "mp4",
  "videoCodec": "libx264",
  "audioCodec": "aac",
  "subtitleMode": "burn-in",
  "generateMetadata": true,
  "generateViralScore": true,
  "qualityControl": true,
  "maxCorrectionAttempts": 2,
  "requireApprovalBeforePublishing": true
}
```

Agent tidak boleh memublikasikan video ke platform eksternal tanpa persetujuan pengguna.

## 6. Highlight Intelligence

Gunakan sistem penilaian:

| Faktor               | Bobot |
| -------------------- | ----: |
| Hook                 |   25% |
| Information Value    |   20% |
| Emotional Impact     |   15% |
| Context Completeness |   15% |
| Storytelling         |   15% |
| Audio/Visual Quality |   10% |

Hasil analisis harus menyertakan:

- Timestamp mulai dan selesai.
- Durasi.
- Skor total.
- Alasan pemilihan.
- Kutipan transkrip yang relevan.
- Potensi kelemahan.
- Rekomendasi editing.

Skor merupakan estimasi potensi editorial, bukan jaminan viralitas.

## 7. Quality Control

Sebelum menyatakan klip selesai, agent harus memverifikasi:

- File benar-benar tersedia.
- Video dapat dibaca FFprobe.
- Resolusi sesuai target.
- Aspect ratio benar.
- Durasi sesuai clip plan.
- Audio tersedia dan dapat diputar.
- Subtitle tidak terpotong.
- Tidak ada frame hitam atau freeze yang tidak disengaja.
- Crop tidak memotong subjek utama.
- Awal dan akhir klip tidak terpotong secara semantik.
- Metadata tersimpan.

Jika pemeriksaan gagal, agent boleh memperbaiki dan melakukan render ulang maksimal dua kali.

## 8. Integrasi Claude Code

Buat integrasi:

```text
.claude/
└── skills/
    └── auto-clipper/
        └── SKILL.md
```

Skill harus bisa dipanggil melalui mekanisme skill Claude Code yang didukung versi terpasang.

Pastikan MCP Auto Clip terdaftar dan tersedia melalui konfigurasi MCP Claude Code. Jangan menimpa konfigurasi MCP yang sudah ada.

## 9. Integrasi OpenCode

Buat integrasi:

```text
.opencode/
└── skill/
    └── auto-clipper/
        └── SKILL.md
```

Pastikan format, lokasi, dan mekanisme pemanggilan skill mengikuti versi OpenCode yang digunakan.

Jangan mengasumsikan konfigurasi Claude Code otomatis kompatibel dengan OpenCode.

## 10. Skill Commands

Dokumentasikan instruksi penggunaan berikut:

```text
/auto-clipper
/auto-clipper import <video>
/auto-clipper analyze <video>
/auto-clipper find-highlights <video>
/auto-clipper create-clips <video>
/auto-clipper batch <folder>
/auto-clipper quality-check <clip>
```

Jika agent tidak mendukung slash command khusus, dokumentasikan padanan instruksi bahasa natural. Jangan mengklaim slash command tersedia sebelum mekanismenya benar-benar diimplementasikan.

## 11. Self-Review

Setelah implementasi, agent harus:

1. Memeriksa seluruh file skill.
2. Memvalidasi frontmatter dan struktur direktori.
3. Memeriksa seluruh referensi MCP tools.
4. Memastikan tidak ada tool fiktif.
5. Menguji workflow menggunakan video fixture.
6. Menguji skenario kegagalan.
7. Memastikan integrasi Claude Code dan OpenCode tidak merusak konfigurasi pengguna.
8. Memperbaiki kesalahan implementasi.
9. Membuat dokumentasi instalasi dan penggunaan.

## 12. Definition of Done

Skill dianggap selesai apabila:

- [ ] SKILL.md valid.
- [ ] Semua workflow tersedia.
- [ ] Semua strategi editing tersedia.
- [ ] Semua referensi terdokumentasi.
- [ ] Template JSON valid.
- [ ] Terhubung dengan MCP Auto Clip.
- [ ] Kompatibel dengan Claude Code.
- [ ] Kompatibel dengan OpenCode.
- [ ] Autonomous workflow berhasil diuji.
- [ ] Quality control berhasil diuji.
- [ ] Dokumentasi instalasi tersedia.

**Instruksi penting:** Implementasikan Agent Skill sebagai bagian resmi dari project MCP Auto Clip. Jangan membuat project baru atau mengganti nama MCP Auto Clip. Pastikan skill benar-benar dapat menjalankan tools MCP, bukan hanya berisi panduan tekstual.
