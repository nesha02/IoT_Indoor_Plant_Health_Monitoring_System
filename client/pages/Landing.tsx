
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300 px-4">
      {/* Animated Plant Icon */}
      <div className="mb-8 animate-bounce">
        <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="56" rx="18" ry="6" fill="#A7F3D0" />
          <path d="M32 56C32 56 32 36 16 32C16 32 24 24 32 32C40 24 48 32 48 32C32 36 32 56 32 56Z" fill="#34D399" stroke="#059669" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="32" cy="32" r="4" fill="#059669" />
        </svg>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-green-900 text-center drop-shadow-lg animate-fade-in">
        Indoor Plant Health Monitoring
      </h1>
      <p className="mb-8 text-base sm:text-lg md:text-xl text-green-800 text-center max-w-md animate-fade-in delay-200">
        Welcome! Monitor your plants' health in real time with beautiful analytics and smart automation.
      </p>
      <button
        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full shadow-xl hover:scale-105 hover:from-green-600 hover:to-green-800 transition-all duration-300 text-lg font-semibold animate-fade-in delay-400"
        onClick={() => navigate("/dashboard")}
      >
        Go to Dashboard
      </button>
      {/* Decorative animated leaves */}
      <div className="absolute left-0 top-0 w-24 h-24 opacity-30 animate-spin-slow">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none"><ellipse cx="48" cy="48" rx="40" ry="12" fill="#6EE7B7"/></svg>
      </div>
      <div className="absolute right-0 bottom-0 w-24 h-24 opacity-20 animate-spin-reverse">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none"><ellipse cx="48" cy="48" rx="40" ry="12" fill="#34D399"/></svg>
      </div>
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease forwards; opacity: 0; }
        .animate-fade-in.delay-200 { animation-delay: 0.2s; }
        .animate-fade-in.delay-400 { animation-delay: 0.4s; }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        .animate-spin-reverse { animation: spin-reverse 18s linear infinite; }
      `}</style>
    </div>
  );
}
