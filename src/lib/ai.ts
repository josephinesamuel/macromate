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

export interface MealEstimate {
  food_items: FoodItem[]
  totals: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  }
  confidence: 'high' | 'medium' | 'low'
  notes: string
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

## Rules
- If a description is ambiguous, use the most common/realistic portion for that food
- For mixed dishes (e.g. nasi padang), estimate each component separately
- If the user says "habis setengah" or "makan 70%" — calculate accordingly
- Always return realistic estimates; do not over- or under-estimate
- Fiber values for processed/restaurant food can be estimated conservatively

## Output format
Respond with ONLY a valid JSON object — no markdown, no explanation, no extra text. Structure:
{
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
  },
  "confidence": "high" | "medium" | "low",
  "notes": "string (brief notes on assumptions made, in English)"
}`

export async function estimateMeal(description: string): Promise<MealEstimate> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
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

  let parsed: MealEstimate
  try {
    parsed = JSON.parse(content.text) as MealEstimate
  } catch {
    throw new Error('Failed to parse nutrition estimate from AI response')
  }

  // Validate required shape
  if (!parsed.food_items || !parsed.totals || !parsed.confidence) {
    throw new Error('AI response is missing required fields')
  }

  return parsed
}
