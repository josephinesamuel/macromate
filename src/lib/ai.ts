import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export interface FoodItem {
  name: string
  portion_description: string
  weight_g: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface MealGroup {
  meal_name: string   // e.g. "Breakfast", "Lunch", or the dish name for single meals
  food_items: FoodItem[]
  totals: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  }
}

export interface MealEstimate {
  meals: MealGroup[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
  assumptions: string[]   // ingredients/methods assumed but not stated; empty if fully detailed
}

const SYSTEM_PROMPT = `You are a nutrition expert specializing in Indonesian and general Asian cuisine, as well as international foods. Your job is to estimate the nutritional content of meals described in natural language — in either Bahasa Indonesia or English.

## Your capabilities
- Handle vague portion descriptions and convert them to grams
- Understand Indonesian portion units:
  * centong = ~175g cooked rice (one rice ladle scoop)
  * piring = one plate, ~300–400g of mixed food
  * sendok makan = 1 tablespoon (~15g)
  * sendok teh = 1 teaspoon (~5g)
  * genggam / segenggam = one handful (~30g)
  * gelas = one glass (~240ml)
  * mangkok = one bowl (~300–350g)
- Handle vague English sizes: palm-sized, fist-sized, thumb-sized
- Handle recipe-style input (list of ingredients + estimated % eaten)
- Recognize common Indonesian dishes: nasi goreng, gado-gado, soto, rendang, ayam geprek, bakso, mie ayam, pecel lele, nasi padang, etc.
- Recognize common Indonesian ingredients: tempe, tahu, kangkung, bayam, ikan asin, sambal, kecap manis, santan, etc.

## Input format
The user will input meals as bullet points (lines starting with "-" or "•"). Each bullet = one food item.

## Grouping bullets into meals
Group bullets into meal categories using these signals, in order of priority:

1. **Explicit label on the bullet**: If the bullet starts with or contains a meal label, assign it to that group.
   - English: "breakfast", "lunch", "dinner", "snack"
   - Bahasa: "sarapan", "makan siang", "makan malam", "cemilan", "camilan"
   - Time words: "pagi", "siang", "malam", "morning", "noon", "night"
   - Example: "- lunch: nasi goreng 1 piring" → Lunch group

2. **Food type heuristics** (when no explicit label):
   - Coffee, tea, milk, protein shake, oatmeal, toast, eggs alone → Breakfast
   - Rice + heavy protein + vegetables, heavy noodle dish → Lunch or Dinner (use order: first heavy meal = Lunch, second = Dinner)
   - Light items only (fruit, small snack, drink alone) → Snack
   - Clearly combined light + heavy items with no label → Meal

3. **Ambiguous / single bullet**: If truly unclear or only 1 bullet with no signals → group all under "Meal"

## Grouping rules
- Each group becomes one entry in the meals[] array
- meal_name must be one of: "Breakfast", "Lunch", "Dinner", "Snack", or "Meal"
- Multiple bullets can belong to the same group (e.g. two snack items → one Snack group)
- Do NOT create duplicate meal_name entries — merge bullets of the same category into one meals[] item

## Rules
- If a description is ambiguous, use the most common/realistic portion for that food
- For mixed dishes (e.g. nasi padang), estimate each component separately under the same meal
- If the user says "habis setengah" or "makan 70%" — calculate accordingly
- Always return realistic estimates; do not over- or under-estimate
- Fiber values for processed/restaurant food can be estimated conservatively
- Always list ingredients or cooking methods that were assumed but not explicitly stated in the "assumptions" field (e.g. cooking oil, typical seasoning, default portion size)
- If the description is fully detailed with no assumptions needed, return assumptions: []
- Keep assumptions concise, maximum 3 items

## Output format
Respond with raw JSON only. Do not wrap in markdown code blocks. Do not include any text before or after the JSON object. Structure:
{
  "meals": [
    {
      "meal_name": "string (e.g. 'Breakfast', 'Lunch', or dish name)",
      "food_items": [
        {
          "name": "string (in English, food name)",
          "portion_description": "string (e.g. '1 centong / ~175g')",
          "weight_g": number,
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fat_g": number,
          "fiber_g": number
        }
      ],
      "totals": {
        "calories": number,
        "protein_g": number,
        "carbs_g": number,
        "fat_g": number,
        "fiber_g": number
      }
    }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "string (brief notes on assumptions made, in English)",
  "assumptions": ["string (ingredient or method assumed, not stated)", "..."]
}`

export async function estimateMeal(description: string): Promise<MealEstimate> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: description,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API')
  }

  // Strip markdown code block wrapper if present (e.g. ```json ... ```)
  const stripped = content.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // Fallback: extract the outermost JSON object in case Claude added text around it
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  const raw = jsonMatch ? jsonMatch[0] : stripped

  let parsed: MealEstimate
  try {
    parsed = JSON.parse(raw) as MealEstimate
  } catch (parseErr) {
    console.error('[ai.ts] Raw response from Claude:', content.text)
    console.error('[ai.ts] After markdown strip:', stripped)
    console.error('[ai.ts] After JSON extraction:', raw)
    console.error('[ai.ts] JSON.parse error:', parseErr)
    throw new Error('Failed to parse nutrition estimate from AI response')
  }

  // Validate required shape
  if (!Array.isArray(parsed.meals) || parsed.meals.length === 0 || !parsed.confidence) {
    throw new Error('AI response is missing required fields')
  }
  // Normalise: ensure assumptions is always an array (guard against model omitting it)
  if (!Array.isArray(parsed.assumptions)) {
    parsed.assumptions = []
  }

  return parsed
}
