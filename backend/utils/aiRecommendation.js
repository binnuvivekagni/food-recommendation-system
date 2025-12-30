import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

// Helper to convert raw messages to LangChain format
const convertToLangChainMessages = (messages) => {
  return messages.map((msg) => {
    if (msg. role === "system") return new SystemMessage(msg.content);
    if (msg.role === "user") return new HumanMessage(msg.content);
    if (msg.role === "assistant") return new AIMessage(msg. content);
    return new HumanMessage(msg.content);
  });
};

// Define the schema for food recommendations
const foodRecommendationSchema = z.object({
  foods: z.array(
    z.object({
      "1": z.string().optional(),
      "2": z.string().optional(),
      "3": z.string().optional(),
      extra: z.string().optional(),
      reason: z.string(),
    })
  ),
});

// Define the schema for nutrition data - MORE LENIENT
const nutritionSchema = z.record(
  z.object({
    calories: z.number().optional(),
    protein_g: z.number().optional(),
    carbohydrates_g: z.number().optional(),
    fat_g: z.number().optional(),
    fiber_g: z.number().optional(),
    key_vitamins_minerals: z.string().optional(),
    health_benefits: z.string().optional(),
  }).passthrough() // Allow extra fields
);

// Fallback nutrition database for common Indian dishes
const fallbackNutritionDatabase = {
  "chana masala": {
    calories: 350,
    protein_g: 20,
    carbohydrates_g: 40,
    fat_g: 15,
    fiber_g: 8,
    key_vitamins_minerals: "Folate, Vitamin K",
    health_benefits: "Supports heart health, rich in antioxidants",
  },
  "tandoori chicken": {
    calories:  320,
    protein_g: 35,
    carbohydrates_g: 0,
    fat_g: 18,
    fiber_g: 0,
    key_vitamins_minerals: "Vitamin B6, Phosphorus",
    health_benefits:  "Rich in protein, supports bone health",
  },
  "basmati rice with mixed sprouts": {
    calories: 250,
    protein_g: 10,
    carbohydrates_g: 45,
    fat_g: 4,
    fiber_g:  6,
    key_vitamins_minerals: "Folate, Manganese",
    health_benefits: "Supports digestive health, rich in antioxidants",
  },
  "mango lassi": {
    calories: 150,
    protein_g: 5,
    carbohydrates_g: 30,
    fat_g: 7,
    fiber_g:  0,
    key_vitamins_minerals: "Vitamin A, Calcium",
    health_benefits: "Supports bone health, rich in probiotics",
  },
  "chicken biryani": {
    calories:  450,
    protein_g: 28,
    carbohydrates_g: 52,
    fat_g: 12,
    fiber_g: 2,
    key_vitamins_minerals: "Iron, Vitamin B, Phosphorus",
    health_benefits:  "Good source of protein and energy, aids digestion with spices",
  },
  "dal makhani": {
    calories:  320,
    protein_g: 14,
    carbohydrates_g: 35,
    fat_g: 14,
    fiber_g: 8,
    key_vitamins_minerals: "Iron, Folate, Magnesium",
    health_benefits: "High in fiber and plant-based protein, helps regulate blood sugar",
  },
  "rajma chawal": {
    calories: 380,
    protein_g:  16,
    carbohydrates_g: 58,
    fat_g: 5,
    fiber_g: 9,
    key_vitamins_minerals: "Iron, Zinc, Manganese",
    health_benefits:  "Rich in fiber and protein, supports digestive health and satiety",
  },
  "paneer tikka":  {
    calories: 280,
    protein_g: 22,
    carbohydrates_g: 8,
    fat_g: 18,
    fiber_g: 1,
    key_vitamins_minerals: "Calcium, Vitamin A, Phosphorus",
    health_benefits:  "Excellent source of calcium and protein, supports bone health",
  },
  "butter chicken": {
    calories: 420,
    protein_g: 32,
    carbohydrates_g: 12,
    fat_g: 28,
    fiber_g: 1,
    key_vitamins_minerals: "Iron, Vitamin B12, Selenium",
    health_benefits: "Rich in protein and essential amino acids",
  },
  "chole bhature": {
    calories: 550,
    protein_g: 18,
    carbohydrates_g: 72,
    fat_g: 18,
    fiber_g: 10,
    key_vitamins_minerals: "Iron, Manganese, Folate",
    health_benefits:  "Good source of plant protein and fiber",
  },
  "aloo gobi": {
    calories: 180,
    protein_g: 6,
    carbohydrates_g: 28,
    fat_g: 6,
    fiber_g: 4,
    key_vitamins_minerals: "Vitamin C, Potassium, Vitamin K",
    health_benefits:  "Low calorie, rich in antioxidants and fiber",
  },
};

