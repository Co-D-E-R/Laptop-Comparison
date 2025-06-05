import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTechAssistant } from "../../contexts/TechAssistantContext";
import { useCompare } from "../../hooks/useCompare";
import { geminiService } from "../../services/geminiService";
import type {
  LaptopContext,
  ComparedLaptopData,
} from "../../services/geminiService";
import type { Message } from "../../types/techAssistant";
import "./TechAssistant.css";

type TechAssistantProps = Record<string, never>;

// Page-specific configuration
interface PageConfig {
  title: string;
  status: string;
  welcomeMessage: string;
  quickActions: Array<{
    label: string;
    prompt: string;
    icon: string;
  }>;
}

const TechAssistant: React.FC<TechAssistantProps> = () => {
  const {
    currentLaptop,
    sharedMessages,
    addMessage,
    clearMessages,
    hasShownWelcome,
    setHasShownWelcome,
  } = useTechAssistant();
  const { comparedLaptops } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const REQUEST_THROTTLE_MS = 1000; // Minimum 1 second between requests

  // Get page-specific configuration
  const getPageConfig = useCallback((): PageConfig => {
    const pathname = location.pathname;

    if (pathname === "/" || pathname === "/home") {
      return {
        title: "Home Explorer",
        status: "Ready to help you discover laptops",
        welcomeMessage: `Hi! I'm your Laptop Discovery Assistant. I can help you explore our collection, find recommendations based on your needs, or answer any questions about laptops. ${
          currentLaptop
            ? `I see you're interested in the ${
                currentLaptop.specs?.head || "laptop"
              } - I can tell you more about it!`
            : "What kind of laptop are you looking for today?"
        }`,
        quickActions: [
          {
            label: "🏆 Recommendations",
            prompt: "Recommend the best laptops for my needs",
            icon: "🎯",
          },
          {
            label: "💡 Popular Picks",
            prompt: "What are the most popular laptops right now?",
            icon: "🌟",
          },
          {
            label: "💰 Budget Options",
            prompt: "Show me good budget laptop options",
            icon: "💰",
          },
          {
            label: "🔍 Help Me Choose",
            prompt: "Help me choose the right laptop for my requirements",
            icon: "❓",
          },
        ],
      };
    }

    if (pathname === "/search") {
      return {
        title: "Search Assistant",
        status: "Helping you find the perfect laptop",
        welcomeMessage:
          "I'm here to help you navigate our laptop search! I can explain specifications, suggest filters, help you compare options, or guide you to the perfect laptop based on your needs.",
        quickActions: [
          {
            label: "🔍 Filter Guide",
            prompt: "Help me understand what filters to use for my needs",
            icon: "⚙️",
          },
          {
            label: "⚖️ Compare Guide",
            prompt: "How should I compare these laptop options?",
            icon: "🆚",
          },
          {
            label: "💸 Price Analysis",
            prompt: "Explain the price differences between these laptops",
            icon: "📊",
          },
          {
            label: "🎯 Narrow Results",
            prompt: "Help me narrow down these search results",
            icon: "🎪",
          },
        ],
      };
    }

    if (pathname.startsWith("/laptop/")) {
      const laptopName =
        currentLaptop?.specs?.head || currentLaptop?.brand || "this laptop";
      return {
        title: "Laptop Expert",
        status: "Analyzing laptop specifications",
        welcomeMessage: `I'm here to help you understand everything about ${laptopName}! I can explain specifications, analyze performance for different use cases, compare with similar models, or help you decide if it's right for you.`,
        quickActions: [
          {
            label: "📋 Explain Specs",
            prompt: "Explain this laptop's specifications in simple terms",
            icon: "📝",
          },
          {
            label: "🎮 Gaming Check",
            prompt: "Is this laptop good for gaming?",
            icon: "🎮",
          },
          {
            label: "💼 Work Analysis",
            prompt: "How is this laptop for work and productivity?",
            icon: "💻",
          },
          {
            label: "🆚 Find Similar",
            prompt: "Find similar laptops to compare with this one",
            icon: "🔄",
          },
        ],
      };
    }

    if (pathname === "/compare") {
      const compareCount = comparedLaptops.length;
      return {
        title: "Comparison Expert",
        status: `Analyzing ${compareCount} laptop${
          compareCount !== 1 ? "s" : ""
        }`,
        welcomeMessage:
          compareCount > 0
            ? `I can help you analyze and compare these ${compareCount} laptops! I'll explain the differences, highlight pros and cons, and help you choose the best option for your needs.`
            : "I'm here to help you compare laptops! Add some laptops to your comparison and I'll help you analyze the differences and choose the best option.",
        quickActions: [
          {
            label: "🆚 Key Differences",
            prompt: "What are the key differences between these laptops?",
            icon: "🔍",
          },
          {
            label: "👑 Best Overall",
            prompt: "Which laptop is the best overall choice?",
            icon: "🏆",
          },
          {
            label: "💰 Best Value",
            prompt: "Which laptop offers the best value for money?",
            icon: "💡",
          },
          {
            label: "🎯 For My Needs",
            prompt: "Which laptop is best for my specific needs?",
            icon: "🎪",
          },
        ],
      };
    }

    if (pathname === "/tech-assistant") {
      return {
        title: "AI Laptop Consultant",
        status: "Full consultation mode",
        welcomeMessage:
          "Welcome to the full Tech Assistant experience! I'm your personal laptop consultant with deep knowledge of specifications, market trends, and user needs. Ask me anything about laptops!",
        quickActions: [
          {
            label: "🎓 Learn Specs",
            prompt: "Teach me about laptop specifications",
            icon: "📚",
          },
          {
            label: "🔬 Deep Analysis",
            prompt: "Give me a detailed analysis of current laptop market",
            icon: "🔍",
          },
          {
            label: "🎯 Perfect Match",
            prompt: "Help me find my perfect laptop match",
            icon: "💫",
          },
          {
            label: "🚀 Future Trends",
            prompt: "What are the latest trends in laptop technology?",
            icon: "🔮",
          },
        ],
      };
    }

    // Default configuration
    return {
      title: "Tech Assistant",
      status: "Ready to help with laptops",
      welcomeMessage:
        "Hi! I'm your Tech Assistant. I can help with questions about laptop specs, recommendations, and comparisons!",
      quickActions: [
        {
          label: "📋 Specs Help",
          prompt: "Help me understand laptop specifications",
          icon: "📝",
        },
        { label: "🎮 Gaming", prompt: "Is this good for gaming?", icon: "🎮" },
        { label: "💰 Price", prompt: "What's the price analysis?", icon: "💰" },
        {
          label: "🎯 Similar",
          prompt: "Recommend similar laptops",
          icon: "🔄",
        },
      ],
    };
  }, [location.pathname, currentLaptop, comparedLaptops.length]); // Convert compared laptops to ComparedLaptopData format
  const prepareComparedLaptopsData = useCallback((): ComparedLaptopData[] => {
    return comparedLaptops.map((laptop) => {
      // Helper function to safely extract string value from string | string[] fields
      const extractString = (value: string | string[] | undefined): string => {
        if (Array.isArray(value)) {
          return value[0] || "Not specified";
        }
        return value || "Not specified";
      };

      return {
        name: laptop.specs?.head || "Unknown laptop",
        brand: laptop.brand || laptop.specs?.brand || "Unknown brand",
        series: laptop.series || laptop.specs?.series || "Unknown series",
        processor:
          laptop.specs?.processor?.name && laptop.specs?.processor?.gen
            ? `${laptop.specs.processor.name} ${
                laptop.specs.processor.gen
              }th Gen ${laptop.specs.processor.variant || ""}`.trim()
            : extractString(laptop.specs?.details?.ProcessorType),
        ram:
          laptop.specs?.ram?.size && laptop.specs?.ram?.type
            ? `${laptop.specs.ram.size}GB ${laptop.specs.ram.type}`
            : extractString(laptop.specs?.details?.RAMSize),
        storage:
          laptop.specs?.storage?.size && laptop.specs?.storage?.type
            ? `${
                typeof laptop.specs.storage.size === "number" &&
                laptop.specs.storage.size >= 1000
                  ? Math.round(laptop.specs.storage.size / 1000) + "TB"
                  : laptop.specs.storage.size + "GB"
              } ${laptop.specs.storage.type}`
            : extractString(laptop.specs?.details?.HardDriveSize),
        graphics:
          laptop.specs?.gpu ||
          extractString(laptop.specs?.details?.GraphicsCoprocessor),
        screenSize: laptop.specs?.displayInch
          ? `${laptop.specs.displayInch}"`
          : extractString(
              laptop.specs?.details?.["Standing screen display size"]
            ),
        price: laptop.sites?.length
          ? `₹${Math.min(
              ...laptop.sites.map((s: { price: number }) => s.price)
            ).toLocaleString()}`
          : "Not available",
        specs: laptop.specs,
      };
    });
  }, [comparedLaptops]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Get current page configuration
  const pageConfig = getPageConfig();

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [sharedMessages, isOpen, scrollToBottom]);
  // Cleanup effect
  useEffect(() => {
    const currentController = abortControllerRef.current;
    return () => {
      // Cancel any ongoing requests when component unmounts
      if (currentController) {
        currentController.abort();
      }
    };
  }, []);
  useEffect(() => {
    // Page-aware welcome message - only show once per session unless messages are cleared
    // Only show welcome in floating widget, not on dedicated tech-assistant page
    const isOnDedicatedPage = location.pathname === "/tech-assistant";
    if (
      isOpen &&
      sharedMessages.length === 0 &&
      !hasShownWelcome &&
      !isOnDedicatedPage
    ) {
      const welcomeMessage: Message = {
        id: "welcome",
        text: pageConfig.welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(welcomeMessage);
      setHasShownWelcome(true);
    }
  }, [
    isOpen,
    sharedMessages.length,
    addMessage,
    hasShownWelcome,
    setHasShownWelcome,
    location.pathname,
    pageConfig.welcomeMessage,
  ]);
  const generateResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Prepare enhanced context based on current page and available data
        const currentPage = location.pathname;
        let contextualInfo = "";

        // Add page-specific context
        if (currentPage === "/" || currentPage === "/home") {
          contextualInfo +=
            "Context: User is on the home page exploring laptops. Focus on discovery, recommendations, and general guidance. ";
        } else if (currentPage === "/search") {
          contextualInfo +=
            "Context: User is actively searching for laptops. Help with search filters, comparison guidance, and selection criteria. ";
        } else if (currentPage.startsWith("/laptop/")) {
          contextualInfo +=
            "Context: User is viewing a specific laptop detail page. Provide detailed analysis and specific information about this laptop. ";
        } else if (currentPage === "/compare") {
          if (comparedLaptops.length > 0) {
            contextualInfo += `Context: User is comparing ${
              comparedLaptops.length
            } laptops: ${comparedLaptops
              .map((l) => l.brand + " " + l.series)
              .join(", ")}. Focus on comparative analysis. `;
          } else {
            contextualInfo +=
              "Context: User is on the compare page but hasn't added laptops yet. Guide them on how to compare laptops effectively. ";
          }
        } else if (currentPage === "/tech-assistant") {
          contextualInfo +=
            "Context: User is in full consultation mode. Provide comprehensive, detailed responses and expert-level guidance. ";
        }

        // Add comparison context if laptops are being compared
        if (comparedLaptops.length > 0 && currentPage !== "/compare") {
          contextualInfo += `Note: User has ${
            comparedLaptops.length
          } laptops in comparison: ${comparedLaptops
            .map((l) => l.brand + " " + l.series)
            .join(", ")}. `;
        }

        // Prepare laptop context for AI
        const laptopContext: LaptopContext | undefined = currentLaptop
          ? {
              name: currentLaptop.specs?.head || "Unknown laptop",
              processor:
                currentLaptop.specs?.processor?.name &&
                currentLaptop.specs?.processor?.gen
                  ? `${currentLaptop.specs.processor.name} ${
                      currentLaptop.specs.processor.gen
                    }th Gen ${
                      currentLaptop.specs.processor.variant || ""
                    }`.trim()
                  : currentLaptop.specs?.details?.ProcessorType ||
                    "Not specified",
              ram:
                currentLaptop.specs?.ram?.size && currentLaptop.specs?.ram?.type
                  ? `${currentLaptop.specs.ram.size}GB ${currentLaptop.specs.ram.type}`
                  : currentLaptop.specs?.details?.RAMSize || "Not specified",
              storage:
                currentLaptop.specs?.storage?.size &&
                currentLaptop.specs?.storage?.type
                  ? `${
                      currentLaptop.specs.storage.size >= 1000
                        ? Math.round(currentLaptop.specs.storage.size / 1000) +
                          "TB"
                        : currentLaptop.specs.storage.size + "GB"
                    } ${currentLaptop.specs.storage.type}`
                  : currentLaptop.specs?.details?.HardDriveSize ||
                    "Not specified",
              graphics:
                currentLaptop.specs?.gpu ||
                currentLaptop.specs?.details?.GraphicsCoprocessor ||
                "Not specified",
              screenSize: currentLaptop.specs?.displayInch
                ? `${currentLaptop.specs.displayInch}"`
                : currentLaptop.specs?.details?.StandingScreenDisplaySize ||
                  "Not specified",
              price: currentLaptop.sites?.length
                ? `₹${Math.min(
                    ...currentLaptop.sites.map(
                      (s: { price: number }) => s.price
                    )
                  ).toLocaleString()}`
                : "Not available",
              brand:
                currentLaptop.brand ||
                currentLaptop.specs?.details?.Brand ||
                "Not specified",
            }
          : undefined; // Enhanced message with context
        const enhancedMessage = contextualInfo + userMessage; // Use real Gemini AI with enhanced context
        const comparedLaptopsData = prepareComparedLaptopsData();
        return await geminiService.generateResponse(
          enhancedMessage,
          laptopContext,
          contextualInfo,
          comparedLaptopsData.length > 0 ? comparedLaptopsData : undefined
        );
      } catch (error) {
        // Don't show error if request was aborted
        if (error instanceof Error && error.name === "AbortError") {
          throw error; // Re-throw to be caught by caller
        }
        console.error("Error generating AI response:", error);
        return "I apologize, but I'm experiencing technical difficulties right now. Please try your question again! 🔧";
      } finally {
        // Clear the abort controller
        abortControllerRef.current = null;
      }
    },
    [
      currentLaptop,
      location.pathname,
      comparedLaptops,
      prepareComparedLaptopsData,
    ]
  );
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Throttle requests to prevent spam
    const now = Date.now();
    if (now - lastRequestTimeRef.current < REQUEST_THROTTLE_MS) {
      return;
    }
    lastRequestTimeRef.current = now;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const response = await generateResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
    } catch (err) {
      // Don't show error message if request was aborted
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Error generating response:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again! 🔧",
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, generateResponse]);
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);
  const clearChat = useCallback(() => {
    // Cancel any ongoing requests when clearing chat
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearMessages();
    setIsLoading(false);
  }, [clearMessages]);

  return (
    <>
      {/* Floating Icon */}
      <div
        className={`tech-assistant-icon ${isOpen ? "active" : ""}`}
        onClick={toggleChat}
        title="Tech Assistant - Ask me about laptops!"
      >
        <div className="icon-inner">
          {isOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h8M8 14h6" />
            </svg>
          )}
        </div>
        <div className="icon-pulse"></div>
        <div className="notification-badge">💡</div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`tech-assistant-chat ${isMinimized ? "minimized" : ""}`}
        >
          <div className="chat-header">
            {" "}
            <div className="header-info">
              <div className="avatar">
                <span>🤖</span>
              </div>
              <div className="title-section">
                <h4>{pageConfig.title}</h4>
                <span className="status">● {pageConfig.status}</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={clearChat}
                title="Clear Chat"
                className="action-btn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                onClick={minimizeChat}
                title="Minimize"
                className="action-btn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>{" "}
              <button
                onClick={() => navigate("/tech-assistant")}
                title="Open in Full Page"
                className="full-page-btn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
              <button
                onClick={toggleChat}
                title="Close"
                className="action-btn close"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {" "}
              <div className="chat-messages">
                {sharedMessages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`message ${message.isUser ? "user" : "ai"}`}
                  >
                    <div className="message-avatar">
                      {message.isUser ? "👤" : "🤖"}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.text}</div>
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message ai">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <div className="input-container">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about laptop specs, recommendations, or comparisons..."
                    rows={1}
                    className="message-input"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="send-button"
                    title="Send message"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>{" "}
                <div className="quick-actions">
                  {pageConfig.quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(action.prompt)}
                      title={action.prompt}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default TechAssistant;
