# Strategy: Educational Content

Optimized clipping for tutorials, lessons, and educational videos.

## Characteristics

- Structured learning progression
- Step-by-step demonstrations
- Clear concepts and explanations
- Visual aids (slides, code, diagrams)
- 5-30 minutes typical

## Highlight Detection Tuning

```typescript
const educationalConfig = {
  customPrompt: `
    This is an educational/tutorial video. Find highlights that are:
    1. Complete mini-lessons (one concept, start to finish)
    2. "Aha!" moments - key insights that unlock understanding
    3. Practical demonstrations (coding, building, showing)
    4. Common mistakes and how to avoid them
    5. Pro tips and advanced techniques
    6. Visual explanations that work without audio
    7. Actionable takeaways viewers can apply immediately
    
    Prioritize: Self-contained segments with clear learning outcome
  `,
  minDuration: 20,
  maxDuration: 90,
  targetCount: 8,
  keywords: ['how to', 'step', 'key', 'important', 'remember', 'tip', 'trick', 'mistake', 'avoid', 'best practice', 'example', 'demo'],
};
```

## Clip Planning

```typescript
// Educational clips need:
// 1. Complete concept (don't cut mid-explanation)
// 2. Visual continuity (code, diagrams, screen)
// 3. Context: prerequisites mentioned
// 4. Call to action: "Try this yourself"
```

## Subtitle Strategy

- **Technical terms**: Keep exact spelling (code, commands)
- **Code snippets**: Longer display time for reading
- **Position**: Lower if screen content at bottom
- **Font**: Monospace for code segments

## Metadata Strategy

```typescript
const educationalMetadata = {
  style: 'tutorial',
  category: 'education',
  hashtags: ['#learnontiktok', '#tutorial', '#howto', '#{topic}', '#coding', '#education'],
  titleFormat: 'How to {Topic} in {Duration}s',
  descriptionFormat: 'Learn {skill} step by step. Full tutorial: {link}',
};
```

## Platform Optimization

| Platform | Format |
|----------|--------|
| TikTok | Fast tutorial, hook: "Stop doing X, do Y instead" |
| Reels | Save-worthy, carousel potential for steps |
| Shorts | Search: "How to {keyword}" |

## Common Educational Patterns

| Pattern | Clip Strategy |
|---------|---------------|
| "How to X" | Hook → steps → result |
| "X vs Y" | Comparison → winner → why |
| "Common mistake" | Wrong way → right way → explanation |
| "Pro tip" | Context → tip → demonstration |
| "Build with me" | Milestone clips (setup, core, polish) |