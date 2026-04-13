# MacroMate — Project Context

## What this is
AI-powered macro & calorie tracker. Single user (personal tool).
User describes meals in natural language (Bahasa/English) → Claude estimates calories + macros → logged to dashboard.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Supabase (Postgres, Auth, RLS)
- AI: Claude API (claude-sonnet) via Anthropic SDK
- Deploy: Netlify

## Project structure
- /src/components — all React components
- /src/lib/supabase.ts — all Supabase queries
- /src/lib/ai.ts — all Claude API calls
- /src/lib/nutrition.ts — TDEE & macro calculations
- /src/pages — page-level components
- /supabase/migrations — SQL migration files

## Key conventions
- Mobile-first responsive (primary device: iPhone)
- TypeScript strictly — no `any` types
- No console.log in production code
- Always handle loading + error states in UI
- All env vars via import.meta.env (Vite)

## Database tables
- profiles: user stats for TDEE calculation (gender, age, weight, height, activity_level)
- meal_logs: logged meals with AI breakdown and confirmed macros

## Business logic — TDEE & targets
- Formula: Mifflin-St Jeor (uses gender)
- Default deficit: -500 kcal (moderate cut)
- Macro split: ~40% protein / 35% carbs / 25% fat
- Fiber target: 25–38g/day

## Dashboard status logic
- "On Track" = deficit ≥ 500 kcal
- "Good Day" = deficit 200–499 kcal
- "Over Target" = deficit < 200 kcal (includes maintenance and surplus)

## AI meal estimation
- Model: claude-sonnet via Anthropic SDK
- Input: natural language description (Bahasa/English)
- Must handle: vague portions, Indonesian units (centong, piring), recipe-style + % eaten
- Output JSON: { food_name, portion_g, calories, protein_g, carbs_g, fat_g, fiber_g }
- User can correct description and re-estimate

## DO NOT
- Do not add features not in the plan
- Do not use `any` types in TypeScript
- Do not skip RLS policies on Supabase tables
- Do not hardcode API keys — always use env vars
- Do not create files outside the structure above without asking
- Do not install new dependencies without asking
