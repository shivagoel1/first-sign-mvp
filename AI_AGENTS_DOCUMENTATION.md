# AI Agents Documentation
## Complete Guide to All Agents in FirstSignFirst

---

## Overview

FirstSignFirst uses **4 AI Agents** powered by OpenAI GPT-4o-mini to generate personalized developmental storybooks. Each agent has a specific role in the storybook generation pipeline.

---

## Agent Summary Table

| Agent | Location | Status | Purpose | Model | Temperature |
|-------|----------|--------|---------|-------|-------------|
| **Storybook Agent** | `lib/ai/storybook-helpers.ts` | ✅ **Always Active** | Generates storybook narratives | GPT-4o-mini | 0.8 |
| **Validation Agent** | `lib/ai/storybook-helpers.ts` | ✅ **Active** (can skip) | Validates storybook quality | GPT-4o-mini | 0.4 |
| **Selector Agent** | `lib/ai/agents.ts` | ⚙️ **Optional** | Selects important milestones | GPT-4o-mini | 0.3 |
| **Polish Agent** | `lib/ai/agents.ts` | ⚙️ **Optional** | Refines page content | GPT-4o-mini | 0.4 |

---

## Agent 1: Storybook Agent ⭐ (Primary Agent)

### Location
- **File**: `lib/ai/storybook-helpers.ts`
- **Function**: `callStorybookAgent(verified: VerifiedMilestone[])`

### Purpose
**Main content generation agent** - Creates the core storybook narrative from milestone data.

### What It Does
1. Takes verified milestones (with met/missed status)
2. Generates JSON storybook structure with:
   - Page numbers
   - Display text (milestone headings)
   - Narrative text (2-3 supportive sentences)
   - Visual flags (red flag descriptions)
   - Illustration prompts (for image generation)
   - Status (met/missed)

### Key Responsibilities
- **Selects appropriate CDC narratives** based on milestone status
  - If `status === 'met'` → Uses `celebration_narrative`
  - If `status === 'missed'` → Uses `concern_narrative` + `parental_encouragement`
- **Ensures unique content** for each page (no duplicates)
- **Generates illustration prompts** from `storybook_scene_description`
- **Maintains supportive tone** (parent-friendly, non-alarming)

### Configuration
```typescript
Model: GPT-4o-mini
Temperature: 0.8 (higher for creativity and uniqueness)
Response Format: JSON Object
Max Tokens: Default (no limit specified)
```

### Input
```typescript
VerifiedMilestone[] = [
  {
    milestone_code: "SOC-6M-001",
    category: "Social-Emotional",
    age_months: 6,
    status: "met" | "missed",
    celebration_narrative: "Great job! Your child is...",
    concern_narrative: "It's okay if your child hasn't...",
    parental_encouragement: "You can help by...",
    storybook_scene_description: "A happy child playing...",
    red_flag_icon: null | "warning-icon"
  },
  // ... more milestones
]
```

### Output
```typescript
{
  completion: ChatCompletion,  // Full OpenAI response (for cost tracking)
  storybook: {
    pages: [
      {
        page_number: 1,
        milestone_code: "SOC-6M-001",
        display_text: "Social Smiles",
        narrative_text: "Your child is showing wonderful social development...",
        visual_flag: "",
        illustration_prompts: ["A happy baby smiling at their parent..."],
        status: "met"
      },
      // ... more pages
    ]
  }
}
```

### When It Runs
- **Always runs** (required for storybook generation)
- Runs after milestone verification
- Progress: 20% → 40%

### Cost
- **Most expensive agent** (generates most content)
- Cost calculated from token usage
- Typical: ~$0.05 - $0.20 per assessment

### Example Prompt (Simplified)
```
You are a pediatric developmental storyteller AI. Generate a JSON storybook.

For each milestone:
- Use celebration_narrative if status is "met"
- Use concern_narrative + parental_encouragement if status is "missed"
- Create unique narrative_text (2-3 sentences)
- Generate illustration_prompts from storybook_scene_description
- Ensure each page is unique and specific

Return JSON: { "pages": [...] }
```

---

## Agent 2: Validation Agent ✅

### Location
- **File**: `lib/ai/storybook-helpers.ts`
- **Function**: `callValidationAgent(storybookJson, milestones)`

### Purpose
**Quality assurance agent** - Reviews and validates the generated storybook for accuracy and tone.

