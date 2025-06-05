import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const AuthStatus: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg backdrop-blur-sm border border-blue-500/30">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg backdrop-blur-sm border border-green-500/30">
      {user ? `Logged in as: ${user.name}` : "Not authenticated"}
    </div>
  );
};

export default AuthStatus;
