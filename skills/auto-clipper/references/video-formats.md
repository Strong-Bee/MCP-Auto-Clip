# Video Formats Reference

Supported video formats, codecs, and technical specifications for Auto Clipper.

## Supported Input Formats

| Extension | Container | Video Codecs | Audio Codecs | Notes |
|-----------|-----------|--------------|--------------|-------|
| .mp4 | MP4 | H.264, HEVC, VP9, AV1 | AAC, MP3, Opus | Recommended |
| .mov | QuickTime | ProRes, H.264, HEVC | PCM, AAC | Apple ecosystem |
| .avi | AVI | DivX, XviD, H.264 | MP3, AC3 | Legacy |
| .mkv | Matroska | H.264, HEVC, VP9, AV1 | AAC, Opus, FLAC | Flexible |
| .webm | WebM | VP8, VP9, AV1 | Opus, Vorbis | Web optimized |
| .flv | FLV | H.264, VP6 | AAC, MP3 | Legacy streaming |

## Output Format

| Parameter | Value |
|-----------|-------|
| Container | MP4 |
| Video Codec | libx264 (H.264) |
| Audio Codec | AAC |
| Resolution | 1080x1920 (9:16) |
| FPS | 30 |
| Video Bitrate | 2M (configurable) |
| Audio Bitrate | 128k |
| Profile | High |
| Level | 4.1 |
| Pixel Format | yuv420p |
| Fast Start | Enabled |

## Codec Compatibility

### Recommended (Full Support)
- **Video**: H.264 (libx264), HEVC (libx265)
- **Audio**: AAC, MP3

### Supported (May Need Transcode)
- **Video**: VP9 (libvpx-vp9), AV1 (libaom-av1)
- **Audio**: Opus, FLAC, Vorbis

### Not Recommended
- ProRes (large files, not web-friendly)
- DNxHR (editing codec)
- Raw video (massive files)

## FFmpeg Presets

| Preset | Speed | Quality | Use Case |
|--------|-------|---------|----------|
| ultrafast | Fastest | Lowest | Quick preview |
| veryfast | Very Fast | Low | Batch processing |
| faster | Fast | Medium-Low | Default fallback |
| fast | Fast | Medium | Balanced |
| medium | Medium | Good | Default |
| slow | Slow | Better | High quality |
| slower | Very Slow | Better | Archive quality |
| veryslow | Slowest | Best | Maximum quality |

## CRF Values (Constant Rate Factor)

| CRF | Quality | File Size | Use Case |
|-----|---------|-----------|----------|
| 18 | Visually lossless | Large | Archive |
| 20 | High | Medium-Large | High quality |
| 23 | Default | Medium | Balanced (default) |
| 26 | Medium | Small | Web/mobile |
| 30 | Low | Very Small | Bandwidth limited |

Range: 0-51 (lower = better quality)

## Bitrate Guidelines

### Video Bitrate (9:16, 30fps)

| Resolution | Low | Medium | High |
|------------|-----|--------|------|
| 1080x1920 | 1.5M | 2.5M | 5M |
| 720x1280 | 1M | 1.5M | 3M |

### Audio Bitrate

| Quality | Bitrate |
|---------|---------|
| Low | 64k |
| Medium | 128k (default) |
| High | 256k |
| Lossless | 1411k (PCM) |

## Platform Requirements

### TikTok
- Max duration: 60s (3min for some accounts)
- Max file size: 287MB
- Recommended: 1080x1920, 30fps, H.264, AAC

### Instagram Reels
- Max duration: 90s
- Max file size: 100MB (recommended)
- Recommended: 1080x1920, 30fps, H.264, AAC

### YouTube Shorts
- Max duration: 60s
- Max file size: 2GB
- Recommended: 1080x1920, 30fps, H.264, AAC

## FFprobe Output Fields

Key fields used by Auto Clipper:
- `format.duration` - Total duration in seconds
- `format.bit_rate` - Overall bitrate
- `format.format_name` - Container format
- `streams[].codec_type` - 'video' or 'audio'
- `streams[].codec_name` - Codec identifier
- `streams[].width/height` - Video dimensions
- `streams[].r_frame_rate` - Frame rate (fraction)
- `streams[].bit_rate` - Stream bitrate
- `streams[].duration` - Stream duration

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "No video stream" | Corrupt file, audio-only | Verify file, re-encode |
| "Unsupported codec" | Proprietary codec | Transcode to H.264 |
| "Invalid duration" | Container issue | Remux with FFmpeg |
| "Aspect ratio wrong" | Non-square pixels | Force SAR=1:1 |
| "Audio sync drift" | Variable frame rate | Use `-vsync cfr` |