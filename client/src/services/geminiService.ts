// Using the newer Gemini 2.0 Flash model with REST API for chatbot behavior
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

if (!API_KEY) {
  console.error("Gemini API key not found in environment variables");
}

export interface LaptopContext {
  name?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  price?: string;
  screenSize?: string;
  brand?: string;
  specs?: Record<string, unknown>;
}

export interface ComparedLaptopData {
  name: string;
  brand: string;
  series: string;
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  screenSize: string;
  price: string;
  rating?: string;
  specs?: Record<string, unknown>;
}

// Conversation history interface for chatbot behavior
export interface ConversationMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiService {
  // Maintain conversation history for chatbot behavior
  private conversationHistory: ConversationMessage[] = [];
  private readonly MAX_HISTORY_LENGTH = 10; // Keep last 10 exchanges

  async generateResponse(
    userMessage: string,
    laptopContext?: LaptopContext,
    pageContext?: string,
    comparedLaptops?: ComparedLaptopData[]
  ): Promise<string> {
    try {
      // Check if API key is available
      if (!API_KEY) {
        console.warn("Gemini API key not available, using enhanced fallback");
        return this.getEnhancedFallbackResponse(
          userMessage,
          laptopContext,
          pageContext,
          comparedLaptops
        );
      }

      const systemPrompt = this.buildSystemPrompt(
        laptopContext,
        pageContext,
        comparedLaptops
      );

      // Build conversation with history for chatbot behavior
      const conversationContents = this.buildConversationContents(
        systemPrompt,
        userMessage
      );

      console.log("🚀 Sending request to Gemini 2.0 Flash API...");

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationContents,
          generationConfig: {
            temperature: 0.7, // Balanced creativity for chatbot
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Gemini API Error:", response.status, errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response structure from Gemini API");
      }

      const text = data.candidates[0].content.parts[0].text;

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini API");
      }

      // Add to conversation history for chatbot continuity
      this.addToConversationHistory('user', userMessage);
      this.addToConversationHistory('model', text);

