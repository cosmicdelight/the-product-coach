import { Link } from 'react-router-dom';
import { Lightbulb, Target, Zap, CheckCircle, ArrowRight, TrendingUp, Users, Shield } from 'lucide-react';

export function LandingPage() {
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

      <section className="pt-20 pb-24 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Built for Innovators Worldwide
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Ideas Into
            <span className="text-blue-600"> Fundable Proposals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Product Coach guides you step-by-step from problem identification to a fully validated
            MVP funding proposal — with AI-powered assistance at every stage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Start Building Your Proposal
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Why Product Coach?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We eliminate the three biggest barriers to great public sector proposals.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-7 w-7 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'No Expertise Required',
                desc: 'AI-powered coaching guides you through every section. No product development background needed.',
              },
              {
                icon: <Target className="h-7 w-7 text-green-600" />,
                bg: 'bg-green-50',
                title: 'Save Days of Work',
                desc: 'A structured 10-step wizard with smart defaults reduces proposal creation from days to hours.',
              },
              {
                icon: <TrendingUp className="h-7 w-7 text-orange-600" />,
                bg: 'bg-orange-50',
                title: 'Higher Approval Rates',
                desc: 'Built-in validation and quality checks ensure your proposal meets organiser expectations every time.',
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                { step: '01', title: 'Identify & Validate', desc: 'Define your problem, assess its impact, and validate it through structured user research.' },
                { step: '02', title: 'Design Your Solution', desc: 'Brainstorm solutions with AI, scope your MVP, and specify technical requirements.' },
                { step: '03', title: 'Plan & Quantify', desc: 'Estimate resources, define success metrics, and identify risks with mitigation strategies.' },
                { step: '04', title: 'Submit & Iterate', desc: 'Generate an AI-powered executive summary, submit for review, and respond to feedback.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                    {step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-5">What's Included</h3>
              <ul className="space-y-4">
                {[
                  'AI-powered content suggestions per section',
                  '10-step guided proposal wizard',
                  'Automated quality score & checklist',
                  'Organiser review & feedback tools',
                  'Approval workflow with status tracking',
                  'Comment threads for collaboration',
                  'Executive summary auto-generation',
                  'Role-based access for officers & organisers',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
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
