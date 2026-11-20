# Strategy: Interview Content

Optimized clipping for interview and Q&A format videos.

## Characteristics

- Structured Q&A format
- Host + guest(s)
- Clear question/answer structure
- Often 15-60 minutes
- Authority-building content

## Highlight Detection Tuning

```typescript
const interviewConfig = {
  customPrompt: `
    This is an interview video. Find highlights that are:
    1. Best answers to compelling questions
    2. Guest's unique expertise/credentials
    3. Controversial or contrarian takes
    4. Personal stories/anecdotes
    5. Actionable advice from expert
    6. Emotional or vulnerable moments
    7. "Money quote" - most shareable soundbite
    
    Structure: Include the question as context, focus on the answer.
    Pair related Q&A if they flow together.
  `,
  minDuration: 15,
  maxDuration: 60,
  targetCount: 10,
  keywords: ['advice', 'tip', 'secret', 'mistake', 'learned', 'expert', 'experience', 'journey', 'story', 'key'],
};
```

## Clip Planning

```typescript
// Interview-specific planning:
// 1. Keep question + answer together
// 2. Identify "money quotes" - standalone 10-15s soundbites
// 3. Group by topic/theme
// 4. Prioritize guest speaking time over host
```

## Subtitle Strategy

- **Speaker labels**: "Host:" / "Guest:" or names
- **Question styling**: Different color/style for questions
- **Highlight key terms**: Bold important concepts

## Metadata Strategy

```typescript
const interviewMetadata = {
  style: 'authority',
  category: 'education',
  hashtags: ['#interview', '#expertadvice', '#{guestField}', '#{topic}', '#learnfromthebest'],
  titleFormat: '{Guest Name}: "{Key Quote}"',
  descriptionFormat: '{Guest}, {title}, shares {topic}. Full interview: {link}',
};
```

## Platform Optimization

| Platform | Focus |
|----------|-------|
| TikTok | Most controversial/surprising answer |
| Reels | Educational value, expertise showcase |
| Shorts | Search-friendly, "How to {topic} with {Guest}" |

## Common Interview Patterns

| Pattern | Clip Strategy |
|---------|---------------|
| Origin story | Hook: "How I started" → journey → lesson |
| Framework/method | "The 3-step framework for..." |
| Contrarian take | "Everyone thinks X, but actually Y" |
| Rapid fire | Compilation of best 1-liners |
| Behind the scenes | "What nobody sees about..." |
| Failure story | "My biggest failure and what I learned" |