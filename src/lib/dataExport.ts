import { supabase } from './supabase';

export interface ExportData {
  profile: any;
  tasks: any[];
  routines: any[];
  goals: any[];
  journal_entries: any[];
  mood_entries: any[];
  expenses: any[];
  exportDate: string;
  exportVersion: string;
}

export async function exportUserData(userId: string): Promise<ExportData> {
  const exportData: ExportData = {
    profile: null,
    tasks: [],
    routines: [],
    goals: [],
    journal_entries: [],
    mood_entries: [],
    expenses: [],
    exportDate: new Date().toISOString(),
    exportVersion: '1.0'
  };

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    exportData.profile = profile;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    exportData.tasks = tasks || [];

    const { data: routines } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    exportData.routines = routines || [];

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    exportData.goals = goals || [];

    const { data: journal } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    exportData.journal_entries = journal || [];

    const { data: moods } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId);
    exportData.mood_entries = moods || [];

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    exportData.expenses = expenses || [];

    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

export function downloadJSON(data: ExportData, filename: string = 'lumibud-data-export.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
