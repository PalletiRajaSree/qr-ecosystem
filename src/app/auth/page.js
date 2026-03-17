"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthPage() {
  const [mode, setMode] = useState("signup"); // "signup" or "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Enter email and password.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage(`Signup error: ${error.message}`);
        } else {
          setMessage("Signup successful. Now switch to Login tab.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(`Login error: ${error.message}`);
        } else if (data.session) {
          setMessage("Login success. Redirecting...");
          window.location.href = "/";
        }
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          QR Nexus — Auth
        </h1>
        <p className="text-slate-300 text-xs text-center mb-4">
          RT-4: Advanced Smart QR Code Ecosystem Platform
        </p>

        <div className="flex justify-center gap-2 mb-4 text-xs">
          <button
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`px-3 py-1 rounded ${
              mode === "signup" ? "bg-indigo-500" : "bg-slate-800"
            }`}
          >
            Sign up
          </button>
          <button
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`px-3 py-1 rounded ${
              mode === "login" ? "bg-indigo-500" : "bg-slate-800"
            }`}
          >
            Log in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-sm font-medium disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create account"
              : "Log in"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-sm text-center text-slate-300">{message}</p>
        )}
      </div>
    </main>
  );
}
