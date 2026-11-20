# Workflow: Video Import & Validation

Validate and import a video file into the Auto Clipper system.

## Purpose

Ensure the source video is accessible, valid, and ready for processing before starting the full pipeline.

## Steps

### 1. Check Filesystem Access
```typescript
// Verify path is within allowed directories
const fsCheck = filesystemGuard.validatePath(inputPath, 'read');
if (!fsCheck.allowed) throw new Error(fsCheck.error);
```

### 2. Validate File Extension
```typescript
const extCheck = filesystemGuard.validateExtension(inputPath, config.allowedVideoExtensions);
if (!extCheck.allowed) throw new Error(extCheck.error);
```

### 3. Validate File Size
```typescript
const sizeCheck = filesystemGuard.validateFileSize(inputPath);
if (!sizeCheck.allowed) throw new Error(sizeCheck.error);
```

### 4. Get Technical Metadata (FFprobe)
```typescript
const info = await mcp.call('get_video_info', { videoPath: inputPath });

// Verify video stream exists
if (!info.hasVideo) throw new Error('No video stream found');

// Log key metadata
console.log(`Duration: ${info.duration}s`);
console.log(`Resolution: ${info.width}x${info.height}`);
console.log(`FPS: ${info.fps}`);
console.log(`Codec: ${info.videoCodec}`);
console.log(`Bitrate: ${info.videoBitrate} bps`);
console.log(`Audio: ${info.hasAudio ? 'Yes' : 'No'}`);
console.log(`File Size: ${(info.fileSize / 1024 / 1024).toFixed(1)} MB`);
```

### 5. Check Database for Existing Record
```typescript
const existing = await videoRepository.findByPath(inputPath);
if (existing) {
  console.log(`Video already imported: ${existing.id}`);
  return existing;
}
```

### 6. Create Video Record
```typescript
const video = {
  id: uuidv4(),
  originalPath: inputPath,
  duration: info.duration,
  width: info.width,
  height: info.height,
  fps: info.fps,
  codec: info.videoCodec,
  bitrate: info.videoBitrate,
  fileSize: info.fileSize,
  format: info.format,
  createdAt: new Date(),
  updatedAt: new Date(),
};

await videoRepository.create(video);
return video;
```

## Output

- `VideoMetadata` object with all technical details
- Video ID for tracking

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `FILE_NOT_FOUND` | Path doesn't exist | Verify path |
| `PATH_NOT_ALLOWED` | Outside allowed dirs | Move file or update config |
| `INVALID_FORMAT` | Unsupported extension | Convert or add extension |
| `FILE_TOO_LARGE` | Exceeds maxFileSize | Compress or increase limit |
| `NO_VIDEO_STREAM` | Corrupt or audio-only file | Use different source |
| `FFPROBE_FAILED` | FFmpeg not installed | Install FFmpeg |

## Validation Checklist

- [ ] File exists and is readable
- [ ] Extension in allowed list
- [ ] Size within limits
- [ ] FFprobe succeeds
- [ ] Video stream present
- [ ] Duration > 0
- [ ] Resolution > 0
- [ ] Database record created