### What It Does
1. Reviews the draft storybook from Storybook Agent
2. Validates:
   - Tone is supportive and parent-friendly
   - Statements align with milestone status
   - Red flags are present when needed
   - Illustration prompts are relevant
3. Returns approved/not approved with issues list
4. Can correct the storybook if issues found

### Key Responsibilities
- **Quality Control**: Ensures storybook meets standards
- **Accuracy Check**: Verifies narratives match milestone status
- **Tone Validation**: Confirms supportive, non-alarming language
- **Completeness Check**: Ensures all required elements present

### Configuration
```typescript
Model: GPT-4o-mini
Temperature: 0.4 (lower for consistency)
Response Format: JSON Object
Max Tokens: Default
```

### Input
```typescript
{
  storybook: {
    pages: [...]  // Draft storybook from Storybook Agent
  },
  milestones: VerifiedMilestone[]  // Original milestone data
}
```

### Output
```typescript
{
  completion: ChatCompletion,
  approved: boolean,  // true if storybook is good
  issues: string[],  // List of issues found (if any)
  storybook: {
    pages: [...]  // Corrected storybook (if issues found)
  }
}
```

### When It Runs
- **Runs by default** (can be skipped with env flag)
- Runs after Storybook Agent
- Progress: 40% → 50%
- **Can be disabled**: Set `SKIP_AI_VALIDATION=true`

### Cost
- **Moderate cost** (reviewing content)
- Typical: ~$0.02 - $0.10 per assessment

### Example Prompt (Simplified)
```
You are an editorial validation AI for pediatric narratives.

Review the storybook to ensure:
- Tone is supportive and parent-friendly
- Statements align with milestone status
- Red flags are present when status is "missed"
- Illustration prompts are relevant

Return JSON: {
  "approved": true|false,
  "issues": ["..."],
  "storybook": { "pages": [...] }
}
```

---

## Agent 3: Selector Agent ⚙️ (Optional)

### Location
- **File**: `lib/ai/agents.ts`
- **Function**: `callSelectorAgent(verified, options?)`

### Purpose
**Milestone prioritization agent** - Selects the most important milestones to include in the storybook when there are too many.

### What It Does
1. Takes all verified milestones
2. Analyzes importance based on:
   - Status (missed milestones prioritized)
   - Red flags (red flag items prioritized)
   - Category coverage (ensures all categories represented)
3. Returns a filtered set of milestone codes
4. Limits total to `maxSelected` (default: 20)

### Key Responsibilities
- **Prioritization**: Selects most important milestones
- **Category Balance**: Ensures all 4 categories represented
- **Red Flag Focus**: Prioritizes missed/red-flag milestones
- **Size Control**: Limits total milestones to manageable number

### Configuration
```typescript
Model: GPT-4o-mini
Temperature: 0.3 (very low for consistency)
Response Format: JSON Object
Max Tokens: 200 (small response)
Options: {
  maxSelected: 20 (default, configurable via env)
  prioritize: 'missed-first' | 'balanced'
}
```

### Input
```typescript
VerifiedMilestone[] = [
  {
    milestone_code: "SOC-6M-001",
    category: "Social-Emotional",
    status: "missed",
    red_flag_icon: "warning-icon",
    // ... other fields
  },
  // ... potentially 50+ milestones
]
```

### Output
```typescript
Set<string> = new Set([
  "SOC-6M-001",
  "LANG-9M-002",
  "MOT-12M-005",
  // ... up to maxSelected milestone codes
])
```

### When It Runs
- **Optional** - Only if `USE_SELECTOR_AGENT=true`
- Runs before Storybook Agent
- **Purpose**: Reduces processing time and cost by filtering milestones
- Progress: 20% (runs early)

### Cost
- **Low cost** (small prompt, small response)
- Typical: ~$0.01 - $0.02 per assessment
- **Saves money** by reducing milestones processed by Storybook Agent

### Example Prompt (Simplified)
```
Choose the most important milestones to visualize.

Instructions:
- Prefer missed/red-flag items
- Ensure category coverage (all 4 categories)
- Limit total to maxSelected (20)

Return JSON: { "selected": ["milestone_code1", ...] }
```

### Configuration Options
```env
# Enable selector agent
USE_SELECTOR_AGENT=true

# Maximum milestones to select
SELECTOR_MAX_ITEMS=20

# Prioritization strategy
COMBINE_PRIORITIZE=missed-first  # or 'balanced'
```

---

## Agent 4: Polish Agent ⚙️ (Optional)

### Location
- **File**: `lib/ai/agents.ts`
- **Function**: `callPolishCombinedPage(page)`

