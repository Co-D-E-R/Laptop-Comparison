// Authentication Implementation Guide
// ===================================

// This file demonstrates how to use the authentication system in your components

import { useAuth } from "../contexts/AuthContext";

// Example 1: Basic authentication check
export const AuthExample1 = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? <p>Welcome, {user.name}!</p> : <p>Please log in to continue</p>}
    </div>
  );
};

// Example 2: Login form integration
export const LoginFormExample = () => {
  // Your form implementation here...
  // Example usage: 
  // const { login } = useAuth();
  // const result = await login(email, password);
};

// Example 3: Logout functionality
export const LogoutExample = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    console.log("Logged out successfully");
  };

  return user ? <button onClick={handleLogout}>Logout</button> : null;
};

// Example 4: Protected content
export const ProtectedContentExample = () => {
  const { user } = useAuth();

  // Only render content if user is authenticated
  if (!user) {
    return <div>Please log in to see this content</div>;
  }

  return (
    <div>
      <h2>Protected Content</h2>
      <p>This content is only visible to authenticated users.</p>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
    </div>
  );
};

// Available Context Properties:
// =============================
// user: User | null - Current authenticated user or null
// isLoading: boolean - Whether authentication check is in progress
// error: string | null - Any authentication error messages
// login(email, password) - Function to log in a user
// logout() - Function to log out the current user
// checkAuth() - Function to manually check authentication status
// clearError() - Function to clear error messages

// Protected Routes Usage:
// ======================
// Wrap any component with ProtectedRoute to require authentication:
//
// <ProtectedRoute>
//   <YourProtectedComponent />
// </ProtectedRoute>
//
// Users will be redirected to /login if not authenticated,
// and back to their original destination after successful login.
