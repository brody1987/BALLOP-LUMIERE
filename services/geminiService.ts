import { GoogleGenAI } from "@google/genai";
import { FashionStyle } from "../types";

// Helper to check for API Key
export const hasApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

// Helper to open key selection dialog
export const requestApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
    // Return boolean based on whether key is available now
    return await hasApiKey();
  }
  return false;
};

export const generateFashionImage = async (
  portraitBase64: string,
  productBase64s: string[],
  style: FashionStyle,
  poseDescription: string
): Promise<string> => {
  // Always create a new instance to ensure we pick up the latest selected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clean base64 strings (remove data:image/...;base64, prefix if present)
  const cleanPortrait = portraitBase64.split(',')[1] || portraitBase64;
  const cleanProducts = productBase64s.map(p => p.split(',')[1] || p);

  const parts: any[] = [];

  // 1. Add Portrait
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: cleanPortrait
    }
  });

  // 2. Add Products
  cleanProducts.forEach(prod => {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: prod
      }
    });
  });

  // 3. Construct Prompt - STRICTER FIDELITY & STYLING INSTRUCTIONS
  const prompt = `
    You are a visionary fashion director and photographer.

    INPUTS:
    1. **Model Reference** (First Image): Use this strictly for the model's **FACE, HAIR, SKIN TONE, and BODY PROPORTIONS**. 
       - CRITICAL: The facial identity must remain consistent with this image. 
       - IGNORE the clothes the model is wearing in this image. You are replacing them.

    2. **Product References** (Subsequent Images): These are the **MANDATORY HERO ITEMS** the model is wearing.
       - CRITICAL: Preserve exact details, logos, textures, and cuts of these items. Do not hallucinate different versions.

    GENERATION TASK:
    Create a cohesive, high-fashion editorial image.
    1. **Dress the Model**: Fit the 'Product References' onto the model in the specified pose.
    2. **Complete the Styling**: GENERATE a totally new outfit for the rest of the model's body (pants, shoes, accessories, outerwear) that perfectly compliments the Hero Products. 
       - The generated clothing must match the requested "${style}" aesthetic.
       - Do not leave the model wearing mismatched or casual clothes from the original photo. The entire outfit must be cohesive.

    ART DIRECTION:
    - **Pose**: ${poseDescription}
    - **Aesthetic**: ${style}
    - **Quality**: Photorealistic, 8k, highly detailed textures, dramatic editorial lighting.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // High quality image model
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Standard Editorial Ratio
          imageSize: "4K" 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};