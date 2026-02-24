import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lightbulb, Target, Zap, ArrowRight, TrendingUp, Users, Shield,
  MessageSquare, CheckCircle2, Bot, FileText, BarChart3, Bell,
  Star, GitBranch, ClipboardCheck, Calendar, PlusCircle,
  ChevronRight, ClipboardList, FlaskConical,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function WizardStepsMockup() {
  const steps = [
    { label: 'Problem', active: true },
    { label: 'Validate', active: false },
    { label: 'Research', active: false },
    { label: 'Opportunity', active: false },
    { label: 'Success', active: false },
    { label: 'Summary', active: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400 font-medium">Product Coach — Proposal Wizard</span>
      </div>
      <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium flex-shrink-0 border-b-2 transition-colors ${s.active ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-400'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${s.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
            {s.label}
          </div>
        ))}
      </div>
      <div className="p-4 grid grid-cols-5 gap-3">
        <div className="col-span-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">What problem are you solving?</p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 text-xs text-gray-500">Staff manually process 200+ leave requests per week using paper forms, causing 3-day delays...</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Who is affected?</p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 text-xs text-gray-500">HR teams across 4 departments, ~120 employees</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full w-2/6" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">2 / 6 steps</span>
          </div>
        </div>
        <div className="col-span-2 bg-blue-50 rounded-lg border border-blue-100 p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <Bot className="h-3 w-3 text-blue-600" />
            <span className="text-[10px] font-semibold text-blue-700">AI Coach</span>
          </div>
          <div className="bg-white rounded-md p-1.5 text-[10px] text-gray-600 leading-relaxed border border-blue-100">Great start! Try quantifying the cost — how many hours per week are lost?</div>
          <div className="bg-blue-600 rounded-md p-1.5 text-[10px] text-white leading-relaxed">About 15 hours across the team each week.</div>
          <div className="mt-auto bg-white rounded border border-gray-200 px-2 py-1 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 flex-1">Ask a question...</span>
            <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewWorkflowMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400 font-medium">Product Coach — Review Dashboard</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Submitted Proposals</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">3 pending</span>
        </div>
        {[
          { title: 'Automated Leave System', author: 'Sarah M.', score: 87, status: 'Under Review', color: 'text-blue-600 bg-blue-50' },
          { title: 'Digital Onboarding Portal', author: 'James T.', score: 74, status: 'Revision Req.', color: 'text-amber-600 bg-amber-50' },
          { title: 'Asset Tracking Module', author: 'Priya K.', score: 92, status: 'Approved', color: 'text-green-600 bg-green-50' },
        ].map(p => (
          <div key={p.title} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
              <p className="text-[10px] text-gray-400">{p.author}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-semibold text-gray-700">{p.score}</span>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${p.color}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizerMockup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400 font-medium">Product Coach — Organiser Dashboard</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">Active Events</span>
          <button className="text-[10px] bg-teal-600 text-white px-2 py-1 rounded-md font-medium flex items-center gap-1">
            <PlusCircle className="h-2.5 w-2.5" /> New Event
          </button>
        </div>
        {[
          { name: 'GovHack 2026', date: '15 Mar', submissions: 12, open: true },
          { name: 'Innovation Sprint Q1', date: '28 Mar', submissions: 7, open: true },
          { name: 'Digital Services Fund', date: '10 Apr', submissions: 3, open: false },
        ].map(ev => (
          <div key={ev.name} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{ev.name}</p>
              <p className="text-[10px] text-gray-400">Closes {ev.date} · {ev.submissions} submissions</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ev.open ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                {ev.open ? 'Open' : 'Drafting'}
              </span>
              <ChevronRight className="h-3 w-3 text-gray-300" />
            </div>
          </div>
        ))}
        <div className="pt-1 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Pending Review</span>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">5 unassigned</span>
          </div>
          {[
            { title: 'Smart Permit Portal', author: 'Sarah M.', priority: 'High' },
            { title: 'Resident Feedback Loop', author: 'James T.', priority: 'Medium' },
          ].map(p => (
            <div key={p.title} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <ClipboardList className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-800 truncate">{p.title}</p>
                <p className="text-[10px] text-gray-400">{p.author}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                {p.priority}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-teal-50 rounded-lg p-2 border border-teal-100">
          <Bell className="h-3 w-3 text-teal-500 flex-shrink-0" />
          <span className="text-[10px] text-teal-700">New proposal submitted to GovHack 2026</span>
          <span className="ml-auto text-[9px] text-teal-400">5m ago</span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    const { error } = await signIn('demo@productcoach.app', 'DemoUser2024!');
    if (!error) {
      navigate('/officer/dashboard');
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg p-1.5">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Product Coach</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="hidden sm:flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <FlaskConical className="h-4 w-4" />
                {demoLoading ? 'Loading...' : 'Try Demo'}
              </button>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-28 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Built for Public Sector Innovators
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Ideas Into
            <span className="text-blue-600"> Fundable Proposals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Product Coach guides you through a 6-step structured workflow — from problem identification
            to a polished, AI-reviewed proposal — with a live AI coach at every stage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Start Building Your Proposal
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              <FlaskConical className="h-5 w-5" />
              {demoLoading ? 'Loading Demo...' : 'Try the Demo'}
            </button>
          </div>
          <div className="max-w-3xl mx-auto">
            <WizardStepsMockup />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Why Product Coach?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We eliminate the three biggest barriers to great innovation proposals.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Bot className="h-7 w-7 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'AI Coach in Every Step',
                desc: 'A context-aware AI chat panel sits alongside every section — get instant feedback, scores, and suggestions without leaving the page.',
              },
              {
                icon: <Target className="h-7 w-7 text-green-600" />,
                bg: 'bg-green-50',
                title: 'Structured 6-Step Wizard',
                desc: 'From problem framing through to executive summary, each step builds on the last so nothing gets missed and your proposal tells a complete story.',
              },
              {
                icon: <TrendingUp className="h-7 w-7 text-orange-600" />,
                bg: 'bg-orange-50',
                title: 'Higher Approval Rates',
                desc: 'Built-in quality scoring and a dedicated organiser review workflow mean your proposal lands with the right information every time.',
              },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className={`${bg} rounded-xl w-14 h-14 flex items-center justify-center mb-5`}>
                  {icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How It Works</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Six focused steps, each with AI guidance, take you from raw idea to submission-ready proposal.</p>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              {[
                {
                  step: '01–02',
                  icon: <ClipboardCheck className="h-4 w-4 text-blue-600" />,
                  title: 'Identify & Validate the Problem',
                  desc: 'Define the problem clearly and validate it is real — who is affected, how often, and at what cost.',
                },
                {
                  step: '03',
                  icon: <Users className="h-4 w-4 text-green-600" />,
                  title: 'User Research',
                  desc: 'Document your research methods and findings to prove the problem is worth solving.',
                },
                {
                  step: '04–05',
                  icon: <GitBranch className="h-4 w-4 text-orange-600" />,
                  title: 'Frame the Opportunity & Define Success',
                  desc: 'Articulate the solution space and set measurable outcomes that organisers can evaluate.',
                },
                {
                  step: '06',
                  icon: <Zap className="h-4 w-4 text-purple-600" />,
                  title: 'AI-Generated Executive Summary',
                  desc: 'The AI synthesises all your inputs into a polished executive summary, ready to submit.',
                },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Step {step}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">AI Coach Chat Panel</h3>
                  <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Live in every step</span>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { icon: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />, text: 'Ask questions about your section at any time' },
                    { icon: <BarChart3 className="h-3.5 w-3.5 text-green-500" />, text: 'Get a section score with strengths and red flags' },
                    { icon: <Zap className="h-3.5 w-3.5 text-amber-500" />, text: 'Quick-prompt buttons for common queries' },
                    { icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />, text: 'Chat history saved per section as you work' },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5">{icon}</span>
                      <span className="text-sm text-gray-600">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">What's Included</h3>
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    '6-step guided wizard',
                    'AI Coach chat panel',
                    'Section quality scoring',
                    'AI executive summary',
                    'Team collaboration',
                    'Invite links for co-authors',
                    'Organiser review tools',
                    'Approval & feedback workflow',
                    'Status tracking dashboard',
                    'Real-time notifications',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Built for Your Whole Organisation</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Two roles, one platform. Innovators build proposals. Innovation enablers manage events and review submissions.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">For Innovators</h3>
              </div>
              <ReviewWorkflowMockup />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900">For Innovation Enablers</h3>
              </div>
              <OrganizerMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your First Proposal?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join innovators around the world transforming workplace ideas into funded solutions.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            <Users className="h-5 w-5" />
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold">Product Coach</span>
          </div>
          <p className="text-sm">Empowering innovators everywhere to build better solutions</p>
        </div>
      </footer>
    </div>
  );
}
