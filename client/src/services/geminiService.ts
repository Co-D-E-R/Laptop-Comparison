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
        return this.getEnhancedComparisonResponse(comparedLaptops, query);
      }
    }

    // Context-specific responses
    if (laptopContext) {
      return this.getEnhancedLaptopContextResponse(laptopContext, query);
    }

    // Default enhanced response
    return this.getEnhancedDefaultResponse(query);
  }

  private getEnhancedComparisonResponse(comparedLaptops: ComparedLaptopData[], _query: string): string {
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

  private getEnhancedLaptopContextResponse(laptopContext: LaptopContext, _query: string): string {
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
  // Helper methods for enhanced responses
  private calculateGamingScore(laptop: ComparedLaptopData): number {
    const graphics = laptop.graphics.toLowerCase();
    if (graphics.includes('rtx 4080') || graphics.includes('rtx 4090')) return 10;
    if (graphics.includes('rtx 4070') || graphics.includes('rtx 3080')) return 9;
    if (graphics.includes('rtx 4060') || graphics.includes('rtx 3070')) return 8;
    if (graphics.includes('rtx 3060') || graphics.includes('rtx 4050')) return 7;
    if (graphics.includes('rtx 3050') || graphics.includes('gtx 1660')) return 6;
    if (graphics.includes('gtx 1650') || graphics.includes('gtx 1050')) return 5;
    if (graphics.includes('iris xe')) return 3;
    return 2;
  }

  private calculateOverallScore(laptop: ComparedLaptopData): number {
    let score = 5; // base score
    
    // Processor scoring
    const proc = laptop.processor.toLowerCase();
    if (proc.includes('i9') || proc.includes('ryzen 9')) score += 2;
    else if (proc.includes('i7') || proc.includes('ryzen 7')) score += 1.5;
    else if (proc.includes('i5') || proc.includes('ryzen 5')) score += 1;
    else if (proc.includes('i3') || proc.includes('ryzen 3')) score += 0.5;
    
    // RAM scoring
    if (laptop.ram.includes('32gb') || laptop.ram.includes('64gb')) score += 2;
    else if (laptop.ram.includes('16gb')) score += 1;
    else if (laptop.ram.includes('8gb')) score += 0.5;
    
    // Graphics scoring
    const graphics = laptop.graphics.toLowerCase();
    if (graphics.includes('rtx 40') || graphics.includes('rtx 30')) score += 2;
    else if (graphics.includes('gtx')) score += 1;
    else if (graphics.includes('iris xe')) score += 0.5;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  private getBestGamingLaptop(laptops: ComparedLaptopData[]): string {
    const scores = laptops.map(laptop => ({
      laptop,
      score: this.calculateGamingScore(laptop)
    }));
    const best = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    
    return `**${best.laptop.name}** is the best for gaming with a score of ${best.score}/10. 
    
**Why it's the best:**
• Superior graphics: ${best.laptop.graphics}
• Performance: ${best.laptop.processor}
• Memory: ${best.laptop.ram}

This laptop will deliver excellent gaming performance across modern titles.`;
  }

  private getBestOverallLaptop(laptops: ComparedLaptopData[]): string {
    const scores = laptops.map(laptop => ({
      laptop,
      score: this.calculateOverallScore(laptop)
    }));
    const best = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    
    return `**${best.laptop.name}** offers the best overall package with a score of ${best.score}/10.
    
**Strengths:**
• Balanced performance across all areas
• Good future-proofing
• Excellent specifications for the price range`;
  }  private getBestValueLaptop(): string {
    // For value, we'd need actual pricing logic, but for now return a general response
    return `For best value, consider the laptop with the lowest price while meeting your performance needs. Look for laptops with solid mid-range specs that offer the best price-to-performance ratio.`;
  }

  private getKeyDifferences(laptops: ComparedLaptopData[]): string {
    if (laptops.length < 2) return "Need at least 2 laptops to compare differences.";
    
    // Check if laptops are very similar
    const firstLaptop = laptops[0];
    const allSimilar = laptops.every(laptop => 
      laptop.processor === firstLaptop.processor &&
      laptop.ram === firstLaptop.ram &&
      laptop.storage === firstLaptop.storage
    );
    
    if (allSimilar) {
      return "These laptops have essentially identical specifications. The main differences are likely model variants, pricing, and availability.";
    }
    
    return "Key differences include processor generations, RAM capacity, storage types, and graphics capabilities. Check specifications above for detailed comparison.";
  }

  private getGamingRecommendation(laptop: ComparedLaptopData): string {
    const score = this.calculateGamingScore(laptop);
    if (score >= 8) return "High-end gaming, 1440p Ultra settings";
    if (score >= 6) return "1080p High-Ultra gaming";
    if (score >= 4) return "1080p Medium gaming, esports titles";
    return "Light gaming only, older titles";
  }

  private getQuickAnalysis(context: LaptopContext): string {
    const analysis = this.analyzeSpecs(context);
    return `This laptop scores ${analysis.rating}/10 overall and is best suited for: ${analysis.useCases.slice(0, 2).join(' and ')}.`;
  }  private analyzeSpecs(context: LaptopContext): { summary: string; useCases: string[]; rating: number; recommendations: string } {
    const processor = context.processor?.toLowerCase() || "";
    const ram = context.ram?.toLowerCase() || "";
    const graphics = context.graphics?.toLowerCase() || "";
    const storage = context.storage?.toLowerCase() || "";
    
    let rating = 5;
    const useCases: string[] = [];
    let summary = "";
    let recommendations = "";

    // Analyze processor
    if (processor.includes("i9") || processor.includes("ryzen 9")) {
      rating += 3;
      useCases.push("Professional workloads", "Content creation", "Heavy multitasking");
    } else if (processor.includes("i7") || processor.includes("ryzen 7")) {
      rating += 2;
      useCases.push("Gaming", "Content creation", "Productivity");
    } else if (processor.includes("i5") || processor.includes("ryzen 5")) {
      rating += 1;
      useCases.push("General productivity", "Light gaming", "Multitasking");
    } else if (processor.includes("i3") || processor.includes("ryzen 3")) {
      useCases.push("Basic tasks", "Web browsing", "Office work");
    }

    // Analyze RAM
    if (ram.includes("32gb") || ram.includes("64gb")) {
      rating += 2;
    } else if (ram.includes("16gb")) {
      rating += 1;
    } else if (ram.includes("8gb")) {
      // Standard, no bonus
    } else if (ram.includes("4gb")) {
      rating -= 1;
      recommendations += "\n⚠️ **Upgrade Alert:** 4GB RAM is insufficient for modern use. Consider upgrading to 8GB minimum.";
    }

    // Analyze graphics
    if (graphics.includes("rtx 40") || graphics.includes("rtx 30")) {
      rating += 2;
      if (!useCases.includes("Gaming")) useCases.push("Gaming");
      useCases.push("3D rendering", "AI/ML workloads");
    } else if (graphics.includes("rtx") || graphics.includes("gtx 16")) {
      rating += 1;
      if (!useCases.includes("Gaming")) useCases.push("Gaming");
    } else if (graphics.includes("integrated") || graphics.includes("uhd") || graphics.includes("iris xe")) {
      // Integrated graphics - no bonus
      if (useCases.includes("Gaming")) {
        recommendations += "\n⚠️ **Gaming Note:** Integrated graphics limits gaming performance. Consider dedicated GPU for better gaming.";
      }
    }

    // Analyze storage
    if (storage.includes("nvme") || storage.includes("pcie")) {
      rating += 1;
    } else if (storage.includes("ssd")) {
      // Standard SSD, no bonus
    } else if (storage.includes("hdd")) {
      rating -= 1;
      recommendations += "\n⚠️ **Performance Note:** HDD storage will slow down your laptop. SSD upgrade highly recommended.";
    }

    // Generate summary
    if (rating >= 9) {
      summary = "High-end powerhouse laptop with excellent performance across all areas";
    } else if (rating >= 7) {
      summary = "Strong performance laptop suitable for demanding tasks";
    } else if (rating >= 5) {
      summary = "Well-balanced laptop good for general productivity and light performance tasks";
    } else if (rating >= 3) {
      summary = "Entry-level laptop suitable for basic computing tasks";
    } else {
      summary = "Basic laptop with limited performance capabilities";
    }

    return { summary, useCases, rating: Math.min(10, Math.max(1, rating)), recommendations };
  }

  private getProcessorExplanation(processor?: string): string {
    if (!processor) return "";
    
    const proc = processor.toLowerCase();
    if (proc.includes("i9") || proc.includes("ryzen 9")) {
      return "🚀 **Top-tier processor** - Excellent for professional work, content creation, and high-end gaming.";
    } else if (proc.includes("i7") || proc.includes("ryzen 7")) {
      return "⚡ **High-performance processor** - Great for gaming, multitasking, and creative work.";
    } else if (proc.includes("i5") || proc.includes("ryzen 5")) {
      return "💪 **Mid-range performer** - Solid choice for productivity, programming, and light gaming.";
    } else if (proc.includes("i3") || proc.includes("ryzen 3")) {
      return "📝 **Entry-level processor** - Good for basic tasks, web browsing, and office work.";
    } else if (proc.includes("celeron") || proc.includes("pentium")) {
      return "⚠️ **Basic processor** - Limited to light tasks, web browsing only.";
    }
    return "🖥️ **Custom/Specialized processor** - Performance varies by specific model.";
  }

  private getRAMExplanation(ram?: string): string {
    if (!ram) return "";
    
    if (ram.includes("32gb") || ram.includes("64gb")) {
      return "🎯 **Professional-grade memory** - Excellent for heavy multitasking, video editing, and professional workloads.";
    } else if (ram.includes("16gb")) {
      return "✅ **Optimal memory** - Perfect for gaming, content creation, and heavy multitasking.";
    } else if (ram.includes("8gb")) {
      return "👍 **Standard memory** - Good for general use, light multitasking, and basic productivity.";
    } else if (ram.includes("4gb")) {
      return "⚠️ **Minimum memory** - Limited multitasking capability, consider upgrading.";
    }
    return "🧠 **Memory specification** - Check if sufficient for your use case.";
  }

  private getStorageExplanation(storage?: string): string {
    if (!storage) return "";
    
    const stor = storage.toLowerCase();
    if (stor.includes("nvme") || stor.includes("pcie gen 4")) {
      return "🚀 **Ultra-fast storage** - Blazing speeds (5000-7000MB/s), instant boot and app loading.";
    } else if (stor.includes("nvme") || stor.includes("pcie")) {
      return "⚡ **Fast NVMe storage** - Excellent speeds (2000-3500MB/s), quick boot and file access.";
    } else if (stor.includes("ssd")) {
      return "✅ **Solid-state storage** - Good speeds (500MB/s), reliable and fast boot times.";
    } else if (stor.includes("hdd")) {
      return "⚠️ **Traditional hard drive** - Slower speeds, consider SSD upgrade for better performance.";
    } else if (stor.includes("hybrid") || stor.includes("sshd")) {
      return "🔄 **Hybrid storage** - Combines HDD capacity with SSD cache for improved performance.";
    }
    return "💾 **Storage device** - Speed and capacity impact overall performance.";
  }

  private getGraphicsExplanation(graphics?: string): string {
    if (!graphics) return "";
    
    const gpu = graphics.toLowerCase();
    if (gpu.includes("rtx 40")) {
      return "🎮 **Latest gaming graphics** - Excellent for 1440p/4K gaming, ray tracing, content creation.";
    } else if (gpu.includes("rtx 30")) {
      return "🎮 **High-end gaming graphics** - Great for 1080p/1440p gaming, ray tracing support.";
    } else if (gpu.includes("rtx 20") || gpu.includes("gtx 16")) {
      return "🎮 **Gaming graphics** - Good for 1080p gaming, entry-level content creation.";
    } else if (gpu.includes("gtx 10")) {
      return "🎮 **Entry gaming graphics** - Suitable for 1080p gaming at medium settings.";
    } else if (gpu.includes("iris xe")) {
      return "📱 **Enhanced integrated graphics** - Better than basic integrated, light gaming possible.";
    } else if (gpu.includes("uhd") || gpu.includes("integrated")) {
      return "💻 **Basic integrated graphics** - Suitable for productivity, video playback, very light gaming.";
    } else if (gpu.includes("radeon") && !gpu.includes("integrated")) {
      return "🎮 **AMD dedicated graphics** - Good gaming performance, competitive with NVIDIA.";
    }
    return "🎨 **Graphics processor** - Handles visual output and gaming performance.";
  }

  private getScreenExplanation(screenSize?: string): string {
    if (!screenSize) return "";
    
    const size = screenSize.toLowerCase();
    if (size.includes("17")) {
      return "🖥️ **Large display** - Excellent for productivity, gaming, but less portable.";
    } else if (size.includes("15") || size.includes("16")) {
      return "⚖️ **Balanced size** - Good compromise between screen real estate and portability.";
    } else if (size.includes("14")) {
      return "💼 **Portable productivity** - Great balance of portability and usable screen space.";
    } else if (size.includes("13")) {
      return "🎒 **Ultra-portable** - Maximum portability, good for travel and mobility.";    }
    return "📱 **Display size** - Affects portability and visual workspace.";
  }

  private analyzeGamingPerformance(context: LaptopContext): {
    capability: string;
    rating: number;
    performance: string;
    gameExamples: string;
    recommendations: string;
    upgradeAdvice: string;
  } {
    const graphics = context.graphics?.toLowerCase() || "";
    const processor = context.processor?.toLowerCase() || "";
    const ram = context.ram?.toLowerCase() || "";

    let rating = 0;
    let capability = "";
    let performance = "";
    let gameExamples = "";
    let recommendations = "";
    let upgradeAdvice = "";

    // Analyze graphics performance
    if (graphics.includes("rtx 4080") || graphics.includes("rtx 4090")) {
      rating = 10;
      capability = "Flagship Gaming Beast";
      performance = "🚀 **Exceptional Performance:** Can handle any game at 4K Ultra settings with ray tracing.";
      gameExamples = `
• **Cyberpunk 2077:** 4K Ultra RT - 60+ FPS
• **Call of Duty MW2:** 4K Ultra - 120+ FPS  
• **Assassin's Creed Valhalla:** 4K Ultra - 80+ FPS
• **Fortnite:** 4K Epic RT - 100+ FPS`;
    } else if (graphics.includes("rtx 4070") || graphics.includes("rtx 3080")) {
      rating = 9;
      capability = "High-End Gaming Powerhouse";
      performance = "⚡ **Excellent Performance:** Perfect for 1440p Ultra and 4K High settings with ray tracing.";
      gameExamples = `
• **Cyberpunk 2077:** 1440p Ultra RT - 70+ FPS
• **Call of Duty MW2:** 1440p Ultra - 140+ FPS
• **Assassin's Creed Valhalla:** 1440p Ultra - 90+ FPS
• **Valorant:** 1080p Epic - 300+ FPS`;
    } else if (graphics.includes("rtx 4060") || graphics.includes("rtx 3070")) {
      rating = 8;
      capability = "Excellent Gaming Performance";
      performance = "🎮 **Great Performance:** Ideal for 1080p Ultra and 1440p High settings with good ray tracing.";
      gameExamples = `
• **Cyberpunk 2077:** 1080p Ultra RT - 80+ FPS
• **Call of Duty MW2:** 1080p Ultra - 160+ FPS
• **FIFA 24:** 1440p Ultra - 120+ FPS
• **CS:GO:** 1080p High - 300+ FPS`;
    } else if (graphics.includes("rtx 3060") || graphics.includes("rtx 4050")) {
      rating = 7;
      capability = "Solid Gaming Performance";
      performance = "✅ **Good Performance:** Perfect for 1080p High-Ultra settings, light 1440p gaming.";
      gameExamples = `
• **Cyberpunk 2077:** 1080p High - 60+ FPS
• **Call of Duty MW2:** 1080p High - 120+ FPS
• **GTA V:** 1080p Ultra - 100+ FPS
• **Valorant:** 1080p High - 250+ FPS`;
    } else if (graphics.includes("rtx 3050") || graphics.includes("gtx 1660")) {
      rating = 6;
      capability = "Entry-Level Gaming";
      performance = "🎯 **Decent Performance:** Good for 1080p Medium-High settings, esports games.";
      gameExamples = `
• **Cyberpunk 2077:** 1080p Medium - 45+ FPS
• **Call of Duty MW2:** 1080p Medium - 90+ FPS
• **GTA V:** 1080p High - 80+ FPS
• **League of Legends:** 1080p Ultra - 150+ FPS`;
    } else if (graphics.includes("gtx 1650") || graphics.includes("gtx 1050")) {
      rating = 5;
      capability = "Basic Gaming";
      performance = "⚠️ **Limited Performance:** 1080p Low-Medium settings, older games run better.";
      gameExamples = `
• **Cyberpunk 2077:** 1080p Low - 30+ FPS
• **Call of Duty MW2:** 1080p Low - 60+ FPS
• **GTA V:** 1080p Medium - 60+ FPS
• **CS:GO:** 1080p Medium - 120+ FPS`;
    } else if (graphics.includes("iris xe") || graphics.includes("radeon") && graphics.includes("integrated")) {
      rating = 3;
      capability = "Light Gaming Only";
      performance = "📱 **Basic Gaming:** Only esports titles and older games at low settings.";
      gameExamples = `
• **Cyberpunk 2077:** Not recommended
• **Valorant:** 1080p Low - 60+ FPS
• **League of Legends:** 1080p Medium - 80+ FPS
• **CS:GO:** 1080p Low - 80+ FPS`;
    } else if (graphics.includes("uhd") || graphics.includes("integrated")) {
      rating = 2;
      capability = "Not Suitable for Gaming";
      performance = "❌ **Poor Gaming Performance:** Only very light indie games and browser games.";
      gameExamples = `
• **Modern AAA Games:** Not playable
• **Valorant:** 720p Low - 30+ FPS
• **League of Legends:** 1080p Low - 40+ FPS
• **Browser Games:** Playable`;
    }

    // Adjust rating based on other components
    if (ram.includes("8gb") && rating > 5) {
      recommendations += "\n💡 **RAM Upgrade:** Consider upgrading to 16GB for better gaming performance.";
    } else if (ram.includes("4gb")) {
      rating = Math.max(1, rating - 2);
      recommendations += "\n⚠️ **Critical:** 4GB RAM is insufficient for modern gaming. 16GB upgrade essential.";
    }

    if (processor.includes("i3") || processor.includes("ryzen 3")) {
      if (rating > 6) {
        recommendations += "\n🖥️ **CPU Note:** Processor may bottleneck high-end graphics in CPU-intensive games.";
      }
    }

    // Generate upgrade advice
    if (rating <= 4) {
      upgradeAdvice = `
🔧 **Upgrade Recommendations:**
• **GPU Priority:** Consider RTX 3060/4060 or better for modern gaming
• **RAM:** Upgrade to 16GB for smooth performance  
• **Storage:** NVMe SSD for faster game loading
• **Alternative:** Consider a dedicated gaming laptop in ₹80,000+ range`;
    } else if (rating <= 6) {
      upgradeAdvice = `
⬆️ **Future-Proofing Suggestions:**
• **RAM:** 16GB if currently 8GB for better multitasking while gaming
• **Storage:** NVMe SSD for faster loading times
• **Monitor:** 144Hz display to maximize performance
• **Cooling:** Good laptop cooler for sustained performance`;
    } else {
      upgradeAdvice = `
🎯 **Optimization Tips:**
• **Settings:** You can push graphics settings higher
• **Ray Tracing:** Experiment with RT settings for better visuals
• **DLSS/FSR:** Use AI upscaling for better performance
• **Monitor:** Consider 1440p/4K monitor to match your GPU power`;
    }

    return {
      capability,
      rating: Math.max(1, Math.min(10, rating)),
      performance,
      gameExamples,
      recommendations,
      upgradeAdvice
    };
  }
}

export const geminiService = new GeminiService();
