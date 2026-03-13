import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function SystemAudit() {
  const auditData = {
    scores: {
      frontend: 75,
      backend: 80,
      payments: 70,
      security: 65,
      deployment: 75
    },
    severity_bars: [
      { label: "Frontend", value: 75 },
      { label: "Backend", value: 80 },
      { label: "Payments", value: 70 },
      { label: "Security", value: 65 },
      { label: "Deployment", value: 75 }
    ],
    completion_bars: [
      { label: "Frontend Completeness", value: 70 },
      { label: "Backend Completeness", value: 80 },
      { label: "Payments Completeness", value: 60 },
      { label: "Security Completeness", value: 65 },
      { label: "Deployment Completeness", value: 80 }
    ],
    critical_issues: [
      {
        title: "Insecure Payment Processing",
        description: "Payment transactions lack proper encryption and security measures, increasing the risk of data breaches.",
        icon: "⚠️",
        tags: [
          { label: "Security", type: "critical" },
          { label: "Payments", type: "critical" }
        ]
      },
      {
        title: "Poor User Experience on Mobile",
        description: "The frontend UI has significant performance issues on mobile devices, leading to unresponsive layouts and slow loading times.",
        icon: "⚠️",
        tags: [
          { label: "Frontend", type: "critical" },
          { label: "UX", type: "critical" }
        ]
      }
    ],
    warnings: [
      {
        title: "Outdated Dependencies",
        description: "Several React libraries and dependencies used in the project are outdated, which can lead to security vulnerabilities and performance issues.",
        icon: "⚠️",
        tags: [
          { label: "Maintenance", type: "warning" },
          { label: "Frontend", type: "warning" }
        ]
      },
      {
        title: "Insufficient Testing Coverage",
        description: "Unit and integration tests do not cover critical components of the backend and payments modules, resulting in potential bugs going unnoticed.",
        icon: "⚠️",
        tags: [
          { label: "Testing", type: "warning" },
          { label: "Backend", type: "warning" }
        ]
      }
    ],
    roadmap: [
      {
        week: "Week 1",
        color: "#ffcc00",
        items: [
          "Conduct a full security audit of the payment processing system.",
          "Implement SSL/TLS for all payment communications."
        ]
      },
      {
        week: "Week 2",
        color: "#33cc33",
        items: [
          "Optimize the mobile UI and perform necessary adjustments based on user feedback.",
          "Updating React libraries to the latest stable versions."
        ]
      },
      {
        week: "Week 3",
        color: "#3399ff",
        items: [
          "Develop additional tests for backend services, focusing on payments and security.",
          "Refactor frontend components to improve loading times and responsiveness."
        ]
      },
      {
        week: "Week 4",
        color: "#ff6666",
        items: [
          "Deploy security patches and perform a vulnerability scan after fixes.",
          "Gather user feedback on mobile experience and make iterative improvements."
        ]
      }
    ]
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (value) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const overallScore = Math.round(
    Object.values(auditData.scores).reduce((a, b) => a + b, 0) / 
    Object.values(auditData.scores).length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            System Audit Report
          </h1>
          <p className="text-slate-600 text-lg">Comprehensive analysis of system health and security</p>
          <div className="flex justify-center items-center gap-3">
            <span className="text-sm text-slate-500">Overall Score:</span>
            <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-slate-400">/100</span>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(auditData.scores).map(([key, value]) => (
            <Card key={key} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 capitalize">
                  {key}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(value)}`}>
                  {value}
                </div>
                <Progress value={value} className="mt-2 h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Critical Issues */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Critical Issues ({auditData.critical_issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditData.critical_issues.map((issue, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{issue.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2">{issue.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{issue.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {issue.tags.map((tag, tagIdx) => (
                        <Badge key={tagIdx} variant="destructive" className="text-xs">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-5 h-5" />
              Warnings ({auditData.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditData.warnings.map((warning, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{warning.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2">{warning.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{warning.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {warning.tags.map((tag, tagIdx) => (
                        <Badge key={tagIdx} className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Severity Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Severity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditData.severity_bars.map((bar, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">{bar.label}</span>
                  <span className={`text-sm font-bold ${getScoreColor(bar.value)}`}>
                    {bar.value}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(bar.value)} transition-all duration-500`}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Completion Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditData.completion_bars.map((bar, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">{bar.label}</span>
                  <span className={`text-sm font-bold ${getScoreColor(bar.value)}`}>
                    {bar.value}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(bar.value)} transition-all duration-500`}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              4-Week Remediation Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {auditData.roadmap.map((phase, idx) => (
                <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                  {idx < auditData.roadmap.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div
                    className="absolute left-0 top-0 w-6 h-6 rounded-full border-4 border-white shadow-md"
                    style={{ backgroundColor: phase.color }}
                  />
                  <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-3">{phase.week}</h3>
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}