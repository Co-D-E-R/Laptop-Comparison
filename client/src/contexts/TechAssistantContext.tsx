import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Message, LaptopContextData } from '../types/techAssistant';

interface TechAssistantContextType {
  currentLaptop: LaptopContextData | null;
  setCurrentLaptop: (laptop: LaptopContextData | null) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  sharedMessages: Message[];
  setSharedMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  hasShownWelcome: boolean;
  setHasShownWelcome: (shown: boolean) => void;
}

const TechAssistantContext = createContext<TechAssistantContextType | undefined>(undefined);

export const useTechAssistant = () => {
  const context = useContext(TechAssistantContext);
  if (context === undefined) {
    throw new Error('useTechAssistant must be used within a TechAssistantProvider');
  }
  return context;
};

interface TechAssistantProviderProps {
  children: ReactNode;
}

export const TechAssistantProvider: React.FC<TechAssistantProviderProps> = ({ children }) => {
  const [currentLaptop, setCurrentLaptop] = useState<LaptopContextData | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [sharedMessages, setSharedMessages] = useState<Message[]>([]);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  const addMessage = (message: Message) => {
    setSharedMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setSharedMessages([]);
    setHasShownWelcome(false); // Reset welcome state when clearing
  };
  const value = {
    currentLaptop,
    setCurrentLaptop,
    isAssistantOpen,
    setIsAssistantOpen,
    sharedMessages,
    setSharedMessages,
    addMessage,
    clearMessages,
    hasShownWelcome,
    setHasShownWelcome,
  };

  return (
    <TechAssistantContext.Provider value={value}>
      {children}
    </TechAssistantContext.Provider>
  );
};
