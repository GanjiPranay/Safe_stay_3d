/**
 * AISafetySummary — Claude-powered safety analysis widget
 * Calls the Anthropic API with all reports for a property
 * and renders a natural-language safety verdict.
 */

import { useState } from 'react';
import { Spinner } from './DesignSystem';

interface Props {
  accommodationName: string;
  trustScore: number;
  reports: Array<{
    issueType: string;
    description: string;
    status: string;
    upvotes?: number;
  }>;
}

interface SummaryData {
  verdict: string;
  riskLevel: 'low' | 'medium' | 'high';
  highlights: string[];
  recommendation: string;
}

export function AISafetySummary({ accommodationName, trustScore, reports }: Props) {
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    const reportSummary = reports.slice(0, 10).map(r =>
      `[${r.issueType}] ${r.description} (status: ${r.status}, upvotes: ${r.upvotes ?? 0})`
    ).join('\n');

    const prompt = `You are a housing safety analyst. Analyze this student accommodation and give a concise safety assessment.

Property: ${accommodationName}
Trust Score: ${trustScore}/100
Total Reports: ${reports.length}
Recent Reports:
${reportSummary || 'No reports on file.'}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "verdict": "2-3 sentence plain English safety verdict",
  "riskLevel": "low" | "medium" | "high",
  "highlights": ["key point 1", "key point 2", "key point 3"],
  "recommendation": "one actionable sentence for students"
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: SummaryData = JSON.parse(clean);
      setSummary(parsed);
      setExpanded(true);
    } catch (err) {
      setError('Unable to generate AI summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'Low Risk'    },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'Medium Risk' },
    high:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   label: 'High Risk'   },
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ai-summary-wrap glass">
        <div className="ai-summary-header">
          <div className="ai-summary-badge">
            <span className="ai-dot" />
            AI Safety Analysis
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Powered by Claude</span>
        </div>

        {!summary && !loading && (
          <div className="ai-summary-cta">
            <p className="ai-summary-desc">
              Get an instant AI-generated safety verdict based on all reports, resolution patterns, and trust score data.
            </p>
            <button className="ss-btn ai-generate-btn" onClick={generate}>
              ✨ Generate AI Safety Report
            </button>
          </div>
        )}

        {loading && (
          <div className="ai-loading">
            <Spinner size={22} color="var(--indigo)" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Analyzing safety data…</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Claude is reviewing all reports</p>
            </div>
          </div>
        )}

        {error && (
          <div className="ss-error" style={{ margin: '12px 0' }}>
            {error}
            <button onClick={generate} className="ss-btn ss-btn-ghost" style={{ marginLeft: 12, fontSize: 11, padding: '5px 10px' }}>
              Retry
            </button>
          </div>
        )}

        {summary && expanded && (
          <div className="ai-result">
            {/* Risk badge */}
            <div className="ai-risk-row">
              {summary.riskLevel && (
                <span className="ai-risk-badge" style={{
                  color: riskColors[summary.riskLevel].color,
                  background: riskColors[summary.riskLevel].bg,
                  borderColor: riskColors[summary.riskLevel].border,
                }}>
                  {summary.riskLevel === 'low' ? '✅' : summary.riskLevel === 'medium' ? '⚠️' : '🚨'} {riskColors[summary.riskLevel].label}
                </span>
              )}
              <button className="ai-regen-btn" onClick={generate}>↻ Regenerate</button>
            </div>

            {/* Verdict */}
            <p className="ai-verdict">{summary.verdict}</p>

            {/* Highlights */}
            {summary.highlights?.length > 0 && (
              <ul className="ai-highlights">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="ai-highlight-item">
                    <span className="ai-highlight-dot" />
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {/* Recommendation */}
            {summary.recommendation && (
              <div className="ai-recommendation">
                <span className="ai-rec-label">💡 Recommendation</span>
                <p>{summary.recommendation}</p>
              </div>
            )}

            <p className="ai-disclaimer">AI analysis is based on filed reports only. Always do your own due diligence.</p>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
  .ai-summary-wrap {
    padding: 24px;
    border-radius: var(--r-lg);
    border-color: rgba(99,102,241,0.15) !important;
  }

  .ai-summary-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }

  .ai-summary-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--indigo);
  }

  .ai-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--indigo);
    box-shadow: 0 0 8px rgba(99,102,241,0.6);
    animation: pulsate 2s ease-in-out infinite;
  }

  .ai-summary-desc {
    font-size: 13px; color: var(--text-2); line-height: 1.6;
    margin-bottom: 16px;
  }

  .ai-generate-btn {
    background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)) !important;
    border: 1px solid rgba(99,102,241,0.3) !important;
    color: #a5b4fc !important;
    box-shadow: none !important;
    font-size: 13px;
  }
  .ai-generate-btn:hover {
    background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3)) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 24px rgba(99,102,241,0.2) !important;
  }

  .ai-loading {
    display: flex; align-items: center; gap: 16px;
    padding: 8px 0 4px;
  }

  .ai-result { display: flex; flex-direction: column; gap: 14px; }

  .ai-risk-row { display: flex; align-items: center; justify-content: space-between; }

  .ai-risk-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 100px;
    border: 1px solid; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
  }

  .ai-regen-btn {
    background: none; border: 1px solid var(--border); border-radius: var(--r-sm);
    color: var(--text-3); font-size: 11px; font-weight: 600;
    padding: 5px 10px; cursor: none; transition: all 0.2s;
    font-family: var(--font-body);
  }
  .ai-regen-btn:hover { color: var(--text-1); border-color: var(--border-hi); }

  .ai-verdict {
    font-size: 14px; color: var(--text-1); line-height: 1.7; font-weight: 400;
    padding: 14px 16px;
    background: rgba(255,255,255,0.02); border: 1px solid var(--border);
    border-radius: var(--r-sm);
  }

  .ai-highlights {
    list-style: none; display: flex; flex-direction: column; gap: 8px;
  }

  .ai-highlight-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: var(--text-2); line-height: 1.5;
  }

  .ai-highlight-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--indigo); flex-shrink: 0; margin-top: 6px;
  }

  .ai-recommendation {
    padding: 14px 16px;
    background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2);
    border-radius: var(--r-sm);
  }

  .ai-rec-label {
    display: block; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--indigo); margin-bottom: 6px;
  }

  .ai-recommendation p { font-size: 13px; color: var(--text-2); line-height: 1.6; }

  .ai-disclaimer {
    font-size: 10px; color: var(--text-3); font-style: italic;
    text-align: center; padding-top: 4px;
  }
`;
