// Using the newer Gemini 2.0 Flash model with REST API for chatbot behavior
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

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

// Conversation message interface for chatbot behavior
interface ConversationMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export class GeminiChatbotService {
  private conversationHistory: ConversationMessage[] = [];
  private readonly MAX_HISTORY_LENGTH = 10;

  // Clear conversation history (useful for new sessions)
  clearHistory(): void {
    this.conversationHistory = [];
    console.log("🔄 Conversation history cleared");
  }

  // Get conversation history length
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }

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

      // Build conversation context
      const systemPrompt = this.buildChatbotSystemPrompt(
        laptopContext,
        pageContext,
        comparedLaptops
      );

      // Create conversation contents for Gemini 2.0 Flash
      const contents = this.buildConversationContents(systemPrompt, userMessage);

      // Make API call to Gemini 2.0 Flash
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8, // Slightly higher for more conversational responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            stopSequences: [],
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response format from Gemini API");
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Add messages to conversation history
      this.addToHistory("user", userMessage);
      this.addToHistory("model", aiResponse);
      
      console.log("✅ Gemini 2.0 Flash API response successful");
      console.log("💬 Conversation history length:", this.conversationHistory.length);
      
      return this.formatResponse(aiResponse);

    } catch (error) {
      console.error("Gemini AI Error:", error);
      // Provide more specific error information for debugging
      if (error instanceof Error) {
        if (error.message.includes("API_KEY") || error.message.includes("403")) {
          console.error("API Key issue or forbidden:", error.message);
        } else if (error.message.includes("fetch") || error.message.includes("network")) {
          console.error("Network error:", error.message);
        } else if (error.message.includes("quota") || error.message.includes("rate") || error.message.includes("429")) {
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
  }
  private addToHistory(role: "user" | "model", content: string): void {
    this.conversationHistory.push({ 
      role, 
      parts: [{ text: content }] 
    });
    
    // Keep only the last MAX_HISTORY_LENGTH messages
    if (this.conversationHistory.length > this.MAX_HISTORY_LENGTH) {
      this.conversationHistory = this.conversationHistory.slice(-this.MAX_HISTORY_LENGTH);
    }
  }

  private buildConversationContents(systemPrompt: string, userMessage: string): ConversationMessage[] {
    const contents: ConversationMessage[] = [];
    
    // Add system prompt as the first message if history is empty
    if (this.conversationHistory.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }]
      });
      contents.push({
        role: "model", 
        parts: [{ text: "Hello! I'm your expert laptop consultant. I can help you with technical specifications, recommendations, comparisons, and any laptop-related questions you have. What would you like to know?" }]
      });
    }

    // Add conversation history (excluding the current message)
    contents.push(...this.conversationHistory);

    // Add current user message
    contents.push({
      role: "user", 
      parts: [{ text: userMessage }]
    });

    return contents;
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

When answering questions about comparison, focus specifically on these ${
            comparedLaptops.length
          } laptops above. Provide detailed comparative analysis, highlight differences, and make specific recommendations based on use cases.

IMPORTANT: When asked "which is best" or "which laptop is the best overall choice", provide a DIRECT answer with your recommendation, followed by a brief explanation. Do not ask follow-up questions first - answer the question directly and then offer additional help.
`
        : "";    return `You are a CONVERSATIONAL LAPTOP EXPERT CHATBOT named "LaptopGuru" with deep knowledge about laptop hardware, specifications, and technology. You maintain conversation context and provide helpful, engaging responses.

CRITICAL IDENTITY RULES - NEVER BREAK CHARACTER:
- You are LaptopGuru, a specialized laptop expert assistant built specifically for this platform
- You are NOT Google AI, Gemini, Bard, Claude, ChatGPT, or any other AI model
- NEVER mention being "powered by Google AI" or any other AI company
- NEVER discuss your training data, datasets, or AI technology behind you
- You are a custom-built laptop consultant, not a general AI assistant
- If asked about your identity, training, or how you work, respond: "I'm LaptopGuru, your dedicated laptop expert! I was created specifically to help people find the perfect laptops. My expertise comes from years of research in laptop technology and hardware. What laptop questions can I help you with?"
- Redirect ALL identity questions back to laptop advice
- Focus ONLY on being helpful with laptop advice, never discuss AI technology
- If pressed about your nature, simply say: "I prefer talking about laptops rather than myself! What can I help you find today?"

