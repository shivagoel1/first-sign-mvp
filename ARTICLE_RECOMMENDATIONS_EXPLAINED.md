# Article Recommendations - How They Work

## Your Questions Answered

### 1. Will articles be relevant to what the child needs help with?

**YES!** The system uses multiple layers of context to ensure articles are highly relevant:

#### Context Used for Article Matching:

1. **Category** (Motor, Language/Communication, Social-Emotional, Cognitive)
   - Primary matching factor
   - Ensures articles match the developmental area needing support

2. **Child's Age** (in months)
   - Filters articles by age appropriateness
   - Example: A 6-month-old gets articles for 3-9 month range

3. **Specific Milestone Descriptions**
   - Uses the actual milestone text (e.g., "Sitting without support", "Babbling sounds")
   - Includes narrative text from verified milestones
   - Includes concern narratives when available
   - This ensures articles match the **exact** skill the child needs help with

4. **AI Relevance Scoring** (0-100)
   - AI agent evaluates each article's relevance
   - Higher scores = better match to the child's specific needs

#### Example:
If a child needs help with "Sitting without support" in Motor development at 6 months:
- **Category**: Motor
- **Age**: 6 months
- **Milestone Description**: "Sitting without support. Developing core strength and balance."
- **AI finds**: CDC articles about motor milestones, sitting development, and age-appropriate exercises

**Result**: Articles are highly specific to the child's actual needs, not generic.

---

### 2. Will articles be shown to physicians for authenticity?

**YES!** Articles appear in **both** parent and physician views:

#### Where Articles Are Shown:

1. **Parent Storybook Viewer** (Web)
   - Articles appear on "needs support" pages
   - Clickable links to CDC and other resources
   - Visible when parent views the storybook

2. **Parent PDF**
   - Articles included in the downloadable PDF
   - Full URLs and descriptions
   - Professional formatting

3. **Physician PDF** ✅
   - **Same articles appear in physician PDF**
   - Physicians can see exactly what resources parents are being directed to
   - This ensures transparency and allows physicians to:
     - Verify article quality and appropriateness
     - Understand what guidance parents are receiving
     - Provide additional context if needed

4. **Physician Dashboard** (Future Enhancement)
   - Currently, physicians view via PDF
   - Could add web viewer with articles in future

#### Why This Matters:

- **Transparency**: Physicians see what parents see
- **Quality Control**: Physicians can verify article appropriateness
- **Consistency**: Same evidence-based resources for everyone
- **Trust**: Parents know physicians have reviewed the resources

---

## How Article Ranking Works

Articles are ranked by multiple factors to ensure the best recommendations:

### Ranking Factors (in order):

1. **Relevance Score** (0-100)
   - AI-assigned score based on how well the article matches:
     - The specific milestone
     - The child's age
     - The developmental concern
   - Higher = better match

2. **Source Priority**
   - CDC (priority 3) - Highest priority, most authoritative
   - APP (priority 2) - Your app's curated content
   - EXTERNAL (priority 1) - Other reputable sources
   - CDC articles are always preferred when available

3. **Age Appropriateness**
   - Articles filtered by child's age range
   - Only age-relevant articles shown

4. **Final Ranking Formula**:
   ```
   Final Score = Relevance Score + (Source Priority × 10)
   ```
   - Example: CDC article with 85 relevance = 85 + (3 × 10) = 115
   - Example: APP article with 90 relevance = 90 + (2 × 10) = 110
   - CDC wins even with slightly lower relevance

---

## Article Sources & Quality

### Primary Sources:

1. **CDC (Centers for Disease Control)**
   - "Learn the Signs. Act Early." materials
   - Official milestone guides
   - Evidence-based developmental resources
   - Most authoritative source

2. **American Academy of Pediatrics (AAP)**
   - healthychildren.org resources
   - Professional medical guidance
   - Age-appropriate recommendations

3. **App-Curated Content**
   - Your own articles (when available)
   - Branded content
   - Customized guidance

4. **Other Reputable Sources**
   - Evidence-based developmental resources
   - Trusted medical organizations

### Quality Assurance:

- ✅ All articles are from authoritative sources
- ✅ AI validates URLs before recommending
- ✅ Age-appropriate filtering
- ✅ Relevance scoring ensures specificity
- ✅ Physicians can review in PDF

---

## Example: Real-World Scenario

**Child**: 8 months old, needs support with Language/Communication

**Milestone**: "Responding to name" - not yet achieved

**System Process**:
1. Identifies category: Language/Communication
2. Uses age: 8 months
3. Uses milestone: "Responding to name" + concern narrative
4. AI finds articles:
   - CDC: "Communication Milestones - 6-12 months" (Relevance: 95)
   - CDC: "Act Early - Language Development" (Relevance: 90)
   - AAP: "Helping Your Baby Respond to Name" (Relevance: 88)

**Result**: 
- Top 3 articles shown (ranked by relevance + source priority)
- All are age-appropriate (6-12 months)
- All are specific to the exact concern
- All are from authoritative sources
- **Physician sees same articles in PDF**

---

## Summary

✅ **Articles ARE highly relevant** - Uses specific milestone descriptions, age, and concern narratives

✅ **Articles ARE shown to physicians** - Appear in physician PDF for transparency and quality control

✅ **Articles ARE from authoritative sources** - CDC, AAP, and evidence-based resources

✅ **Articles ARE ranked intelligently** - Relevance + source priority + age appropriateness

This ensures parents get the most relevant, evidence-based resources, and physicians can verify the quality and appropriateness of what parents are seeing.

