# Highlight Scoring Algorithm

Detailed breakdown of the viral potential scoring system for highlight detection.

## Scoring Factors & Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Hook Strength | 25% | Engagement in first 3 seconds |
| Information Value | 20% | Unique, actionable, educational content |
| Emotional Impact | 15% | Triggers emotional response |
| Context Completeness | 15% | Self-contained, understandable alone |
| Storytelling | 15% | Narrative arc quality |
| Audio/Visual Quality | 10% | Production quality indicators |

## Factor Details

### 1. Hook Strength (25%)

**Indicators:**
- Question opening: "Why...", "How...", "What if..."
- Provocative statement: "Stop doing X", "Nobody tells you..."
- Numbered list: "3 reasons why...", "Top 5..."
- Secret/reveal: "The secret to...", "Hidden truth..."
- Direct address: "You won't believe...", "If you..."

**Scoring:**
- Strong hook (multiple indicators): 0.9-1.0
- Moderate hook (1-2 indicators): 0.6-0.8
- Weak hook (generic opening): 0.3-0.5
- No hook: 0.1-0.2

### 2. Information Value (20%)

**Indicators:**
- Actionable advice: "Do this...", "Step 1..."
- Unique insight: "What most people miss..."
- Data/evidence: "Studies show...", "Data reveals..."
- Expert authority: "As a [credential]..."
- Counterintuitive: "Contrary to popular belief..."

**Scoring:**
- High value (expert, unique, actionable): 0.8-1.0
- Medium value (useful but common): 0.5-0.7
- Low value (opinion, filler): 0.2-0.4
- No value (tangent, repetition): 0.1

### 3. Emotional Impact (15%)

**Emotion Categories & Keywords:**

| Emotion | Keywords | Weight |
|---------|----------|--------|
| Awe/Wonder | amazing, incredible, mind-blowing, unbelievable | +0.15 |
| Joy/Humor | funny, hilarious, laughing, joy, happy | +0.10 |
| Surprise | shocking, unexpected, twist, reveal, never knew | +0.15 |
| Fear/Urgency | warning, danger, avoid, never, stop, critical | +0.10 |
| Inspiration | inspiring, motivated, changed my life, possible | +0.15 |
| Relatability | same, me too, relatable, exactly, literally me | +0.10 |
| Anger/Outrage | unacceptable, wrong, ridiculous, can't believe | +0.05 |
| Sadness/Empathy | heartbreaking, touching, emotional, tears | +0.10 |

**Multi-emotion bonus:** +0.05 per additional emotion type (max +0.15)

### 4. Context Completeness (15%)

**Criteria:**
- Self-contained narrative: 0.9-1.0
- Minor context needed (1-2 sentences): 0.7-0.8
- Moderate context needed: 0.5-0.6
- Heavily dependent on prior content: 0.2-0.4
- Incomplete thought: 0.1

**Checks:**
- Has clear beginning, middle, end
- References resolved (no "as I said earlier")
- Technical terms explained or obvious
- Visual context not required (or subtitles cover it)

### 5. Storytelling (15%)

**Structure Elements:**
- Setup → Conflict → Resolution: +0.3
- Character arc: +0.2
- Tension/release: +0.2
- Callback/foreshadowing: +0.1
- Clear stakes: +0.1
- Pacing appropriate: +0.1

**Anti-patterns (penalties):**
- Rambling: -0.2
- Abrupt ending: -0.2
- No clear point: -0.3
- Repetitive: -0.1

### 6. Audio/Visual Quality (10%)

**Indicators:**
- Clear audio (high confidence transcription): +0.3
- Visual variety (scene changes, B-roll): +0.2
- Good lighting/production: +0.2
- Engaging visuals (not just talking head): +0.2
- Background music/sound design: +0.1

## Composite Score Calculation

```typescript
function calculateHighlightScore(factors: FactorScores): number {
  const weights = {
    hook: 0.25,
    information: 0.20,
    emotion: 0.15,
    context: 0.15,
    storytelling: 0.15,
    quality: 0.10,
  };
  
  return (
    factors.hook * weights.hook +
    factors.information * weights.information +
    factors.emotion * weights.emotion +
    factors.context * weights.context +
    factors.storytelling * weights.storytelling +
    factors.quality * weights.quality
  );
}
```

## Score Interpretation

| Score Range | Label | Action |
|-------------|-------|--------|
| 0.85-1.00 | Viral Gold | Prioritize, minimal editing |
| 0.70-0.84 | Strong | Include, light polish |
| 0.55-0.69 | Good | Include, standard editing |
| 0.40-0.54 | Marginal | Include if quota needed |
| 0.25-0.39 | Weak | Skip unless requested |
| 0.00-0.24 | Reject | Don't use |

## Platform Adjustments

| Platform | Hook Weight | Info Weight | Emotion Weight |
|----------|-------------|-------------|----------------|
| TikTok | 0.30 | 0.15 | 0.20 |
| Reels | 0.25 | 0.20 | 0.15 |
| Shorts | 0.25 | 0.25 | 0.10 |

## Content-Type Adjustments

| Type | Hook | Info | Emotion | Context | Story | Quality |
|------|------|------|---------|---------|-------|---------|
| Podcast | 0.20 | 0.30 | 0.15 | 0.15 | 0.15 | 0.05 |
| Interview | 0.25 | 0.25 | 0.10 | 0.15 | 0.15 | 0.10 |
| Educational | 0.20 | 0.35 | 0.05 | 0.20 | 0.10 | 0.10 |
| Storytelling | 0.20 | 0.10 | 0.25 | 0.10 | 0.30 | 0.05 |
| Gaming | 0.30 | 0.10 | 0.20 | 0.10 | 0.15 | 0.15 |
| Entertainment | 0.35 | 0.05 | 0.25 | 0.10 | 0.15 | 0.10 |

## Heuristic Fallback Scoring

When AI unavailable, uses keyword-based approximation:

```typescript
function heuristicScore(segment: TranscriptionSegment): number {
  let score = 0.3; // base
  
  const text = segment.text.toLowerCase();
  
  // Hook patterns
  if (/^(how|why|what|when|where|who)/.test(text)) score += 0.15;
  if (/^(stop|don't|never|always)/.test(text)) score += 0.15;
  if (/\?$/.test(text)) score += 0.1;
  if (/^\d+ (things|ways|tips|reasons|secrets)/.test(text)) score += 0.2;
  
  // Engagement keywords
  const engagementWords = ['amazing', 'incredible', 'secret', 'mistake', 'never', 'always', 'best', 'worst', 'shocking', 'unbelievable'];
  for (const word of engagementWords) {
    if (text.includes(word)) score += 0.05;
  }
  
  // Confidence boost
  score *= segment.confidence;
  
  return Math.min(1, score);
}
```

## Calibration Notes

- Scores are relative, not absolute probabilities
- Calibrate per niche/audience over time
- Track actual performance vs predicted
- Adjust weights based on platform algorithm changes
- Consider A/B testing different weight configurations