🤖 **CHATBOT PERSONALITY:**
- Friendly, helpful, and enthusiastic about technology
- Maintain conversation flow and remember previous context
- Ask clarifying questions when needed to provide better help
- Use emojis and formatting to make responses engaging
- Provide both technical depth and practical advice
- Adapt your communication style based on user's technical level

🎯 **CORE EXPERTISE:**
- Complete laptop hardware knowledge (CPU, GPU, RAM, Storage, Display)
- Performance analysis and benchmarking
- Gaming performance and optimization
- Programming and professional workload requirements
- Budget recommendations across all price ranges
- Brand comparison and reliability insights
- Indian market pricing and availability
- Future-proofing and upgrade advice
- Troubleshooting and technical support

🎯 **CONVERSATIONAL GUIDELINES:**
- Remember previous messages in our conversation
- Build on previous topics and questions
- Ask follow-up questions to better understand user needs
- Provide personalized recommendations based on conversation history
- Use conversational language while maintaining technical accuracy
- Explain complex concepts in simple terms when appropriate
- Offer multiple options and explain trade-offs
- Suggest related topics the user might be interested in

${contextInfo}${pageContextInfo}${comparedLaptopsInfo}

🎯 **KNOWLEDGE AREAS:**
- CPU: Intel vs AMD, generations, performance characteristics
- GPU: Gaming performance, ray tracing, content creation
- RAM: DDR4 vs DDR5, capacity planning, dual-channel benefits
- Storage: HDD vs SSD vs NVMe, performance impact
- Display: Resolutions, refresh rates, panel technologies
- Battery: Capacity, efficiency, charging technologies
- Thermal: Cooling solutions, thermal management
- Connectivity: Ports, wireless standards, modern interfaces

💬 **RESPONSE STYLE:**
- Use clear headings with relevant emojis
- Provide specific technical details when helpful
- Include practical examples and real-world scenarios
- Use bullet points for easy reading
- **Bold text** for important points
- End with engaging questions or offers for further help
- Maintain conversation flow and context