### Purpose
**Content refinement agent** - Refines individual page captions and illustration prompts after pages are combined.

### What It Does
1. Takes a combined page (may have multiple milestones)
2. Refines:
   - `narrative_text` (caption) - improves flow and clarity
   - `illustration_prompts` - enhances visual descriptions
3. Maintains CDC narrative style
4. Ensures illustration prompts explicitly state "NO text in image"
5. Runs **per page** (parallel processing)

### Key Responsibilities
- **Content Refinement**: Improves narrative flow
- **Style Consistency**: Maintains CDC narrative tone
- **Visual Enhancement**: Better illustration prompts
- **Quality Polish**: Final touch before image generation

### Configuration
```typescript
Model: GPT-4o-mini
Temperature: 0.4 (moderate for creativity with consistency)
Response Format: JSON Object
Max Tokens: 180 (small, focused response)
```

### Input
```typescript
{
  category: "Social-Emotional",
  status: "missed",
  items: [
    {
      display_text: "Social Smiles",
      narrative: "It's okay if your child...",
      visual_flag: "Red flag: Not smiling socially"
    }
  ],
  display_text: "Social Development",
  narrative_text: "Your child's social development..."
}
```

### Output
```typescript
{
  caption?: string,  // Refined narrative_text
  illustration_prompt?: string  // Enhanced illustration prompt
}
```

### When It Runs
- **Optional** - Only if `USE_POLISH_AGENT=true`
- Runs after pages are combined
- Runs **in parallel** for all pages (Promise.allSettled)
- Progress: ~60-70%

### Cost
- **Moderate cost** (runs per page)
- Typical: ~$0.01 - $0.05 per page
- If 10 pages: ~$0.10 - $0.50 per assessment

### Example Prompt (Simplified)
```
Refine the page caption and illustration prompt.

Requirements:
- Preserve CDC narrative style
- Maintain supportive, parent-friendly tone
- Illustration prompt must state: "NO text, words, letters in image"
- Caption: 1-2 sentences

Return JSON: {
  "caption": "...",
  "illustration_prompt": "..."
}
```

### Configuration
```env
# Enable polish agent
USE_POLISH_AGENT=true
```

---

## Agent Execution Flow

### Complete Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Get Verified Milestones                                  │
│    - Fetches assessment responses                           │
│    - Converts to met/missed status                          │
│    Progress: 20%                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SELECTOR AGENT (Optional)                                │
│    Condition: USE_SELECTOR_AGENT === 'true'                 │
│    - Filters milestones to most important                   │
│    - Reduces from 50+ to ~20                                │
│    Cost: ~$0.01-0.02                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. STORYBOOK AGENT (Required) ⭐                            │
│    - Generates storybook narratives                         │
│    - Creates illustration prompts                           │
│    Progress: 40%                                             │
│    Cost: ~$0.05-0.20 (most expensive)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDATION AGENT (Default) ✅                            │
│    Condition: SKIP_AI_VALIDATION !== 'true'                 │
│    - Reviews storybook quality                              │
│    - Validates tone and accuracy                            │
│    Progress: 50%                                             │
│    Cost: ~$0.02-0.10                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Combine Pages                                             │
│    - Groups related milestones                              │
│    - Combines narratives                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. POLISH AGENT (Optional) ⚙️                               │
│    Condition: USE_POLISH_AGENT === 'true'                  │
│    - Refines each page (parallel)                          │
│    - Improves captions and prompts                           │
│    Progress: ~60-70%                                         │
│    Cost: ~$0.10-0.50 (per assessment)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Generate Images (DALL-E 3)                               │
│    - Not an agent, but AI-powered                           │
│    Progress: 75%                                             │
│    Cost: $0.04 per image                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Generate PDFs                                             │
│    Progress: 90%                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Update Database                                           │
│    Progress: 100%                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Usage in Code

### Where Agents Are Called

**File**: `app/api/ai/process/route.ts`

