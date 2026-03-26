/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  User, 
  Users, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Info,
  ArrowLeft,
  Search,
  Lock,
  Bell
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

type Role = 'child' | 'parent' | null;

interface FraudReport {
  id: string;
  type: 'message' | 'call' | 'other';
  content: string;
  timestamp: number;
  aiAnalysis?: string;
  isFraud: boolean | 'suspicious';
  status: 'pending' | 'reviewed';
}

interface AppState {
  role: Role;
  parentPhone: string;
  childName: string;
  reports: FraudReport[];
}

// --- Constants ---

const STORAGE_KEY = 'safeguard_app_state';

const INITIAL_STATE: AppState = {
  role: null,
  parentPhone: '',
  childName: '',
  reports: [],
};

// --- Gemini Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeFraud(content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an anti-fraud expert. Analyze the following message or call description for potential fraud or scams targeting children. 
      Provide a concise analysis (max 100 words) and a verdict: "Fraud", "Suspicious", or "Safe".
      
      Content: "${content}"`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Analysis unavailable at the moment.";
  }
}

// --- Components ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = "" 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  disabled?: boolean,
  className?: string
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-50',
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [view, setView] = useState<'home' | 'report' | 'history'>('home');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleRoleSelect = (role: Role) => {
    setState(prev => ({ ...prev, role }));
  };

  const handleLinkParent = (phone: string, name: string) => {
    setState(prev => ({ ...prev, parentPhone: phone, childName: name }));
  };

  const handleNewReport = async (content: string, type: FraudReport['type']) => {
    setIsAnalyzing(true);
    const analysis = await analyzeFraud(content);
    
    const isFraud = analysis.toLowerCase().includes('fraud') 
      ? true 
      : analysis.toLowerCase().includes('suspicious') 
        ? 'suspicious' 
        : false;

    const newReport: FraudReport = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now(),
      aiAnalysis: analysis,
      isFraud,
      status: 'pending',
    };

    setState(prev => ({
      ...prev,
      reports: [newReport, ...prev.reports]
    }));
    setIsAnalyzing(false);
    setView('home');
  };

  const resetApp = () => {
    if (confirm("Are you sure you want to reset the app? All data will be lost.")) {
      setState(INITIAL_STATE);
      setView('home');
    }
  };

  // --- Renderers ---

  if (!state.role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="text-white w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">SafeGuard</h1>
          <p className="text-slate-500 mb-10">Protecting children from digital fraud and scams.</p>
          
          <div className="grid gap-4">
            <button 
              onClick={() => handleRoleSelect('child')}
              className="group bg-white p-6 rounded-2xl border-2 border-transparent hover:border-indigo-600 transition-all text-left shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <User className="text-indigo-600 w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">I am a Child</h3>
                <p className="text-sm text-slate-500">Report suspicious messages to my parents.</p>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button 
              onClick={() => handleRoleSelect('parent')}
              className="group bg-white p-6 rounded-2xl border-2 border-transparent hover:border-indigo-600 transition-all text-left shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Users className="text-emerald-600 w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">I am a Parent</h3>
                <p className="text-sm text-slate-500">Monitor and review my child's reports.</p>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-600 w-6 h-6" />
          <span className="font-bold text-slate-900">SafeGuard</span>
        </div>
        <button onClick={resetApp} className="text-xs text-slate-400 hover:text-rose-500 transition-colors">
          Reset App
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {state.role === 'child' ? (
            <ChildView 
              state={state} 
              view={view} 
              setView={setView} 
              onLink={handleLinkParent} 
              onReport={handleNewReport}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            <ParentView 
              state={state} 
              onReview={(id) => {
                setState(prev => ({
                  ...prev,
                  reports: prev.reports.map(r => r.id === id ? { ...r, status: 'reviewed' } : r)
                }));
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation for Child */}
      {state.role === 'child' && state.parentPhone && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-around items-center">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button 
            onClick={() => setView('report')}
            className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 -mt-10 border-4 border-slate-50 active:scale-90 transition-transform"
          >
            <Plus className="text-white w-8 h-8" />
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Bell className="w-6 h-6" />
            <span className="text-[10px] font-medium">Alerts</span>
          </button>
        </nav>
      )}
    </div>
  );
}

// --- Child View ---

function ChildView({ 
  state, 
  view, 
  setView, 
  onLink, 
  onReport,
  isAnalyzing
}: { 
  state: AppState, 
  view: string, 
  setView: (v: any) => void, 
  onLink: (p: string, n: string) => void,
  onReport: (c: string, t: FraudReport['type']) => void,
  isAnalyzing: boolean
}) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportType, setReportType] = useState<FraudReport['type']>('message');

  if (!state.parentPhone) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link your Parent</h2>
          <p className="text-slate-500 mb-6">Enter your parent's phone number so they can help you stay safe.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Parent's Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 234 567 890"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <Button 
              onClick={() => onLink(phone, name)}
              disabled={!phone || !name}
              className="w-full"
            >
              Link Now
            </Button>
          </div>
        </Card>
        
        <div className="bg-indigo-50 p-4 rounded-xl flex gap-3">
          <Info className="text-indigo-600 w-5 h-5 shrink-0" />
          <p className="text-sm text-indigo-900">Linking allows your parent to see any suspicious messages you report instantly.</p>
        </div>
      </motion.div>
    );
  }

  if (view === 'report') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">New Report</h2>
        </div>

        <Card>
          <div className="flex gap-2 mb-6">
            {(['message', 'call', 'other'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  reportType === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Paste the message or describe the call
          </label>
          <textarea 
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            placeholder="e.g. Someone sent me a link saying I won a free game console..."
            className="w-full h-40 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none mb-6"
          />

          <Button 
            onClick={() => onReport(reportContent, reportType)}
            disabled={!reportContent || isAnalyzing}
            className="w-full flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </Card>

        <div className="flex items-center gap-2 text-slate-400 justify-center text-sm">
          <Lock className="w-4 h-4" />
          <span>Encrypted & Secure</span>
        </div>
      </motion.div>
    );
  }

  if (view === 'history') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Report History</h2>
        {state.reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-slate-300 w-8 h-8" />
            </div>
            <p className="text-slate-500">No reports yet. Stay safe!</p>
          </div>
        ) : (
          state.reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hello, {state.childName}!</h2>
          <p className="text-slate-500">You are protected by SafeGuard.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="text-indigo-600 w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Status</h3>
          <p className="text-indigo-100 text-sm">Active & Secure</p>
        </Card>
        <Card>
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
            <Phone className="text-indigo-600 w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900">Parent</h3>
          <p className="text-slate-500 text-sm truncate">{state.parentPhone}</p>
        </Card>
      </div>

      <Card className="bg-rose-50 border-rose-100">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="text-rose-600 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-rose-900">Suspicious Activity?</h3>
            <p className="text-sm text-rose-700 mb-4">If someone asks for money or personal info, report it immediately.</p>
            <Button variant="danger" onClick={() => setView('report')} className="py-2 px-4 text-sm">
              Report Now
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900">Recent Activity</h3>
        {state.reports.slice(0, 3).map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
        {state.reports.length > 3 && (
          <button onClick={() => setView('history')} className="w-full py-2 text-indigo-600 font-semibold text-sm">
            View All History
          </button>
        )}
      </div>
    </motion.div>
  );
}

// --- Parent View ---

function ParentView({ 
  state, 
  onReview 
}: { 
  state: AppState, 
  onReview: (id: string) => void 
}) {
  const pendingReports = state.reports.filter(r => r.status === 'pending');
  const reviewedReports = state.reports.filter(r => r.status === 'reviewed');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parent Dashboard</h2>
          <p className="text-slate-500">Monitoring {state.childName || 'Child'}'s safety.</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <Users className="text-emerald-600 w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-emerald-600 text-white border-none">
          <div className="text-3xl font-bold mb-1">{pendingReports.length}</div>
          <p className="text-emerald-100 text-sm">Pending Alerts</p>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-slate-900 mb-1">{state.reports.length}</div>
          <p className="text-slate-500 text-sm">Total Reports</p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Pending Review</h3>
          <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">
            {pendingReports.length} Action Needed
          </span>
        </div>
        
        {pendingReports.length === 0 ? (
          <Card className="flex items-center justify-center py-10 border-dashed">
            <div className="text-center">
              <CheckCircle2 className="text-emerald-500 w-10 h-10 mx-auto mb-2" />
              <p className="text-slate-500">All clear! No pending alerts.</p>
            </div>
          </Card>
        ) : (
          pendingReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              isParent 
              onReview={() => onReview(report.id)} 
            />
          ))
        )}
      </div>

      {reviewedReports.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900">Reviewed History</h3>
          {reviewedReports.map((report) => (
            <ReportCard key={report.id} report={report} isParent />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// --- Shared Components ---

function ReportCard({ 
  report, 
  isParent = false, 
  onReview 
}: { 
  report: FraudReport, 
  isParent?: boolean, 
  onReview?: () => void 
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    true: 'bg-rose-100 text-rose-600 border-rose-200',
    false: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    suspicious: 'bg-amber-100 text-amber-600 border-amber-200',
  };

  const statusLabels = {
    true: 'Fraud Detected',
    false: 'Likely Safe',
    suspicious: 'Suspicious',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            report.type === 'message' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {report.type === 'message' ? <MessageSquare className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 capitalize">{report.type}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[report.isFraud as keyof typeof statusColors]}`}>
                {statusLabels[report.isFraud as keyof typeof statusLabels]}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {new Date(report.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
        {report.status === 'pending' && isParent && (
          <button 
            onClick={(e) => { e.stopPropagation(); onReview?.(); }}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            Mark Reviewed
          </button>
        )}
      </div>

      <p className={`text-sm text-slate-600 mb-3 ${expanded ? '' : 'line-clamp-2'}`}>
        {report.content}
      </p>

      {expanded && report.aiAnalysis && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Analysis</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 leading-relaxed italic">
            "{report.aiAnalysis}"
          </div>
        </motion.div>
      )}

      {!expanded && (
        <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
          Tap to see AI analysis
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </Card>
  );
}
