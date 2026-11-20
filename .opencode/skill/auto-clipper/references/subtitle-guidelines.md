# Subtitle Guidelines

Standards for subtitle generation, styling, and synchronization in Auto Clipper.

## SRT Format Specification

### Structure
```
[index]
[hh:mm:ss,mmm] --> [hh:mm:ss,mmm]
[text]

[blank line]
```

### Example
```
1
00:00:00,500 --> 00:00:03,200
Welcome to this tutorial

2
00:00:03,200 --> 00:00:06,800
Today we'll learn how to code
```

## ASS Format (Advanced SubStation Alpha)

Used for advanced styling. Key sections:

### [Script Info]
```
Title: Auto Clipper Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1080
PlayResY: 1920
```

### [V4+ Styles]
```
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&HFFFFFF,&HFFFFFF,&H000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,50,1
```

Color format: AABBGGRR (Alpha, Blue, Green, Red) in hex

### [Events]
```
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.50,0:00:03.20,Default,,0,0,0,,Welcome to this tutorial
```

Time format: H:MM:SS.cc (centiseconds)

## Styling Guidelines

### Default Style (Vertical Video)
| Property | Value | Reason |
|----------|-------|--------|
| Font | Arial | Universal availability |
| Size | 24pt | Readable on mobile |
| Color | White (#FFFFFF) | High contrast |
| Outline | Black (#000000), 2px | Readability on any background |
| Background | Black, 50% opacity | Ensures contrast |
| Position | Bottom | Standard placement |
| Margin V | 50px | Safe area |
| Alignment | Center-bottom (2) | Natural reading |

### Platform-Specific

#### TikTok
- Font size: 28pt
- Margin V: 60px (avoid UI elements)
- Bold for emphasis

#### Reels
- Font size: 26pt
- Margin V: 50px
- Can use brand colors

#### Shorts
- Font size: 24pt
- Margin V: 50px
- Search-friendly text

## Timing Rules

| Rule | Value |
|------|-------|
| Minimum display | 1.0s |
| Maximum display | 7.0s |
| Minimum gap | 50ms |
| Characters per line | ≤32 (portrait) |
| Maximum lines | 2 |
| Reading speed | ≤21 chars/sec |

## Text Formatting

### SRT (Limited)
- No inline formatting
- Line breaks with `\n` (not standard)

### ASS (Full)
- Bold: `{\b1}text{\b0}`
- Italic: `{\i1}text{\i0}`
- Underline: `{\u1}text{\u0}`
- Color: `{\c&HFF0000&}red{\c}`
- Font size: `{\fs36}large{\fs24}`
- Position: `{\pos(540,1800)}`

## Synchronization

### Acceptable Offset
- **Excellent**: ±100ms
- **Good**: ±200ms
- **Acceptable**: ±500ms
- **Needs fix**: >1s

### Auto-Sync Algorithm
1. Extract first/last subtitle timestamps
2. Compare to video start/end
3. Calculate offset
4. If >1s, shift all timestamps

### Manual Sync Points
- First spoken word
- Clear audio peak
- Visual cue (clap, snap)

## Special Cases

### Music/Lyrics
- Use ♪ or ♫ prefix
- Italic style
- Longer display time

### Sound Effects
- [laughter], [applause], [music]
- Square brackets
- Brief display

### Multiple Speakers
- Speaker labels: `Speaker 1: Hello`
- Different colors per speaker (ASS)
- Position near speaker (if face tracking)

## Quality Checklist

- [ ] All speech transcribed
- [ ] Timing accurate (±200ms)
- [ ] No text cutoffs
- [ ] Readable contrast
- [ ] Within safe areas
- [ ] No overlapping subtitles
- [ ] Proper line breaks
- [ ] Special sounds marked
- [ ] Speaker identification (if applicable)
- [ ] File encodes as UTF-8

## FFmpeg Burning

```bash
# SRT (simple)
-vf "subtitles='file.srt':force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,MarginV=50,Alignment=2'"

# ASS (styled)
-vf "ass='file.ass'"
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Subtitles cut off | Margin too small | Increase MarginV |
| Hard to read | Low contrast | Increase outline, add background |
| Out of sync | Wrong timestamps | Regenerate with correct offsets |
| Missing text | Transcript gaps | Check transcription quality |
| Encoding errors | Non-UTF8 | Save as UTF-8 |