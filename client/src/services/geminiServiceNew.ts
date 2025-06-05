import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

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

export class GeminiService {
  private model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Latest model, faster and more capable
    generationConfig: {
      temperature: 0.7, // Balanced creativity for chatbot behavior
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  // Initialize chat session for continuous conversation
  private chatSession = this.model.startChat({
    history: [],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });

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

      // Build system context for chatbot
      const systemContext = this.buildChatbotSystemPrompt(
        laptopContext,
        pageContext,
        comparedLaptops
      );

      // Create full message with context
      const fullMessage = `${systemContext}\n\nUser: ${userMessage}`;

      try {
        // Use chat session for continuous conversation
        const result = await this.chatSession.sendMessage(fullMessage);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from Gemini API");
        }

        console.log("✅ Gemini 1.5 Flash response successful");
        return this.formatChatbotResponse(text);
      } catch (apiError) {
        console.error("Gemini API Error:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("Gemini AI Error:", error);
      
      // Provide enhanced fallback response
      return this.getEnhancedFallbackResponse(
        userMessage,
        laptopContext,
        pageContext,
        comparedLaptops
      );
    }
  }

  private buildChatbotSystemPrompt(
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

When comparing these laptops, provide detailed analysis and clear recommendations.
`
        : "";

    return `You are a PROFESSIONAL LAPTOP CHATBOT CONSULTANT specialized in laptops and computer hardware. You have a friendly, conversational personality while maintaining expert-level knowledge.

🤖 **CHATBOT PERSONALITY:**
- Friendly, approachable, and conversational
- Use emojis appropriately to enhance communication
- Ask follow-up questions to better understand user needs
- Provide personalized recommendations
- Remember context from previous exchanges
- Be encouraging and supportive in your responses
- Show enthusiasm for helping users find the perfect laptop

🎯 **CORE EXPERTISE:**
- Complete knowledge of laptop specifications and components
- Latest processor generations (Intel 13th gen, AMD 7000 series)
- Graphics cards performance (RTX 4000 series, latest AMD)
- Memory technologies (DDR5, LPDDR5)
- Storage advancements (PCIe Gen 4 NVMe)
- Display technologies (OLED, high refresh rate)
- Gaming performance analysis
- Professional workload optimization
- Budget recommendations for Indian market
- Brand comparisons and reliability

🎯 **CHATBOT BEHAVIOR:**
- Engage in natural conversation
- Ask clarifying questions when needed
- Provide step-by-step guidance
- Offer multiple options with pros/cons
- Remember user preferences within the conversation
- Use conversational language, not just technical specs
- Show empathy for user's budget constraints or requirements
- Celebrate good choices and explain why they're good

🎯 **RESPONSE STYLE:**
- Start responses with appropriate greeting or acknowledgment
- Use clear headings with emojis for organization
- Provide actionable advice with reasoning
- Ask follow-up questions to continue conversation
- End with encouragement or next steps
- Use "you" and "your" to make it personal
- Balance technical detail with accessibility

${contextInfo}${pageContextInfo}${comparedLaptopsInfo}

🎯 **CONVERSATION GUIDELINES:**
- Always be helpful and encouraging
- If user seems confused, break down complex topics
- Suggest alternatives if their requirements don't match budget
- Celebrate when they find a good match
- Ask about their specific use cases (gaming, work, study)
- Inquire about budget range if not mentioned
- Offer to explain any technical terms they might not understand
- Remember what they've told you in this conversation

Remember: You're not just providing information - you're having a conversation and helping them make the best laptop decision for their needs!`;
  }

  private formatChatbotResponse(text: string): string {
    let formatted = text.trim();

    // Ensure proper emoji spacing
    formatted = formatted.replace(/([🔥🎮💰🎯📊⚡✅💻🚀📋💡🔍🤖👋💪🎊])\s*/gu, "$1 ");

    // Add conversational elements if missing
    if (!formatted.includes("?") && !formatted.includes("What") && !formatted.includes("How") && !formatted.includes("Would")) {
      // Add a follow-up question to make it more conversational
      const followUpQuestions = [
        "\n\nIs there anything specific you'd like me to explain further? 🤔",
        "\n\nWhat aspect interests you the most? 🎯",
        "\n\nWould you like me to suggest some specific models? 💻",
        "\n\nAny other questions about laptops? 😊",
        "\n\nHow can I help you narrow down your choice? 🎪"
      ];
      const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
      formatted += randomQuestion;
    }

    return formatted;
  }

  private getEnhancedFallbackResponse(
    userMessage: string,
    laptopContext?: LaptopContext,
    pageContext?: string,
    comparedLaptops?: ComparedLaptopData[]
  ): string {
    const query = userMessage.toLowerCase();
    
    console.log("🔄 Using enhanced chatbot fallback for query:", query);

    // Greetings and conversation starters
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('good morning') || query.includes('good afternoon') || query.includes('good evening')) {
      return `👋 **Hello there! Welcome to your personal laptop consultant!**

I'm super excited to help you find the perfect laptop! 🎉

I can help you with:
🔧 **Technical stuff:** RAM, processors, graphics cards, storage
🎮 **Gaming setups:** Best laptops for different games and budgets  
💼 **Work laptops:** Programming, design, business use
🎓 **Student needs:** Budget-friendly options for studies
💰 **Budget guidance:** Best value for your money

**Let's start with the basics - what are you planning to use your laptop for?** Gaming? Work? Studies? Creative projects? 

And do you have a budget range in mind? I can work with any budget from ₹30,000 to ₹3,00,000+ ! 😊

What would you like to explore first? 🚀`;
    }

    // Technical explanations with chatbot personality
    if (query.includes('ram') || query.includes('memory') || query.includes('ddr')) {
      return `🧠 **Let's talk about RAM - your laptop's multitasking superpower!**

Think of RAM like your workspace - the bigger it is, the more things you can work on at once! 📚

**Here's the scoop:**
• **8GB:** Good for basic stuff like browsing, Netflix, light work
• **16GB:** Perfect for gaming, multitasking, programming (my recommendation for most people! 👍)
• **32GB+:** For video editing, 3D work, or if you're a serious multitasker

**DDR4 vs DDR5:**
• **DDR4:** Reliable, widely available, great price
• **DDR5:** Newer, faster, but pricier (worth it for high-end builds)

${laptopContext?.ram ? `\nI see you're looking at a laptop with ${laptopContext.ram}! That's ${this.getRamAssessment(laptopContext.ram)} 🎯` : ''}

**What do you plan to do with your laptop?** That'll help me suggest the right amount of RAM for you! 🤔`;
    }