// Utils
const stripCodeFences = (text) => {
  if (!text) return text;
  const codeBlockRegex = /```(?:json)?\n?([\s\S]*?)```/g;
  let match;
  const parts = [];
  while ((match = codeBlockRegex.exec(text)) !== null) {
    parts.push(match[1]. trim());
  }
  if (parts.length > 0) {
    return parts.join("\n").trim();
  }
  return text. replace(/```/g, "").trim();
};

// Normalize food name for lookup in database
const normalizeFoodName = (name) => {
  return name.toLowerCase().trim();
};

// Find matching nutrition data from fallback database
const findNutritionFromFallback = (foodName) => {
  const normalized = normalizeFoodName(foodName);

  // Direct match
  if (fallbackNutritionDatabase[normalized]) {
    return fallbackNutritionDatabase[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(fallbackNutritionDatabase)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
};

// Analyze nutrition for a list of food items
export const analyzeNutrition = async (foodItems) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment");

  const model = new ChatGroq({
    apiKey,
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
  });

  const nutritionPrompt = `Return ONLY a valid JSON object.  No markdown, no extra text. 
For each of these food items, provide nutritional values:  ${foodItems.join(", ")}

Return as JSON with food names (exactly as provided) as keys.  Each value should have:  
{"calories": number, "protein_g": number, "carbohydrates_g":  number, "fat_g": number, "fiber_g": number, "key_vitamins_minerals":  "string", "health_benefits": "string"}

Example format:
{"Chicken Biryani": {"calories":  450, "protein_g":  28, "carbohydrates_g": 52, "fat_g": 12, "fiber_g": 2, "key_vitamins_minerals": "Iron, Vitamin B", "health_benefits": "..."}}

ONLY output valid JSON, nothing else.`;

  try {
    const response = await model.invoke([
      new SystemMessage("You are a nutrition expert. Output ONLY valid JSON, no markdown formatting or code blocks."),
      new HumanMessage(nutritionPrompt),
    ]);

    const raw = response.content || (response. output && response.output[0] && response.output[0].content) || "";
    const stripped = stripCodeFences(raw);

    console.log("Raw nutrition response:", stripped);

    try {
      const parsed = JSON. parse(stripped);
      console.log("Parsed nutrition data:", parsed);

      // Don't validate with schema, just use the parsed data directly
      // Zod validation was too strict and causing fallback to empty object
      return parsed;
    } catch (err) {
      console.error("Failed to parse nutrition JSON:", err);
      // Fall back to database for all items
      const result = {};
      for (const foodItem of foodItems) {
        const fallback = findNutritionFromFallback(foodItem);
        if (fallback) {
          result[foodItem] = fallback;
        }
      }
      console.log("Using fallback database:", result);
      return result;
    }
  } catch (error) {
    console.error("Nutrition Analysis Error:", error);
    // Fall back to database
    const result = {};
    for (const foodItem of foodItems) {
      const fallback = findNutritionFromFallback(foodItem);
      if (fallback) {
        result[foodItem] = fallback;
      }
    }
    console.log("Using fallback database (catch):", result);
    return result;
  }
};

// Main chat function
export const aiChat = async (message) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in environment");

  try {
    const model = new ChatGroq({
      apiKey,
      model: "llama-3.1-8b-instant",
      temperature:  0.7,
      maxTokens: 1000,
    });

    // Prepare messages
    const lcMessages = convertToLangChainMessages(message);

    // Add system message for JSON output
    lcMessages.unshift(
      new SystemMessage(
        "You are a food recommendation expert.  Respond with valid JSON only, matching the specified schema.  Do not include markdown code blocks."
      )
    );

    // Get food recommendations
    const response = await model.invoke(lcMessages);
    const raw = response.content || (response. output && response.output[0] && response.output[0].content) || "";
    const stripped = stripCodeFences(raw);

    console.log("Raw recommendation response:", stripped);

    let recommendations;
    try {
      recommendations = JSON.parse(stripped);
      const validated = foodRecommendationSchema.parse(recommendations);
      recommendations = validated;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Extract food items for nutrition analysis
    const foodItems = recommendations.foods
      . map((food) => food["1"] || food["2"] || food["3"] || food. extra || null)
      .filter(Boolean);

    console.log("Extracted food items:", foodItems);

    // Get nutritional analysis (will use fallback database if model fails)
    const nutritionData = await analyzeNutrition(foodItems);

    console.log("Nutrition data returned:", nutritionData);

    // Merge nutrition data with recommendations
    const enhancedRecommendations = {
      ...recommendations,
      foods: recommendations.foods.map((food) => {
        const foodName = food["1"] || food["2"] || food["3"] || food.extra || "";
        const nutrition = (nutritionData && nutritionData[foodName]) || {};
        
        // Extract values with proper fallback
        const calories = nutrition.calories || nutrition.calories === 0 ? nutrition.calories : "N/A";
        const protein = nutrition.protein_g || nutrition.protein_g === 0 ? nutrition. protein_g : "N/A";
        const carbs = nutrition.carbohydrates_g || nutrition.carbohydrates_g === 0 ? nutrition.carbohydrates_g : "N/A";
        const healthBenefits = nutrition.health_benefits || "";

        return {
          ...food,
          nutrition,
          reason: `${food. reason}\n\nNutritional Benefits: This dish contains ${calories} calories, ${protein}g protein, and ${carbs}g carbohydrates. ${healthBenefits}`,
        };
      }),
    };

    return enhancedRecommendations;
  } catch (error) {
    console.error("Groq API Error:", error);
    const errorResponse = {
      error: true,
      message: (error && error.message) || String(error),
      timestamp: new Date().toISOString(),
    };
    throw errorResponse;
  }
};