import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompareProvider } from "./contexts/CompareContext.tsx";
import { TechAssistantProvider } from "./contexts/TechAssistantContext";
import { ProtectedRoute } from "./components";
import TechAssistantWrapper from "./components/TechAssistant/TechAssistantWrapper";
import Home from "./pages/home/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Profile from "./pages/profile/profile";
import RecentlyViewedPage from "./pages/recently-viewed/RecentlyViewedPage";
import FavoritesPage from "./pages/favorites/FavoritesPage";
import Search from "./pages/search/Search";
import Compare from "./pages/compare/Compare";
import LaptopDetailEnhanced from "./components/LaptopDetailEnhanced";
import TechAssistantPage from "./pages/TechAssistantPage";
import FloatingCompareButton from "./components/FloatingCompareButton";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <TechAssistantProvider>
        <CompareProvider>
          <BrowserRouter>
            {" "}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/compare" element={<Compare />} />
              <Route
                path="/laptop/:productId"
                element={<LaptopDetailEnhanced />}
              />
              <Route path="/tech-assistant" element={<TechAssistantPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recently-viewed"
                element={
                  <ProtectedRoute>
                    <RecentlyViewedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <FloatingCompareButton />
            <TechAssistantWrapper />
          </BrowserRouter>
        </CompareProvider>
      </TechAssistantProvider>
    </AuthProvider>
  );
}

export default App;
