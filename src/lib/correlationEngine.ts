import { supabase } from './supabase';

interface DataPoint {
  date: string;
  value: number | boolean;
}

interface CorrelationResult {
  correlation: number;
  confidence: number;
  sampleSize: number;
  insightText: string;
  positiveDirection: boolean;
}

export class CorrelationEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async analyzeAllCorrelations() {
    const correlations = [
      { a: 'mood', b: 'workout', aData: await this.getMoodData(), bData: await this.getWorkoutData() },
      { a: 'mood', b: 'skincare', aData: await this.getMoodData(), bData: await this.getSkincareData() },
      { a: 'mood', b: 'journal', aData: await this.getMoodData(), bData: await this.getJournalData() },
      { a: 'mood', b: 'sleep', aData: await this.getMoodData(), bData: await this.getSleepData() },
      { a: 'workout', b: 'sleep', aData: await this.getWorkoutData(), bData: await this.getSleepData() },
      { a: 'journal', b: 'mood', aData: await this.getJournalData(), bData: await this.getMoodData() },
      { a: 'skincare', b: 'mood', aData: await this.getSkincareData(), bData: await this.getMoodData() },
    ];

    const results = [];
    for (const { a, b, aData, bData } of correlations) {
      if (aData.length >= 7 && bData.length >= 7) {
        const result = this.calculateCorrelation(a, b, aData, bData);
        if (result && Math.abs(result.correlation) > 0.3) {
          results.push({ activityA: a, activityB: b, ...result });
        }
      }
    }

    await this.saveCorrelations(results);
    return results;
  }

  private calculateCorrelation(
    activityA: string,
    activityB: string,
    dataA: DataPoint[],
    dataB: DataPoint[]
  ): CorrelationResult | null {
    const alignedData = this.alignDataByDate(dataA, dataB);

    if (alignedData.length < 5) return null;

    const valuesA = alignedData.map(d => typeof d.valueA === 'boolean' ? (d.valueA ? 1 : 0) : d.valueA);
    const valuesB = alignedData.map(d => typeof d.valueB === 'boolean' ? (d.valueB ? 1 : 0) : d.valueB);

    const correlation = this.pearsonCorrelation(valuesA, valuesB);
    const confidence = Math.min(alignedData.length / 30, 1);

    const insightText = this.generateInsight(activityA, activityB, correlation, alignedData.length);
    const positiveDirection = this.isPositiveCorrelation(activityA, activityB, correlation);

    return {
      correlation,
      confidence,
      sampleSize: alignedData.length,
      insightText,
      positiveDirection,
    };
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumXSquared += dx * dx;
      sumYSquared += dy * dy;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  private alignDataByDate(dataA: DataPoint[], dataB: DataPoint[]): Array<{ date: string; valueA: number | boolean; valueB: number | boolean }> {
    const dateMapA = new Map(dataA.map(d => [d.date, d.value]));
    const dateMapB = new Map(dataB.map(d => [d.date, d.value]));

    const commonDates = [...dateMapA.keys()].filter(date => dateMapB.has(date));

    return commonDates.map(date => ({
      date,
      valueA: dateMapA.get(date)!,
      valueB: dateMapB.get(date)!,
    }));
  }

  private generateInsight(activityA: string, activityB: string, correlation: number, sampleSize: number): string {
    const strength = Math.abs(correlation) > 0.7 ? 'strongly' : Math.abs(correlation) > 0.5 ? 'moderately' : 'somewhat';
    const direction = correlation > 0 ? 'better' : 'worse';

    const activityNames: Record<string, string> = {
      mood: 'mood',
      workout: 'working out',
      skincare: 'skincare routine',
      journal: 'journaling',
      sleep: 'sleep quality',
    };

    const nameA = activityNames[activityA] || activityA;
    const nameB = activityNames[activityB] || activityB;

    if (correlation > 0) {
      return `Your ${nameA} is ${strength} better on days when you maintain your ${nameB} (${sampleSize} days analyzed)`;
    } else {
      return `Your ${nameA} tends to be ${strength} ${direction} when you skip your ${nameB} (${sampleSize} days analyzed)`;
    }
  }

  private isPositiveCorrelation(activityA: string, activityB: string, correlation: number): boolean {
    return correlation > 0;
  }

  private async saveCorrelations(correlations: any[]) {
    for (const corr of correlations) {
      await supabase
        .from('activity_correlations')
        .upsert({
          user_id: this.userId,
          activity_a: corr.activityA,
          activity_b: corr.activityB,
          correlation_score: corr.correlation,
          confidence: corr.confidence,
          sample_size: corr.sampleSize,
          insight_text: corr.insightText,
          positive_direction: corr.positiveDirection,
          last_calculated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,activity_a,activity_b',
        });
    }
  }

  private async getMoodData(): Promise<DataPoint[]> {
    const { data } = await supabase
      .from('mood_entries')
      .select('entry_date, mood_score')
      .eq('user_id', this.userId)
      .order('entry_date', { ascending: false })
      .limit(90);

    return (data || []).map(d => ({
      date: d.entry_date,
      value: d.mood_score,
    }));
  }

  private async getWorkoutData(): Promise<DataPoint[]> {
    const { data } = await supabase
      .from('workout_sessions')
      .select('workout_date')
      .eq('user_id', this.userId)
      .order('workout_date', { ascending: false })
      .limit(90);

    return (data || []).map(d => ({
      date: d.workout_date,
      value: 1,
    }));
  }

  private async getSkincareData(): Promise<DataPoint[]> {
    const { data } = await supabase
      .from('skincare_logs')
      .select('log_date')
      .eq('user_id', this.userId)
      .order('log_date', { ascending: false })
      .limit(90);

    return (data || []).map(d => ({
      date: d.log_date,
      value: 1,
    }));
  }

  private async getJournalData(): Promise<DataPoint[]> {
    const { data } = await supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', this.userId)
      .order('entry_date', { ascending: false })
      .limit(90);

    return (data || []).map(d => ({
      date: d.entry_date,
      value: 1,
    }));
  }

  private async getSleepData(): Promise<DataPoint[]> {
    const { data } = await supabase
      .from('wellness_logs')
      .select('log_date, sleep_hours')
      .eq('user_id', this.userId)
      .not('sleep_hours', 'is', null)
      .order('log_date', { ascending: false })
      .limit(90);

    return (data || []).map(d => ({
      date: d.log_date,
      value: d.sleep_hours,
    }));
  }
}

