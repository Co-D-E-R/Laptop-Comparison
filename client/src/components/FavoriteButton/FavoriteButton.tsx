import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../hooks/useFavorites";
import "./FavoriteButton.css";

interface FavoriteButtonProps {
  laptopId: string;
  className?: string;
  showTooltip?: boolean;
  size?: "small" | "medium" | "large";
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  laptopId,
  className = "",
  showTooltip = true,
  size = "medium",
  onToggle,
}) => {
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltipText, setShowTooltipText] = useState(false);

  const isInFavorites = isFavorite(laptopId);
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    // Prevent any event propagation first
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    console.log("Favorite button clicked, preventing navigation");

    if (!user) {
      // Could show login modal or redirect to login
      console.log("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      let success: boolean;
      if (isInFavorites) {
        success = await removeFavorite(laptopId);
      } else {
        success = await addFavorite(laptopId);
      }

      if (success && onToggle) {
        onToggle(!isInFavorites);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-6 h-6 p-1";
      case "large":
        return "w-10 h-10 p-2";
      case "medium":
      default:
        return "w-8 h-8 p-1.5";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return "w-4 h-4";
      case "large":
        return "w-6 h-6";
      case "medium":
      default:
        return "w-5 h-5";
    }
  };

  if (!user) {
    return null; // Don't show favorite button for non-logged-in users
  }
  return (
    <div
      className="relative"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        onClick={handleToggleFavorite}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        disabled={isLoading}
        onMouseEnter={() => setShowTooltipText(true)}
        onMouseLeave={() => setShowTooltipText(false)}
        className={`
          favorite-button
          ${getSizeClasses()}
          ${isInFavorites ? "favorite-active" : "favorite-inactive"}
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
          rounded-full
          transition-all duration-200
          flex items-center justify-center
          backdrop-blur-sm
          hover:scale-110
          active:scale-95
          relative
          z-50
        `}
        title={
          showTooltip
            ? isInFavorites
              ? "Remove from favorites"
              : "Add to favorites"
            : undefined
        }
      >
        {isLoading ? (
          <svg
            className={`${getIconSize()} animate-spin`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className={`${getIconSize()} transition-all duration-200`}
            fill={isInFavorites ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isInFavorites ? 0 : 2}
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            />
          </svg>
        )}
      </button>

      {showTooltip && showTooltipText && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-50">
          {isInFavorites ? "Remove from favorites" : "Add to favorites"}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
