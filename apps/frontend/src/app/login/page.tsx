"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.login(username, password);
      login(response.access_token, response.user);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={28} />
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-100">SIH 26189</CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">Criminal Network Analysis System</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                required
                className="w-full bg-slate-950 border-slate-800 text-slate-200"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. test_investigator"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  required
                  className="w-full bg-slate-950 border-slate-800 text-slate-200 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Lock size={16} className="absolute right-3 top-3 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col border-t border-slate-800 mt-2 pt-6">
          <div className="text-xs text-slate-500 text-center">
            Prototype Mode: Use test credentials <br/>
            (test_admin, test_investigator, test_analyst, test_reviewer)<br/>
            Password: testpassword
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
