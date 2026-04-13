export type Gender = 'male' | 'female'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export interface UserProfile {
  id: string
  gender: Gender
  age: number
  weight_kg: number
  height_cm: number
  activity_level: ActivityLevel
  created_at: string
  updated_at: string
}

export interface MacroTargets {
  tdee: number       // maintenance calories
  target: number     // tdee minus deficit
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const DEFICIT_KCAL = 500
const FIBER_TARGET_G = 30

// Mifflin-St Jeor BMR, then multiply by activity level
export function calculateTDEE(profile: Pick<UserProfile, 'gender' | 'age' | 'weight_kg' | 'height_cm' | 'activity_level'>): number {
  const { gender, age, weight_kg, height_cm, activity_level } = profile

  const bmr =
    gender === 'male'
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity_level])
}

// Apply deficit and split into macros
export function calculateMacroTargets(profile: Pick<UserProfile, 'gender' | 'age' | 'weight_kg' | 'height_cm' | 'activity_level'>): MacroTargets {
  const tdee = calculateTDEE(profile)
  const target = tdee - DEFICIT_KCAL

  // Calories per macro
  const proteinKcal = target * 0.40
  const carbsKcal = target * 0.35
  const fatKcal = target * 0.25

  // Convert to grams (protein & carbs = 4 kcal/g, fat = 9 kcal/g)
  return {
    tdee,
    target,
    protein_g: Math.round(proteinKcal / 4),
    carbs_g: Math.round(carbsKcal / 4),
    fat_g: Math.round(fatKcal / 9),
    fiber_g: FIBER_TARGET_G,
  }
}
