import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTechAssistant } from "../contexts/TechAssistantContext";
import { geminiService } from "../services/geminiService";
import { formatStorageSize } from "../utils/storageUtils";
import type { LaptopContext } from "../services/geminiService";
import type { Message } from "../types/techAssistant";
import "./TechAssistantPage.css";

const TechAssistantPage: React.FC = () => {
  const {
    currentLaptop,
    sharedMessages,
    addMessage,
    clearMessages,
    hasShownWelcome,
    setHasShownWelcome,
  } = useTechAssistant();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize the laptop context to prevent unnecessary re-computations
  const laptopContext = useMemo((): LaptopContext | undefined => {
    if (!currentLaptop) return undefined;

    return {
      name: currentLaptop.specs?.head || "Unknown laptop",
      processor:
        currentLaptop.specs?.processor?.name &&
        currentLaptop.specs?.processor?.gen
          ? `${currentLaptop.specs.processor.name} ${
              currentLaptop.specs.processor.gen
            }th Gen ${currentLaptop.specs.processor.variant || ""}`.trim()
          : currentLaptop.specs?.details?.ProcessorType || "Not specified",
      ram:
        currentLaptop.specs?.ram?.size && currentLaptop.specs?.ram?.type
          ? `${currentLaptop.specs.ram.size}GB ${currentLaptop.specs.ram.type}`
          : currentLaptop.specs?.details?.RAMSize || "Not specified",      storage:
        currentLaptop.specs?.storage?.size && currentLaptop.specs?.storage?.type
          ? `${formatStorageSize(currentLaptop.specs.storage.size)} ${currentLaptop.specs.storage.type}`
          : currentLaptop.specs?.details?.HardDriveSize || "Not specified",
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
            ...currentLaptop.sites.map((s: { price: number }) => s.price)
          ).toLocaleString()}`
        : "Not available",
      brand:
        currentLaptop.brand ||
        currentLaptop.specs?.details?.Brand ||
        "Not specified",
    };
  }, [currentLaptop]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Cleanup effect for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sharedMessages, scrollToBottom]);
  useEffect(() => {
    // Welcome message when first opened - only show once per session unless messages are cleared
    if (sharedMessages.length === 0 && !hasShownWelcome) {
      const welcomeMessage: Message = {
        id: "welcome-fullpage",
        text: `Welcome to Tech Assistant! ${
          currentLaptop
            ? `I can help with detailed analysis of the ${
                currentLaptop.specs?.head || "laptop"
              } you're viewing.`
            : "Ask me about laptop specs and recommendations."
        }`,
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(welcomeMessage);
      setHasShownWelcome(true);
    }
  }, [
    sharedMessages.length,
    currentLaptop,
    addMessage,
    hasShownWelcome,
    setHasShownWelcome,
  ]);

  const generateResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        // Use real Gemini AI with memoized laptop context
        return await geminiService.generateResponse(
          userMessage,
          laptopContext,
          "Context: User is in full consultation mode. Provide comprehensive, detailed responses and expert-level guidance."
        );
      } catch (error) {
        // Don't show error if request was aborted
        if (error instanceof Error && error.name === "AbortError") {
          throw error; // Re-throw to be caught by caller
        }
        console.error("Error generating AI response:", error);
        return "I apologize, but I'm experiencing technical difficulties right now. Please try your question again! 🔧";
      } finally {
        // Clear the abort controller if it's still the current one
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [laptopContext]
  );

  const handleSendMessage = async () => {
    if (!input.trim()) return;

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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    clearMessages();
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="tech-assistant-page">
      <div className="page-header">
        <div className="header-left">
          <button onClick={goBack} className="back-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="page-title">
            <div className="title-icon">🤖</div>
            <div className="title-content">
              <h1>Tech Assistant</h1>
              <p>Full-featured laptop analysis and recommendations</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={clearChat} className="clear-btn">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {sharedMessages.map((message: Message) => (
            <div
              key={message.id}
              className={`message-wrapper ${
                message.isUser ? "user-message" : "ai-message"
              }`}
            >
              <div className="message-avatar">
                {message.isUser ? "👤" : "🤖"}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.text.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                <div className="message-meta">
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper ai-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="typing-text">
                  Tech Assistant is analyzing...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-section">
          <div className="quick-suggestions">
            <button
              onClick={() =>
                setInput(
                  "Provide a detailed analysis of this laptop's specifications"
                )
              }
              className="suggestion-btn"
            >
              📋 Detailed Specs Analysis
            </button>
            <button
              onClick={() =>
                setInput("What are the pros and cons of this laptop?")
              }
              className="suggestion-btn"
            >
              ⚖️ Pros & Cons
            </button>
            <button
              onClick={() =>
                setInput(
                  "How does this laptop compare to similar models in the market?"
                )
              }
              className="suggestion-btn"
            >
              📊 Market Comparison
            </button>
            <button
              onClick={() =>
                setInput(
                  "Is this laptop good value for money? Explain the price-to-performance ratio."
                )
              }
              className="suggestion-btn"
            >
              💰 Value Analysis
            </button>
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about laptop specifications, performance, comparisons, or recommendations..."
                className="message-input"
                disabled={isLoading}
                rows={3}
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
            </div>
          </div>
        </div>
      </div>

      {currentLaptop && (
        <div className="laptop-context-panel">
          <div className="context-header">
            <h3>📱 Current Context</h3>
          </div>
          <div className="context-content">
            <div className="laptop-info">
              <h4>{currentLaptop.specs?.head || "Laptop"}</h4>
              <div className="specs-grid">
                {currentLaptop.specs?.processor && (
                  <div className="spec-item">
                    <span className="spec-label">Processor:</span>
                    <span className="spec-value">
                      {currentLaptop.specs.processor.name}{" "}
                      {currentLaptop.specs.processor.gen}th Gen
                    </span>
                  </div>
                )}
                {currentLaptop.specs?.ram && (
                  <div className="spec-item">
                    <span className="spec-label">RAM:</span>
                    <span className="spec-value">
                      {currentLaptop.specs.ram.size}GB{" "}
                      {currentLaptop.specs.ram.type}
                    </span>
                  </div>
                )}
                {currentLaptop.specs?.storage && (
                  <div className="spec-item">
                    <span className="spec-label">Storage:</span>
                    <span className="spec-value">                      {formatStorageSize(currentLaptop.specs.storage.size)}{" "}
                      {currentLaptop.specs.storage.type}
                    </span>
                  </div>
                )}
                {currentLaptop.sites && currentLaptop.sites.length > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">Price:</span>
                    <span className="spec-value">
                      ₹
                      {Math.min(
                        ...currentLaptop.sites.map((s) => s.price)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechAssistantPage;
