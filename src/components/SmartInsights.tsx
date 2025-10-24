import { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Sparkles, X, Activity, Target, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CorrelationEngine, PatternDetector } from '../lib/correlationEngine';

interface Correlation {
  id: string;
  activity_a: string;
  activity_b: string;
  correlation_score: number;
  confidence: number;
  sample_size: number;
  insight_text: string;
  positive_direction: boolean;
}

interface Pattern {
  id: string;
  pattern_type: string;
  activity_type: string;
  strength: number;
  insight_text: string;
  pattern_data: any;
}

interface Insight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  priority: number;
  action_suggestions: any[];
}

export default function SmartInsights() {
  const { user } = useAuth();
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [corrData, patternData, insightData] = await Promise.all([
        supabase
          .from('activity_correlations')
          .select('*')
          .eq('user_id', user?.id)
          .order('correlation_score', { ascending: false }),
        supabase
          .from('user_patterns')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .order('strength', { ascending: false }),
        supabase
          .from('smart_insights')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_dismissed', false)
          .order('priority', { ascending: false }),
      ]);

      setCorrelations(corrData.data || []);
      setPatterns(patternData.data || []);
      setInsights(insightData.data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const engine = new CorrelationEngine(user?.id || '');
      const detector = new PatternDetector(user?.id || '');

      await Promise.all([
        engine.analyzeAllCorrelations(),
        detector.detectPatterns(),
      ]);

      await generateSmartInsights();
      await loadData();
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSmartInsights = async () => {
    const newInsights = [];

    const { data: correlations } = await supabase
      .from('activity_correlations')
      .select('*')
      .eq('user_id', user?.id)
      .gte('confidence', 0.5)
      .order('correlation_score', { ascending: false })
      .limit(3);

    for (const corr of correlations || []) {
      if (Math.abs(corr.correlation_score) > 0.5) {
        newInsights.push({
          user_id: user?.id,
          insight_type: 'correlation',
          category: 'wellness',
          title: `${corr.activity_a} & ${corr.activity_b} Connection`,
          description: corr.insight_text,
          data_points: { correlation: corr.correlation_score, confidence: corr.confidence },
          action_suggestions: [
            { text: `Focus on maintaining your ${corr.activity_b} routine`, priority: 1 },
          ],
          priority: Math.abs(corr.correlation_score) > 0.7 ? 5 : 3,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    if (newInsights.length > 0) {
      await supabase.from('smart_insights').insert(newInsights);
    }
  };

  const dismissInsight = async (id: string) => {
    await supabase
      .from('smart_insights')
      .update({ is_dismissed: true })
      .eq('id', id);

    setInsights(insights.filter(i => i.id !== id));
  };

  const getCorrelationColor = (score: number) => {
    if (score > 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (score > 0.4) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score > 0) return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    if (score > -0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'streak': return Sparkles;
      case 'improvement': return TrendingUp;
      case 'decline': return TrendingDown;
      default: return Activity;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'streak': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'improvement': return 'text-green-600 bg-green-50 border-green-200';
      case 'decline': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Smart Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover patterns and connections in your activities
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Brain className="w-5 h-5" />
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Key Insights
          </h2>
          <div className="space-y-3">
            {insights.map(insight => (
              <div
                key={insight.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.description}
                  </p>
                  {insight.action_suggestions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {insight.action_suggestions.map((action: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {action.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="ml-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Activity Correlations
          </h2>
          {correlations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No correlations found yet. Run an analysis to discover connections.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {correlations.map(corr => (
                <div
                  key={corr.id}
                  className={`p-4 rounded-xl border-2 ${getCorrelationColor(corr.correlation_score)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{corr.activity_a}</span>
                      <span className="text-gray-400">↔</span>
                      <span className="font-semibold capitalize">{corr.activity_b}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {(corr.correlation_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm mb-2">{corr.insight_text}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Confidence: {(corr.confidence * 100).toFixed(0)}%</span>
                    <span>•</span>
                    <span>{corr.sample_size} days</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-600" />
            Detected Patterns
          </h2>
          {patterns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No patterns detected yet. Keep tracking to build insights.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map(pattern => {
                const Icon = getPatternIcon(pattern.pattern_type);
                return (
                  <div
                    key={pattern.id}
                    className={`p-4 rounded-xl border-2 ${getPatternColor(pattern.pattern_type)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold capitalize">{pattern.pattern_type}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm capitalize">{pattern.activity_type}</span>
                    </div>
                    <p className="text-sm">{pattern.insight_text}</p>
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current rounded-full transition-all"
                          style={{ width: `${pattern.strength * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