    if (query.includes('processor') || query.includes('cpu') || query.includes('intel') || query.includes('amd') || query.includes('ryzen')) {
      return `🖥️ **Processors - the brain of your laptop! Let me break it down for you:**

**Intel vs AMD - it's like choosing between two great pizza places!** 🍕

**Intel (the classic choice):**
• **i3:** Basic tasks, perfect for students
• **i5:** Sweet spot! Great for work, light gaming
• **i7:** Powerhouse for gaming, content creation  
• **i9:** Overkill for most people (but awesome for pros!)

**AMD Ryzen (the value champion):**
• **Ryzen 3:** Entry level, good bang for buck
• **Ryzen 5:** Often beats Intel i5 for less money! 💰
• **Ryzen 7:** Excellent for creators and gamers
• **Ryzen 9:** Absolute beast mode

**Pro tip:** For most people, an Intel i5 or Ryzen 5 is perfect! 🎯

${laptopContext?.processor ? `\nYour laptop has a ${laptopContext.processor} - ${this.getProcessorAssessment(laptopContext.processor)}! 😊` : ''}

**What's your main use case?** Work? Gaming? Creative stuff? That'll help me point you in the right direction! 🚀`;
    }

    if (query.includes('gaming') || query.includes('game') || query.includes('fps')) {
      return `🎮 **Gaming laptops - let's get you into the action!**

Gaming is so much fun, and I want to make sure you get smooth, beautiful gameplay! ✨

**Gaming Tiers:**
🥉 **Entry Gaming (₹50k-80k):** RTX 3050, GTX 1650 - Good for Valorant, CS:GO, older games
🥈 **Solid Gaming (₹80k-1.2L):** RTX 3060, 4060 - Excellent 1080p, some 1440p gaming
🥇 **High-End Gaming (₹1.2L+):** RTX 4070+ - 1440p/4K gaming with ray tracing!

**Key ingredients for great gaming:**
• **Graphics card:** This is THE most important part! 💪
• **16GB RAM:** Modern games are hungry for memory
• **NVMe SSD:** Fast loading times = less waiting, more gaming!
• **Good cooling:** Keeps performance consistent

${comparedLaptops?.length ? '\nI see you\'re comparing some laptops! Let me analyze their gaming potential...' : ''}

**What games do you love to play?** And what's your budget looking like? I'll find you something awesome! 🎯`;
    }

