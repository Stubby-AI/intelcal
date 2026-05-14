import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    // Simulate sending a code
    console.log(`Sending verification code to ${email}. Mock Code: 123456`);
    setTimeout(() => {
      setIsLoading(false);
      setCodeSent(true);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
        setError('Please enter the 6-digit verification code.');
        return;
    }
    setIsLoading(true);
    setError('');
    // Simulate verifying the code
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, you'd verify the code against a backend service
      if (code === '123456') {
        onLoginSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    }, 1000);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
                    <SparklesIcon className="w-8 h-8"/>
                    IntelliCal
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome! Sign in to continue.</p>
            </div>
          
          {!codeSent ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-300">A verification code has been sent to <strong>{email}</strong>. (Hint: check the console, or try 123456)</p>
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700"
                    placeholder="123456"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
              </div>
               <div className="text-center">
                    <button type="button" onClick={() => { setCodeSent(false); setError(''); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Use a different email</button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
