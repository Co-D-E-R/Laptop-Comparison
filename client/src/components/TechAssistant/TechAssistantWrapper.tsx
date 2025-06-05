import React, { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTechAssistant } from '../../contexts/TechAssistantContext';

// Lazy load the TechAssistant component for performance
const TechAssistant = lazy(() => import('./TechAssistant'));

const TechAssistantWrapper: React.FC = () => {
  const location = useLocation();
  const { setCurrentLaptop } = useTechAssistant();
  
  // Define routes where chatbot should NOT appear
  const excludedRoutes = [
    '/login',
    '/signup',
    '/tech-assistant',
    '/auth', // in case there are other auth routes
    '/register' // alternative signup route
  ];
  
  // Check if current route should exclude chatbot
  const shouldHideChatbot = excludedRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  // Clear laptop context when navigating away from laptop detail pages
  useEffect(() => {
    const isLaptopDetailPage = location.pathname.startsWith('/laptop/');
    if (!isLaptopDetailPage) {
      // Small delay to allow new page to set context if needed
      const timeoutId = setTimeout(() => {
        setCurrentLaptop(null);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, setCurrentLaptop]);
  
  // Don't render chatbot on excluded routes
  if (shouldHideChatbot) {
    return null;
  }
  
  return (
    <Suspense fallback={null}>
      <TechAssistant />
    </Suspense>
  );
};

export default TechAssistantWrapper;