export class PatternDetector {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async detectPatterns() {
    const patterns = [];

    const streaks = await this.detectStreaks();
    patterns.push(...streaks);

    const improvements = await this.detectImprovements();
    patterns.push(...improvements);

    const declines = await this.detectDeclines();
    patterns.push(...declines);

    await this.savePatterns(patterns);
    return patterns;
  }

  private async detectStreaks() {
    const activities = ['skincare', 'workout', 'journal', 'hobby'];
    const patterns = [];

    for (const activity of activities) {
      const streak = await this.calculateStreak(activity);
      if (streak >= 7) {
        patterns.push({
          pattern_type: 'streak',
          activity_type: activity,
          strength: Math.min(streak / 30, 1),
          insight_text: `You're on a ${streak}-day ${activity} streak! Keep the momentum going.`,
          pattern_data: { streak_length: streak, activity },
        });
      }
    }

    return patterns;
  }

  private async detectImprovements() {
    const patterns = [];
    const moodData = await this.getMoodTrend();

    if (moodData.trend > 0.2 && moodData.count >= 14) {
      patterns.push({
        pattern_type: 'improvement',
        activity_type: 'mood',
        strength: Math.min(moodData.trend, 1),
        insight_text: `Your mood has improved by ${Math.round(moodData.trend * 100)}% over the past two weeks!`,
        pattern_data: { trend: moodData.trend, period: '14days' },
      });
    }

    return patterns;
  }

  private async detectDeclines() {
    const patterns = [];
    const moodData = await this.getMoodTrend();

    if (moodData.trend < -0.2 && moodData.count >= 14) {
      patterns.push({
        pattern_type: 'decline',
        activity_type: 'mood',
        strength: Math.abs(moodData.trend),
        insight_text: `Your mood has declined recently. Consider reviewing your wellness routines.`,
        pattern_data: { trend: moodData.trend, period: '14days' },
      });
    }

    return patterns;
  }

  private async calculateStreak(activity: string): Promise<number> {
    const tableMap: Record<string, string> = {
      skincare: 'skincare_logs',
      workout: 'workout_sessions',
      journal: 'journal_entries',
      hobby: 'hobby_logs',
    };

    const dateField = activity === 'workout' ? 'workout_date' : activity === 'journal' ? 'entry_date' : 'log_date';
    const table = tableMap[activity];

    if (!table) return 0;

    const { data } = await supabase
      .from(table)
      .select(dateField)
      .eq('user_id', this.userId)
      .order(dateField, { ascending: false })
      .limit(90);

    if (!data || data.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const logDate = new Date(data[i][dateField]);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (logDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  private async getMoodTrend(): Promise<{ trend: number; count: number }> {
    const { data } = await supabase
      .from('mood_entries')
      .select('entry_date, mood_score')
      .eq('user_id', this.userId)
      .gte('entry_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('entry_date', { ascending: true });

    if (!data || data.length < 5) return { trend: 0, count: 0 };

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const avgFirst = firstHalf.reduce((sum, d) => sum + d.mood_score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, d) => sum + d.mood_score, 0) / secondHalf.length;

    const trend = (avgSecond - avgFirst) / 5;

    return { trend, count: data.length };
  }

  private async savePatterns(patterns: any[]) {
    await supabase
      .from('user_patterns')
      .update({ is_active: false })
      .eq('user_id', this.userId);

    for (const pattern of patterns) {
      await supabase
        .from('user_patterns')
        .insert({
          user_id: this.userId,
          ...pattern,
          detected_at: new Date().toISOString(),
          is_active: true,
        });
    }
  }
}