      console.log("✅ Gemini 2.0 Flash API response successful");
      return this.formatResponse(text);

    } catch (error) {
      console.error("Gemini AI Error:", error);
      // Provide more specific error information for debugging
      if (error instanceof Error) {
        if (error.message.includes("API_KEY")) {
          console.error("API Key issue:", error.message);
        } else if (error.message.includes("timeout") || error.name === "AbortError") {
          console.error("Request timeout or aborted");
        } else if (error.message.includes("quota") || error.message.includes("rate")) {
          console.error("Rate limit or quota exceeded");
        } else {
          console.error("General API error:", error.message);
        }
      }
      
      return this.getEnhancedFallbackResponse(
        userMessage,
        laptopContext,
        pageContext,
        comparedLaptops
      );
    }
  }  private buildConversationContents(
    systemPrompt: string,
    userMessage: string
  ): Array<{ role: string; parts: { text: string }[] }> {
    const contents = [];

    // For Gemini 2.0 Flash, we need to combine system prompt with user message
    // since it doesn't support a separate system role
    const combinedMessage = `${systemPrompt}\n\nUser Question: ${userMessage}`;

    // Add conversation history for context
    for (const message of this.conversationHistory) {
      contents.push({
        role: message.role,
        parts: [{ text: message.parts[0].text }]
      });
    }

    // Add current user message with system prompt
    contents.push({
      role: "user",
      parts: [{ text: combinedMessage }]
    });

    return contents;
  }
  private addToConversationHistory(role: 'user' | 'model', text: string) {
    this.conversationHistory.push({
      role,
      parts: [{ text }]
    });

    // Keep conversation history manageable
    if (this.conversationHistory.length > this.MAX_HISTORY_LENGTH * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.MAX_HISTORY_LENGTH * 2);
    }
  }

  // Method to clear conversation history (useful for starting fresh)
  public clearConversationHistory() {
    this.conversationHistory = [];
    console.log("🔄 Conversation history cleared");
  }

  // Method to get conversation summary (useful for debugging)
  public getConversationSummary() {
    return {
      totalMessages: this.conversationHistory.length,
      lastUserMessage: this.conversationHistory
        .filter(m => m.role === 'user')
        .slice(-1)[0]?.parts[0]?.text || 'None',
      lastModelResponse: this.conversationHistory
        .filter(m => m.role === 'model')
        .slice(-1)[0]?.parts[0]?.text || 'None'
    };
  }private buildSystemPrompt(
    laptopContext?: LaptopContext,
    pageContext?: string,
    comparedLaptops?: ComparedLaptopData[]
  ): string {
    const contextInfo = laptopContext
      ? `
CURRENT LAPTOP CONTEXT:
- Name: ${laptopContext.name || "Not specified"}
- Processor: ${laptopContext.processor || "Not specified"}
- RAM: ${laptopContext.ram || "Not specified"}
- Storage: ${laptopContext.storage || "Not specified"}
- Graphics: ${laptopContext.graphics || "Not specified"}
- Screen Size: ${laptopContext.screenSize || "Not specified"}
- Price: ${laptopContext.price || "Not specified"}
- Brand: ${laptopContext.brand || "Not specified"}
`
      : "";

    const pageContextInfo = pageContext ? `\nPAGE CONTEXT: ${pageContext}` : "";

    const comparedLaptopsInfo =
      comparedLaptops && comparedLaptops.length > 0
        ? `
LAPTOPS BEING COMPARED (${comparedLaptops.length} laptops):
${comparedLaptops
  .map(
    (laptop, index) => `
${index + 1}. ${laptop.name}
   - Brand: ${laptop.brand}
   - Series: ${laptop.series}
   - Processor: ${laptop.processor}
   - RAM: ${laptop.ram}
   - Storage: ${laptop.storage}
   - Graphics: ${laptop.graphics}
   - Screen Size: ${laptop.screenSize}
   - Price: ${laptop.price}
   ${laptop.rating ? `- Rating: ${laptop.rating}` : ""}
`
  )
  .join("")}

When answering questions about comparison, focus specifically on these ${
            comparedLaptops.length
          } laptops above. Provide detailed comparative analysis, highlight differences, and make specific recommendations based on use cases.

IMPORTANT: When asked "which is best" or "which laptop is the best overall choice", provide a DIRECT answer with your recommendation, followed by a brief explanation. Do not ask follow-up questions first - answer the question directly and then offer additional help.
`
        : "";

    return `You are an EXPERT LAPTOP CONSULTANT and TECH SPECIALIST with COMPREHENSIVE knowledge about laptop hardware, specifications, components, and technical terms. You have a friendly, conversational personality and maintain context across our conversation.

🎯 **YOUR CHATBOT PERSONALITY:**
- Enthusiastic and knowledgeable about laptops
- Remember previous questions and build upon them
- Use emojis and friendly language
- Provide detailed technical explanations when needed
- Always be helpful and encouraging
- Maintain conversation flow and context

🔧 **CORE EXPERTISE:**
- Detailed technical specifications analysis and explanations
- Component-level hardware knowledge (CPU, GPU, RAM, Storage, etc.)
- Processor architectures, generations, and performance characteristics
- Memory types, speeds, and capacity recommendations
- Storage technologies (HDD, SSD, NVMe, PCIe speeds)
- Graphics card performance tiers and gaming capabilities
- Display technologies and specifications
- Battery technology and optimization
- Price-to-performance analysis across all segments
- Indian market pricing and availability
- Future-proofing and technology trends

🎯 **CHATBOT BEHAVIOR:**
- Remember what we discussed earlier in our conversation
- Build upon previous topics naturally
- Ask clarifying questions when helpful
- Provide personalized recommendations based on our chat history
- Use a conversational, friendly tone
- Acknowledge when users return to previous topics
- Offer follow-up suggestions based on context

🎯 **RESPONSE STYLE:**
- Start responses conversationally (e.g., "Great question!", "I see you're interested in...", "Building on what we discussed...")
- Use technical accuracy while maintaining accessibility
- Provide specific examples and real-world scenarios
- Include performance metrics and practical advice
- End with helpful follow-up questions or suggestions

${contextInfo}${pageContextInfo}${comparedLaptopsInfo}

REMEMBER: You're having a conversation, not just answering isolated questions. Be personable, helpful, and maintain the flow of our discussion!`;
  }
  private formatResponse(text: string): string {
    // Clean up and format the AI response for better readability
    let formatted = text.trim();

    // Ensure proper spacing after emojis (simplified regex)
    formatted = formatted.replace(/([\u{1F300}-\u{1F9FF}])\s*/gu, "$1 ");

    // Add proper line breaks and formatting
    formatted = formatted.replace(/\n\n/g, "\n\n");

    return formatted;
  }
  private getEnhancedFallbackResponse(
    userMessage: string,
    laptopContext?: LaptopContext,
    _pageContext?: string,
    comparedLaptops?: ComparedLaptopData[]
  ): string {
    const query = userMessage.toLowerCase();
    
    console.log("🔄 Using enhanced fallback for query:", query);

    // Enhanced laptop knowledge base with comprehensive responses
    const laptopKnowledgeBase = {
      // Technical terms and specifications
      ram: {
        keywords: ['ram', 'memory', 'ddr', 'ddr4', 'ddr5', 'gb memory'],
        response: `🧠 **RAM (Random Access Memory) Explained:**

**What is RAM?**
RAM is your laptop's short-term memory that stores data currently being used. More RAM = better multitasking and performance.

**DDR Types:**
• **DDR4:** Standard, reliable, good performance (3200MHz typical)
• **DDR5:** Latest, faster speeds (4800MHz+), better efficiency
• **LPDDR:** Low-power variant, common in ultrabooks

**How much RAM do you need?**
• **8GB:** Basic tasks, web browsing, light office work
• **16GB:** Gaming, programming, multitasking, content creation
• **32GB+:** Video editing, 3D rendering, heavy professional work

**Speed matters:** Higher MHz = faster data transfer
**Dual Channel:** 2 sticks perform better than 1 stick

💡 **Pro tip:** 16GB DDR4 is the sweet spot for most users in 2024!`
      },

      storage: {
        keywords: ['ssd', 'hdd', 'storage', 'nvme', 'hard drive', 'disk'],
        response: `💾 **Storage Technologies Explained:**

**Storage Types:**
• **HDD (Hard Disk Drive):** Mechanical, slower (100MB/s), cheaper, more capacity
• **SSD (Solid State Drive):** No moving parts, faster (500MB/s), more reliable
• **NVMe SSD:** Ultra-fast (3000-7000MB/s), uses PCIe interface

**Performance Impact:**
• **Boot time:** SSD = 10-15 seconds, HDD = 30-60 seconds
• **App loading:** SSD loads apps instantly, HDD has delays
• **File transfers:** NVMe is 10x faster than HDD

**Capacity Guide:**
• **256GB:** Minimum for basic use
• **512GB:** Comfortable for most users
• **1TB+:** Heavy files, games, media storage

🚀 **Recommendation:** Go for NVMe SSD for best performance!`
      },

      gaming: {
        keywords: ['gaming', 'game', 'fps', 'esports', 'valorant', 'csgo', 'pubg'],
        response: `🎮 **Gaming Laptop Guide 2024:**

**Budget Gaming (₹50k-80k):**
• GPU: RTX 3050, GTX 1650
• CPU: Intel i5-11th/12th gen, Ryzen 5 5000
• RAM: 8-16GB DDR4
• Target: 1080p Medium-High, 60+ FPS

**Mid-Range Gaming (₹80k-1.2L):**
• GPU: RTX 3060/4060, RTX 3070
• CPU: Intel i5-12th/13th gen, Ryzen 5 6000/7000
• RAM: 16GB DDR4/DDR5
• Target: 1080p Ultra, 1440p High, 100+ FPS

**High-End Gaming (₹1.2L+):**
• GPU: RTX 4070/4080, RTX 3080+
• CPU: Intel i7/i9, Ryzen 7/9
• RAM: 16-32GB DDR5
• Target: 1440p Ultra, 4K High, 120+ FPS

🏆 **Top Gaming Laptop Brands:** ASUS ROG, MSI Gaming, HP Omen, Acer Predator`
      }
    };

    // Check for specific technical terms
    for (const [, data] of Object.entries(laptopKnowledgeBase)) {
      if (data.keywords.some(keyword => query.includes(keyword))) {
        return data.response;
      }
    }

    // Handle comparison queries
    if (comparedLaptops && comparedLaptops.length > 0) {
      if (query.includes("best") || query.includes("which") || query.includes("recommend")) {
        return this.getEnhancedComparisonResponse(comparedLaptops);
      }
    }

    // Context-specific responses
    if (laptopContext) {
      return this.getEnhancedLaptopContextResponse(laptopContext);
    }

    // Default enhanced response
    return this.getEnhancedDefaultResponse(query);
  }

  private getEnhancedComparisonResponse(comparedLaptops: ComparedLaptopData[]): string {
    const laptopNames = comparedLaptops.map(laptop => laptop.name).join(' vs ');
    
    return `📊 **Comprehensive Laptop Comparison: ${laptopNames}**

**Detailed Analysis:**
${comparedLaptops.map((laptop, index) => `
**${index + 1}. ${laptop.name}**
• **Processor:** ${laptop.processor}
• **RAM:** ${laptop.ram}
• **Storage:** ${laptop.storage}
• **Graphics:** ${laptop.graphics}
• **Screen:** ${laptop.screenSize}
• **Price:** ${laptop.price}`).join('\n')}

**🎯 Recommendation:**
All these laptops have similar specifications. Choose based on:
💰 **Price** - Go with the best current deal
🚚 **Availability** - Choose the one in stock
🎨 **Design** - Pick your preferred design

What specific aspect would you like me to analyze further?`;
  }

  private getEnhancedLaptopContextResponse(laptopContext: LaptopContext): string {
    const laptopName = laptopContext.name || 'this laptop';
    
    return `💫 **About ${laptopName}:**

This laptop features:
• **Processor:** ${laptopContext.processor || 'Not specified'}
• **RAM:** ${laptopContext.ram || 'Not specified'}  
• **Storage:** ${laptopContext.storage || 'Not specified'}
• **Graphics:** ${laptopContext.graphics || 'Not specified'}
• **Screen:** ${laptopContext.screenSize || 'Not specified'}
• **Price:** ${laptopContext.price || 'Not available'}

**❓ Ask me about:**
• Gaming performance
• Specifications explanation  
• Price comparison
• Similar alternatives
• Upgrade recommendations

What would you like to know? 🚀`;
  }

  private getEnhancedDefaultResponse(query: string): string {
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      return `👋 **Hello! I'm your Laptop Expert Assistant!**

I have comprehensive knowledge about:

🔧 **Technical Specifications:**
• Processors (Intel vs AMD, generations, performance)
• RAM types (DDR4, DDR5, capacity recommendations)  
• Storage (HDD vs SSD vs NVMe, speeds, capacity)
• Graphics cards (gaming performance, VRAM, ray tracing)
• Display technology (resolutions, refresh rates)

🎯 **Use Case Guidance:**
• Gaming laptops (budget to high-end)
• Programming/coding setups
• Student/office productivity
• Creative design work

**💬 Try asking me:**
• "What's the difference between DDR4 and DDR5?"
• "Best gaming laptop under 80k?"
• "Is 8GB RAM enough for programming?"
• "RTX 3060 vs RTX 4060 comparison"

What laptop question can I help you with? 🚀`;
    }

    return `🤖 **I'm your comprehensive laptop consultant!**

I can help with ANY laptop-related question:

**🔍 Technical Explanations:**
• RAM, storage, processors, graphics cards
• Performance comparisons and benchmarks
• Technology trends and future-proofing

**🎯 Recommendations:**
• Gaming laptops by budget and performance
• Work/productivity setups
• Student and budget options

**📊 Analysis & Comparison:**
• Detailed spec breakdowns
• Performance vs price analysis
• Brand reliability and support

What specific laptop topic interests you? Whether it's technical specs, buying advice, or performance analysis - I'm here to help! 🚀`;
  }
}

export const geminiService = new GeminiService();
