# AI Article Recommendation Framework

## Overview
This framework uses an AI agent to intelligently discover, evaluate, and recommend relevant articles for milestones that need support.

## Architecture

### Components

1. **Article Agent** (`lib/articles/article-agent.ts`)
   - AI-powered article discovery
   - Article validation and ranking
   - Caching mechanism
   - Fallback to static articles

2. **Static Articles** (`lib/articles/static-articles.ts`)
   - Curated baseline articles
   - Fallback when AI agent fails
   - Category-based organization

3. **Integration** (`lib/ai/combine-pages.ts`)
   - Attaches articles to storybook pages
   - Only for "needs support" milestones
   - Age and category matching

## How It Works

### 1. Article Discovery Flow

```
Milestone Needs Support
    ↓
Check Cache (24hr TTL)
    ↓
AI Agent Discovery
    ├─→ Success → Cache & Return
    └─→ Failure → Static Articles Fallback
```

### 2. AI Agent Process

1. **Context Building**: Gathers category, age, milestone description
2. **AI Prompting**: Uses specialized prompt for pediatric resources
3. **Article Discovery**: AI recommends CDC, AAP, and other authoritative sources
4. **Validation**: Validates URLs, checks age ranges, ranks by relevance
5. **Caching**: Stores results for 24 hours to reduce API calls

### 3. Article Ranking

Articles are ranked by:
- Relevance Score (0-100) - AI-assigned relevance
- Source Priority: CDC (3) > APP (2) > EXTERNAL (1)
- Age Appropriateness (if age specified)

## Configuration

### Environment Variables

```bash
# Enable/disable AI article agent (default: true)
USE_AI_ARTICLE_AGENT=true

# OpenAI model to use (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

### Cache Management

- Cache TTL: 24 hours
- Cache Key: `{category}_{ageMonths}_{milestoneDescription}`
- Manual clear: `clearArticleCache()`

## AI Agent Prompt Strategy

The agent uses:
- **System Prompt**: Establishes expertise in pediatric resources
- **User Prompt**: Provides specific context (category, age, milestone)
- **Temperature**: 0.2 (low for factual, consistent results)
- **Max Tokens**: 1500 (enough for 3-5 article recommendations)

## Quality Assurance

### Validation Steps

1. **URL Format**: Validates URL structure
2. **Source Verification**: Checks source type (CDC, APP, EXTERNAL)
3. **Age Range**: Filters by age if specified
4. **Relevance Scoring**: AI assigns relevance score
5. **Deduplication**: Removes duplicate URLs

### Fallback Strategy

1. Try AI agent discovery
2. If fails → Use static articles
3. If static empty → Return empty array (graceful degradation)

## Performance Considerations

- **Caching**: 24-hour cache reduces API calls
- **Async Processing**: Non-blocking article discovery
- **Error Handling**: Graceful fallbacks prevent failures
- **Rate Limiting**: Cache prevents excessive API calls

## Future Enhancements

1. **Web Search Integration**: Use web search APIs for real-time discovery
2. **Article Quality Scoring**: ML-based quality assessment
3. **User Feedback Loop**: Track which articles parents find helpful
4. **Personalization**: Learn from user preferences
5. **Multi-language Support**: Articles in multiple languages
6. **Video Resources**: Include video links alongside articles

## Testing

To test the article agent:

```typescript
import { getHybridArticleRecommendations } from '@/lib/articles/article-agent'

const articles = await getHybridArticleRecommendations({
  category: 'Motor',
  ageMonths: 6,
  milestoneDescription: 'Sitting without support',
  status: 'missed',
}, 3)

console.log('Recommended articles:', articles)
```

## Monitoring

Key metrics to track:
- AI agent success rate
- Cache hit rate
- Average articles per page
- Article click-through rates
- Fallback usage frequency