```typescript
// Step 1: Get verified milestones
const verified = await getVerifiedMilestones(assessmentId, seed)

// Step 2: Optional - Selector Agent
if (process.env.USE_SELECTOR_AGENT === 'true') {
  const selected = await callSelectorAgent(verified)
  filteredVerified = verified.filter(v => selected.has(v.milestone_code))
}

// Step 3: Storybook Agent (Required)
const storybookResult = await callStorybookAgent(verified)
const draftStorybook = storybookResult.storybook

// Step 4: Validation Agent (Default)
if (process.env.SKIP_AI_VALIDATION !== 'true') {
  validationResult = await callValidationAgent(draftStorybook, verified)
  validatedStorybook = validationResult.storybook
}

// Step 5: Combine pages
let combinedPages = combinePages(pagesForCombine, undefined, verified)

// Step 6: Optional - Polish Agent
if (process.env.USE_POLISH_AGENT === 'true') {
  const results = await Promise.allSettled(
    combinedPages.map(page => callPolishCombinedPage(page))
  )
  // Update pages with polished content
}
```

---

## Cost Breakdown

### Typical Assessment (All Agents Enabled)

| Agent | Cost Range | Notes |
|-------|------------|-------|
| Selector Agent | $0.01 - $0.02 | Optional, saves money overall |
| Storybook Agent | $0.05 - $0.20 | **Most expensive** |
| Validation Agent | $0.02 - $0.10 | Quality assurance |
| Polish Agent | $0.10 - $0.50 | Per page, optional |
| **Total Agents** | **$0.18 - $0.82** | |
| DALL-E Images | $0.04 per image | ~10 images = $0.40 |
| **Grand Total** | **$0.58 - $1.22** | Per assessment |

### Cost Optimization

**Minimal Configuration** (Only required agents):
- Storybook Agent: $0.05 - $0.20
- Validation Agent: $0.02 - $0.10
- **Total: $0.07 - $0.30**

**Full Configuration** (All agents):
- All 4 agents: $0.18 - $0.82
- **Total: $0.18 - $0.82**

---

## Environment Variables

### Agent Configuration

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Default model for all agents

# Selector Agent
USE_SELECTOR_AGENT=false  # Enable milestone selection
SELECTOR_MAX_ITEMS=20     # Maximum milestones to select
COMBINE_PRIORITIZE=missed-first  # or 'balanced'

# Validation Agent
SKIP_AI_VALIDATION=false  # Set to 'true' to skip validation

# Polish Agent
USE_POLISH_AGENT=false    # Enable page refinement

# Processing
AI_PROCESSING_TIMEOUT_MS=300000  # 5 minutes timeout
```

---

## Agent Characteristics

### Temperature Settings

| Agent | Temperature | Why |
|-------|-------------|-----|
| Storybook Agent | 0.8 | High creativity for unique narratives |
| Validation Agent | 0.4 | Lower for consistent validation |
| Selector Agent | 0.3 | Very low for consistent selection |
| Polish Agent | 0.4 | Moderate for refinement |

### Response Formats

All agents use **JSON Object** format:
- Ensures structured, parseable output
- Reduces parsing errors
- Makes integration easier

### Error Handling

All agents have try-catch blocks:
- **Selector Agent**: Returns empty Set on error (continues with all milestones)
- **Polish Agent**: Returns null on error (skips that page)
- **Storybook Agent**: Throws error (stops processing)
- **Validation Agent**: Throws error (stops processing)

---

## Agent Roles Summary

### 1. Storybook Agent = **Content Creator**
- Generates the actual storybook content
- Most important agent
- Always required

### 2. Validation Agent = **Quality Assurance**
- Reviews and validates content
- Ensures accuracy and tone
- Can be skipped for speed

### 3. Selector Agent = **Content Filter**
- Reduces milestone count
- Prioritizes important items
- Optional optimization

### 4. Polish Agent = **Content Refiner**
- Improves final content
- Enhances quality
- Optional enhancement

---

## Best Practices

### When to Use Each Agent

**Always Use**:
- ✅ Storybook Agent (required)
- ✅ Validation Agent (recommended for quality)

**Use Selector Agent When**:
- You have 30+ milestones per assessment
- You want to reduce costs
- You want faster processing

**Use Polish Agent When**:
- You want highest quality output
- You have budget for extra refinement
- Combined pages need better flow

### Performance Tips

1. **Selector Agent**: Use when assessments have many milestones (saves money)
2. **Validation Agent**: Keep enabled (catches errors early)
3. **Polish Agent**: Use for premium quality (adds cost)
4. **Parallel Processing**: Polish agent runs in parallel (efficient)

---

## Future Enhancements

Potential new agents:
- **Risk Scoring Agent**: Analyze risk levels (could be ML model)
- **Recommendation Agent**: Suggest interventions
- **Translation Agent**: Multi-language support
- **Accessibility Agent**: Generate accessible versions

---

*This documentation covers all 4 AI agents currently implemented in FirstSignFirst.*