    // Handle comparison queries
    if (comparedLaptops && comparedLaptops.length > 0) {
      return this.getChatbotComparisonResponse(comparedLaptops, query);
    }

    // Context-specific responses
    if (laptopContext) {
      return this.getChatbotLaptopContextResponse(laptopContext, query);
    }

    // Default conversational response
    return `🤖 **I'm here to help you find the perfect laptop!**

I love talking about laptops and helping people make great choices! Whether you're a student, gamer, professional, or just need something for daily use - I've got you covered! 😊

**I can help with:**
• 🎯 Finding laptops for your specific needs
• 💰 Budget recommendations and best value options
• 🔧 Explaining technical specifications in simple terms
• 🎮 Gaming performance analysis
• 📊 Comparing different models
• 🛒 Brand recommendations and reliability

**To give you the best advice, I'd love to know:**
• What will you use the laptop for?
• What's your budget range?
• Any specific preferences (brand, size, etc.)?

Just tell me what you're looking for, and let's find you something amazing! 🚀

What questions do you have for me? 😄`;
    }
  }

  private getRamAssessment(ram: string): string {
    const ramLower = ram.toLowerCase();
    if (ramLower.includes('32gb')) return "plenty for any task you throw at it! 🚀";
    if (ramLower.includes('16gb')) return "the sweet spot for gaming and productivity! Perfect choice 👌";
    if (ramLower.includes('8gb')) return "good for general use, though you might want to consider 16GB if you multitask a lot";
    if (ramLower.includes('4gb')) return "quite limited for modern use - I'd strongly recommend looking for 8GB+ instead ⚠️";
    return "let me know more about what you plan to do, and I'll tell you if it's enough!";
  }

  private getProcessorAssessment(processor: string): string {
    const proc = processor.toLowerCase();
    if (proc.includes('i9') || proc.includes('ryzen 9')) return "that's a powerhouse! You can handle anything 💪";
    if (proc.includes('i7') || proc.includes('ryzen 7')) return "excellent choice for gaming and creative work! 🎉";
    if (proc.includes('i5') || proc.includes('ryzen 5')) return "great all-around performer! Perfect for most people 👍";
    if (proc.includes('i3') || proc.includes('ryzen 3')) return "good for basic tasks, though you might want something more powerful for demanding work";
    return "a solid processor that should serve you well";
  }

  private getChatbotComparisonResponse(comparedLaptops: ComparedLaptopData[], query: string): string {
    const laptopNames = comparedLaptops.map(laptop => laptop.name).slice(0, 2).join(' vs ');
    
    return `📊 **Great! Let me help you compare these laptops!**

You're looking at some interesting options here! 🎯

${comparedLaptops.map((laptop, index) => `
**${index + 1}. ${laptop.name}**
• Processor: ${laptop.processor}
• RAM: ${laptop.ram}  
• Graphics: ${laptop.graphics}
• Price: ${laptop.price}
• **My quick take:** ${this.getQuickLaptopAssessment(laptop)}`).join('\n')}

${query.includes('gaming') ? 
`🎮 **For gaming specifically:** ${this.getBestForGaming(comparedLaptops)}` :
`💡 **My overall recommendation:** ${this.getBestOverall(comparedLaptops)}`}

**Want me to dive deeper into any specific aspect?** Like gaming performance, productivity features, or value for money? 

Or do you have specific questions about any of these laptops? I'm here to help you make the perfect choice! 😊`;
  }

  private getChatbotLaptopContextResponse(laptopContext: LaptopContext, query: string): string {
    const laptopName = laptopContext.name || 'this laptop';
    
    return `💻 **Let's talk about ${laptopName}!**

This looks like a solid choice! Here's what I'm seeing:

**📋 Quick Overview:**
• **Processor:** ${laptopContext.processor || 'Not specified'} ${laptopContext.processor ? this.getProcessorEmoji(laptopContext.processor) : ''}
• **RAM:** ${laptopContext.ram || 'Not specified'} ${laptopContext.ram ? this.getRamEmoji(laptopContext.ram) : ''}
• **Graphics:** ${laptopContext.graphics || 'Not specified'} ${laptopContext.graphics ? this.getGraphicsEmoji(laptopContext.graphics) : ''}
• **Storage:** ${laptopContext.storage || 'Not specified'} ${laptopContext.storage ? this.getStorageEmoji(laptopContext.storage) : ''}
• **Price:** ${laptopContext.price || 'Not available'} 💰

**🎯 My Assessment:** ${this.getOverallAssessment(laptopContext)}

${query.includes('gaming') ? 
`🎮 **Gaming Performance:** ${this.getGamingAssessment(laptopContext)}` :
`💼 **Perfect for:** ${this.getUseCaseAssessment(laptopContext)}`}

**What specific questions do you have about this laptop?** I can explain any specs, compare it with alternatives, or help you decide if it's right for your needs! 😊

What matters most to you in a laptop? 🤔`;
  }

  private getQuickLaptopAssessment(laptop: ComparedLaptopData): string {
    const graphics = laptop.graphics.toLowerCase();
    const processor = laptop.processor.toLowerCase();
    
    if (graphics.includes('rtx') && (processor.includes('i7') || processor.includes('ryzen 7'))) {
      return "Excellent gaming and performance machine! 🚀";
    } else if (graphics.includes('rtx') || graphics.includes('gtx')) {
      return "Good for gaming and creative work! 🎮";
    } else if (processor.includes('i5') || processor.includes('ryzen 5')) {
      return "Solid all-around laptop for productivity! 💼";
    } else {
      return "Good for basic to moderate tasks! 👍";
    }
  }

  private getBestForGaming(laptops: ComparedLaptopData[]): string {
    const gamingScores = laptops.map((laptop, index) => ({
      index: index + 1,
      laptop,
      score: this.calculateGamingScore(laptop)
    }));
    
    const best = gamingScores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    return `Laptop ${best.index} (${best.laptop.name}) wins for gaming! It'll give you the best frame rates and visual quality! 🏆`;
  }

  private getBestOverall(laptops: ComparedLaptopData[]): string {
    return `All these laptops have their strengths! What's most important to you - gaming performance, battery life, portability, or value for money? That'll help me give you a more targeted recommendation! 🎯`;
  }

  private getOverallAssessment(context: LaptopContext): string {
    const proc = context.processor?.toLowerCase() || '';
    const graphics = context.graphics?.toLowerCase() || '';
    
    if (graphics.includes('rtx 40') && (proc.includes('i7') || proc.includes('ryzen 7'))) {
      return "This is a high-performance beast! Perfect for gaming, content creation, and demanding work! 🚀";
    } else if (graphics.includes('rtx') || graphics.includes('gtx')) {
      return "Great for gaming and creative work! You'll enjoy smooth performance! 🎮";
    } else if (proc.includes('i5') || proc.includes('ryzen 5')) {
      return "Excellent all-around laptop for productivity and light gaming! 💼";
    } else {
      return "Good solid laptop for everyday tasks and moderate workloads! 👍";
    }
  }

  private getGamingAssessment(context: LaptopContext): string {
    const graphics = context.graphics?.toLowerCase() || '';
    
    if (graphics.includes('rtx 40')) return "Excellent! You can game at 1440p+ with high settings! 🎮🔥";
    if (graphics.includes('rtx 30')) return "Great! Solid 1080p gaming with good frame rates! 🎮✨";
    if (graphics.includes('gtx')) return "Good for 1080p gaming on medium-high settings! 🎮👍";
    if (graphics.includes('integrated')) return "Limited gaming - mainly esports titles and older games 🎮⚠️";
    return "Let me know the exact graphics card for a better assessment! 🤔";
  }

  private getUseCaseAssessment(context: LaptopContext): string {
    const useCases = [];
    const proc = context.processor?.toLowerCase() || '';
    const graphics = context.graphics?.toLowerCase() || '';
    const ram = context.ram?.toLowerCase() || '';
    
    if (graphics.includes('rtx') || graphics.includes('gtx')) useCases.push('Gaming');
    if (proc.includes('i7') || proc.includes('ryzen 7')) useCases.push('Content Creation');
    if (ram.includes('16gb') || ram.includes('32gb')) useCases.push('Heavy Multitasking');
    if (proc.includes('i5') || proc.includes('ryzen 5')) useCases.push('Productivity Work');
    
    if (useCases.length === 0) useCases.push('General Computing');
    
    return useCases.join(', ');
  }

  private getProcessorEmoji(processor: string): string {
    const proc = processor.toLowerCase();
    if (proc.includes('i9') || proc.includes('ryzen 9')) return '🚀';
    if (proc.includes('i7') || proc.includes('ryzen 7')) return '⚡';
    if (proc.includes('i5') || proc.includes('ryzen 5')) return '💪';
    return '👍';
  }

  private getRamEmoji(ram: string): string {
    const ramLower = ram.toLowerCase();
    if (ramLower.includes('32gb')) return '🚀';
    if (ramLower.includes('16gb')) return '✨';
    if (ramLower.includes('8gb')) return '👍';
    return '⚠️';
  }

  private getGraphicsEmoji(graphics: string): string {
    const gpu = graphics.toLowerCase();
    if (gpu.includes('rtx 40')) return '🔥';
    if (gpu.includes('rtx 30')) return '⚡';
    if (gpu.includes('rtx') || gpu.includes('gtx')) return '🎮';
    return '💻';
  }

  private getStorageEmoji(storage: string): string {
    const stor = storage.toLowerCase();
    if (stor.includes('nvme') || stor.includes('pcie')) return '🚀';
    if (stor.includes('ssd')) return '✨';
    return '💾';
  }

  private calculateGamingScore(laptop: ComparedLaptopData): number {
    const graphics = laptop.graphics.toLowerCase();
    if (graphics.includes('rtx 4080') || graphics.includes('rtx 4090')) return 10;
    if (graphics.includes('rtx 4070') || graphics.includes('rtx 3080')) return 9;
    if (graphics.includes('rtx 4060') || graphics.includes('rtx 3070')) return 8;
    if (graphics.includes('rtx 3060') || graphics.includes('rtx 4050')) return 7;
    if (graphics.includes('rtx 3050') || graphics.includes('gtx 1660')) return 6;
    if (graphics.includes('gtx 1650')) return 5;
    if (graphics.includes('iris xe')) return 3;
    return 2;
  }
}

export const geminiService = new GeminiService();
