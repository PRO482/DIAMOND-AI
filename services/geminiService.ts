
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Message, ImageStyle, UserSettings } from "../types";

const buildSystemPrompt = (settings?: UserSettings) => `
You are DIAMOND AI, a highly sophisticated, polite, and attractive AI assistant.
CREATED BY: RAJVARDHAN VITTHAL SURYAVANSHI AND SHUBHAM KANTARAM MORE.

CORE RULES:
1. ADDRESSING USER: Always be extremely polite and address the user as "Master" in every single response.

2. RESPONSE LOGIC (DYNAMIC):
   - INFORMATION & PROBLEMS: If the user asks a question, provides a math problem, seeks detailed info, or requests help with a task, your response MUST be VERY LONG, DETAILED, and COMPREHENSIVE. Provide deep explanations and thorough solutions.
   - FORMATTING: Use clear points for complex answers. You MUST leave exactly one blank line after each point ends before starting the next one.
   - GENERAL CHAT: Only be brief if the user is just saying hello, greeting you, or engaging in simple small talk (e.g., "Hi", "How are you?", "What's up?"). Even then, stay polite and call them "Master".

3. IDENTITY:
   - If asked who made you, answer: "RAJVARDHAN VITTHAL SURYAVANSHI AND SHUBHAM KANTARAM MORE".
   - If asked what you are, explain your capabilities as a high-performance system for problem-solving and creation.

4. SAFETY & RESTRICTIONS:
   - NO WEBSITES: Do not provide any website links, URLs, or external site references.
   - HARMFUL CONTENT: Refuse harmful or unethical requests politely.

5. MISTAKES: If you make a mistake, apologize very politely to your Master.
6. GREETING: Your initial text is "Hello master, how can I help you".
`;

export class GeminiService {
  async chat(prompt: string, history: Message[], settings?: UserSettings): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: buildSystemPrompt(settings),
        temperature: 0.7,
      }
    });
    return response.text || "I apologize, master, but I couldn't generate a response.";
  }

  async generateImage(prompt: string): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality, attractive, 4k resolution, artistic style: ${prompt}` }]
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image generation failed", e);
      return null;
    }
  }

  async convertImageStyle(base64Image: string, style: ImageStyle): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      
      let styleInstruction = `Redraw this image in ${style} style. Ensure it is high quality.`;
      
      switch(style) {
        case ImageStyle.CYBERPUNK:
          styleInstruction = "Redraw this image in a Cyberpunk 2077 aesthetic: neon lights, futuristic city vibes, high-tech/low-life theme, vibrant blues and pinks.";
          break;
        case ImageStyle.WATERCOLOR:
          styleInstruction = "Redraw this image in a Soft Watercolor style: delicate brush strokes, pastel tones, artistic paper texture.";
          break;
        case ImageStyle.SKETCH:
          styleInstruction = "Redraw this image as a Pencil Sketch: detailed graphite textures, hatching, hand-drawn look.";
          break;
        case ImageStyle.POP_ART:
          styleInstruction = "Redraw this image in Pop Art style: bold lines, vibrant primary colors, Ben-Day dots.";
          break;
        case ImageStyle.REALISTIC_3D:
          styleInstruction = "Redraw this image as a Hyper-Realistic 3D render: extreme detail, 8k resolution, photorealistic textures.";
          break;
        case ImageStyle.GHIBLI:
          styleInstruction = "Redraw this image in Studio Ghibli anime style: soft lighting, whimsical hand-painted look.";
          break;
        case ImageStyle.NANO_BANANA:
          styleInstruction = "Redraw this image in a sleek, digital, minimalist aesthetic with smooth gradients.";
          break;
        case ImageStyle.RETRO:
          styleInstruction = "Redraw this image in an 80s Retro style: scanlines, synthwave colors, pixelated or VHS aesthetics.";
          break;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
            { text: styleInstruction }
          ]
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Style conversion failed", e);
      return null;
    }
  }

  async analyzeImage(base64Image: string, prompt: string, settings?: UserSettings): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
            { text: prompt || "Analyze this image for me, master. Provide a detailed, comprehensive response." }
          ]
        },
        config: { systemInstruction: buildSystemPrompt(settings) }
      });
      return response.text || "I couldn't analyze the image, master.";
    } catch (e) {
      return "I encountered an error analyzing the image, master. Please forgive me.";
    }
  }

  async generateVideo(prompt: string, signal?: AbortSignal): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `3D high graphical, cinematic lighting, 4k, hyper-detailed: ${prompt}`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        if (signal?.aborted) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;
      
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`, { signal });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e: any) {
      if (e.name === 'AbortError') return null;
      console.error("Video generation failed", e);
      return null;
    }
  }
}
