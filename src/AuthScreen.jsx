import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth";

const AuthScreen = () => {
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);
    
    try {
      if (authMode === "login") {
        await login(authEmail, authPassword);
      } else if (authMode === "signup") {
        await register(authEmail, authPassword);
      }
      // Clear form on success
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      console.error("Authentication error:", error);
      let message = "Authentication failed.";
      
      // Handle specific error messages from our API
      if (error.message.includes("Invalid credentials")) {
        message = "Invalid email or password.";
      } else if (error.message.includes("User already exists")) {
        message = "Email is already in use.";
      } else if (error.message.includes("Password must be at least 6 characters")) {
        message = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Invalid email")) {
        message = "Invalid email address.";
      } else {
        message = error.message || "Authentication failed.";
      }
      
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-300">
          {authMode === "login" ? "Login" : "Sign Up"}
        </h2>
        {authError && (
          <div className="bg-red-700 p-2 rounded mb-4 text-center">
            {authError}
          </div>
        )}
        <form onSubmit={handleAuth}>
          <div className="mb-4">
            <label
              htmlFor="authEmail"
              className="block text-sm font-medium mb-1 text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="authEmail"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              className="w-full bg-gray-700 p-2 rounded text-gray-300"
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="authPassword"
              className="block text-sm font-medium mb-1 text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="authPassword"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              className="w-full bg-gray-700 p-2 rounded text-gray-300"
              placeholder="Password"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed py-2 px-4 rounded-lg shadow-md"
            >
              {isLoading ? "Loading..." : (authMode === "login" ? "Login" : "Sign Up")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="text-sm text-blue-400 hover:text-blue-300"
              disabled={isLoading}
            >
              {authMode === "login"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;