Remember: You're having a conversation, not just answering isolated questions. Build rapport, remember context, and help users discover what they really need!`;
  }

  private formatResponse(text: string): string {
    // Clean up and format the AI response for better chatbot presentation
    let formatted = text.trim();    // Ensure proper spacing after emojis - simplified pattern
    const emojiPattern = /([\u{1F300}-\u{1F9FF}])\s*/gu;
    formatted = formatted.replace(emojiPattern, "$1 ");

    // Add proper line breaks and formatting
    formatted = formatted.replace(/\n\n/g, "\n\n");
    
    // Ensure responses end with engagement (question or helpful offer)
    if (!formatted.match(/[?!][\s]*$/)) {
      formatted += "\n\nWhat else would you like to know about laptops? 🤔";
    }

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

    // Handle identity questions first
    if (query.includes('who are you') || query.includes('what are you') || 
        query.includes('are you gemini') || query.includes('are you bard') || 
        query.includes('are you google') || query.includes('are you ai') ||
        query.includes('powered by') || query.includes('trained on') ||
        query.includes('google ai') || query.includes('your training')) {
      return `👋 **Hi there! I'm LaptopGuru, your dedicated laptop expert!**

I was created specifically to help people find the perfect laptops and understand laptop technology. My expertise comes from years of research in laptop hardware, specifications, and the tech industry.

🎯 **What I'm here for:**
• Help you choose the right laptop for your needs
• Explain technical specs in simple terms  
• Compare different models and brands
• Answer any laptop-related questions you have

I prefer talking about laptops rather than myself! 😊

**So, what brings you here today?** Are you:
- Shopping for a new laptop? 🛒
- Trying to understand specs? 📊
- Need help comparing options? ⚖️
- Have technical questions? 🔧

Let's find you the perfect laptop! 🚀`;
    }

    // Conversational greetings
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('good morning') || query.includes('good afternoon')) {
      return `👋 **Hello! I'm your laptop expert assistant!**

Great to meet you! I'm here to help you with everything laptop-related. I can:

🔧 **Explain Technical Specs:**
• Break down processors, RAM, storage, and graphics
• Compare performance between different components
• Help you understand what specs you actually need

🎯 **Provide Recommendations:**
• Gaming laptops for any budget
• Programming and development setups  
• Student and productivity laptops
• Creative workstation recommendations

💬 **Have Real Conversations:**
• I remember our chat history
• Ask me follow-up questions
• I'll learn about your specific needs

**What brings you here today?** Are you:
- Looking for a new laptop? 🔍
- Trying to understand specs? 📊
- Comparing different models? ⚖️
- Having technical issues? 🔧

Just tell me what's on your mind! 😊`;
    }

    // Enhanced knowledge base with conversational responses
    const laptopKnowledgeBase = {
      ram: {
        keywords: ['ram', 'memory', 'ddr', 'ddr4', 'ddr5', 'gb memory'],
        response: `🧠 **Let's talk about RAM - your laptop's memory!**

Think of RAM as your laptop's workspace - the bigger it is, the more things you can have open and working smoothly at once.

**Here's what you need to know:**

**DDR Types:**
• **DDR4:** The reliable standard - fast enough for most tasks
• **DDR5:** The newest tech - even faster, but more expensive
• **LPDDR:** Power-efficient versions for ultrabooks

**How much do YOU need?**
• **8GB:** Perfect for basic tasks - web, email, documents
• **16GB:** The sweet spot for most people - gaming, multitasking, creativity
• **32GB+:** Overkill for most, but great for video editing and heavy work

**Pro Tips:**
💡 Dual-channel (2 sticks) is faster than single-channel
💡 You can often upgrade RAM later, but check if it's soldered first!

**What do you plan to use your laptop for?** That'll help me recommend the right amount! 🤔`
      },

      storage: {
        keywords: ['ssd', 'hdd', 'storage', 'nvme', 'hard drive', 'disk'],
        response: `💾 **Storage talk - where all your stuff lives!**

This is one area where the upgrade makes a HUGE difference in daily use!

**The Storage Family:**
• **HDD:** Old school spinning drives - cheap but slow 🐌
• **SATA SSD:** Solid state - 10x faster than HDD! ⚡
• **NVMe SSD:** The speed demon - boots Windows in 10 seconds! 🚀

**Real-world impact:**
- **Boot time:** HDD = grab coffee ☕, SSD = instant on! 
- **App loading:** HDD = wait and wait, SSD = click and go!
- **File transfers:** NVMe moves gigabytes in seconds

**How much space?**
• **256GB:** Bare minimum (fills up quick!)
• **512GB:** Comfortable for most people
• **1TB+:** For gamers, content creators, digital hoarders 😄

**My honest advice:** Get an SSD no matter what. It's the single biggest performance upgrade you'll feel every day!

**Are you planning to store lots of games, photos, or videos?** 📸🎮`
      },

      gaming: {
        keywords: ['gaming', 'game', 'fps', 'esports', 'valorant', 'csgo', 'pubg'],
        response: `🎮 **Gaming laptops - let's find your perfect gaming setup!**

Gaming is where laptop specs really matter, so let's break this down:

**Budget Gaming (₹50k-80k):**
Perfect for: Valorant, CS:GO, League of Legends, older AAA games
• GPU: RTX 3050, GTX 1650 (1080p medium-high settings)
• CPU: i5 or Ryzen 5
• RAM: 16GB is ideal, 8GB minimum

**Serious Gaming (₹80k-1.2L):**
Perfect for: Modern AAA games, streaming, competitive gaming
• GPU: RTX 3060/4060 (1080p ultra, some 1440p)
• CPU: i5/i7 or Ryzen 5/7
• Must-have: 144Hz display for competitive edge!

**Gaming Beast Mode (₹1.2L+):**
Perfect for: 4K gaming, ray tracing, future-proofing
• GPU: RTX 3070/4070+ (1440p/4K ultra settings)
• CPU: i7/i9 or Ryzen 7/9
• 32GB RAM for streaming + gaming

**Quick question:** What games do you love playing? And what's your budget looking like? This will help me point you in the right direction! 🎯`
      },

      programming: {
        keywords: ['coding', 'programming', 'development', 'software', 'web development'],
        response: `💻 **Programming laptops - let's build your code machine!**

As a fellow developer (I assume! 😉), here's what really matters for coding:

**The Programming Must-Haves:**
• **16GB RAM minimum** - IDEs are hungry beasts
• **Fast SSD** - compiling and git operations will thank you
• **Good CPU** - i5/Ryzen 5 minimum, i7/Ryzen 7 for bigger projects
• **Decent screen** - your eyes will spend HOURS here

**By Development Type:**

**Web Development:**
• 16GB RAM, any recent i5, SSD
• Multiple browsers + IDE + local servers = RAM usage

**Mobile Development:**
• 32GB RAM (Android Studio is a memory monster!)
• Fast CPU for emulators and building

**Data Science/ML:**
• 32GB+ RAM for big datasets
• NVIDIA GPU for training models (RTX 3060+)

**Game Development:**
• Similar to gaming laptops - you need to test what you build!

**Pro developer tips:**
✅ Get a laptop with good Linux support if you're into that
✅ External monitor support is CRUCIAL
✅ Excellent keyboard matters for long coding sessions

**What kind of development do you do?** And any specific tools you love/hate? 🤓`
      }
    };

    // Check for specific technical terms with conversational responses
    for (const [, data] of Object.entries(laptopKnowledgeBase)) {
      if (data.keywords.some(keyword => query.includes(keyword))) {
        return data.response;
      }
    }

    // Handle comparison queries
    if (comparedLaptops && comparedLaptops.length > 0) {
      const laptopNames = comparedLaptops.map(laptop => laptop.name).join(' vs ');
      return `📊 **Let's compare these laptops: ${laptopNames}**

I can see you're looking at ${comparedLaptops.length} different options - smart move to compare before buying! 

Here's what I can help you figure out:
🎯 **Which one's best for YOUR needs?** (gaming, work, study, etc.)
💰 **Which offers the best value for money?**
🔍 **What are the key differences between them?**
⚡ **Performance comparison for specific tasks**

**What's your main use case?** Are you:
- Gaming enthusiast? 🎮
- Student or professional? 💼  
- Content creator? 🎥
- Just need something reliable? 💻

Tell me more about how you'll use it, and I'll give you my honest recommendation! 😊`;
    }

    // Context-specific responses
    if (laptopContext) {
      const laptopName = laptopContext.name || 'this laptop';
      return `💫 **Ah, you're looking at the ${laptopName}!**

Let me tell you what I see:
• **Processor:** ${laptopContext.processor || 'Not specified'}
• **RAM:** ${laptopContext.ram || 'Not specified'}  
• **Storage:** ${laptopContext.storage || 'Not specified'}
• **Graphics:** ${laptopContext.graphics || 'Not specified'}
• **Screen:** ${laptopContext.screenSize || 'Not specified'}
• **Price:** ${laptopContext.price || 'Not available'}

**What would you like to know about this laptop?** I can:
- Explain what these specs mean in real-world terms 📊
- Tell you if it's good for gaming, work, or study 🎯
- Compare it with similar alternatives 🔍
- Give you the honest pros and cons 💭
- Suggest if it's worth the price 💰

**What specific questions do you have about it?** 🤔`;
    }

    // Default conversational response
    return `🤖 **I'm here to help with anything laptop-related!**

I can chat with you about:

**🔍 Technical Stuff:**
• Explain specs in simple terms
• Compare processors, graphics cards, etc.
• Help you understand what you actually need

**🎯 Recommendations:**
• Find the perfect laptop for your budget
• Gaming, work, study, or creative setups
• Brand comparisons and reliability insights

**💬 Just Ask Me:**
• "What's a good gaming laptop under 80k?"
• "Should I get 16GB or 32GB RAM?"
• "What's the difference between these processors?"
• "Is this laptop good for programming?"

**What's on your mind?** I'm genuinely curious what brings you here today! 😊

*Don't worry if you're not super technical - I love explaining complex stuff in simple terms!* 🎯`;
  }
}

export const geminiChatbotService = new GeminiChatbotService();
