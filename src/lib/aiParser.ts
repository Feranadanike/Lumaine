export interface ParsedAction {
  type: 'workout' | 'skincare' | 'goal' | 'journal' | 'hobby' | 'savings';
  data: any;
}

export function parseAIResponse(response: string): {
  cleanedResponse: string;
  actions: ParsedAction[];
} {
  const actions: ParsedAction[] = [];
  let cleanedResponse = response;

  const patterns = [
    {
      type: 'workout' as const,
      start: '[WORKOUT_PLAN]',
      end: '[/WORKOUT_PLAN]',
    },
    {
      type: 'skincare' as const,
      start: '[SKINCARE_ROUTINE]',
      end: '[/SKINCARE_ROUTINE]',
    },
    {
      type: 'goal' as const,
      start: '[GOAL]',
      end: '[/GOAL]',
    },
    {
      type: 'journal' as const,
      start: '[JOURNAL_PROMPT]',
      end: '[/JOURNAL_PROMPT]',
    },
    {
      type: 'hobby' as const,
      start: '[HOBBY]',
      end: '[/HOBBY]',
    },
    {
      type: 'savings' as const,
      start: '[SAVINGS_GOAL]',
      end: '[/SAVINGS_GOAL]',
    },
  ];

  patterns.forEach(({ type, start, end }) => {
    const startIndex = cleanedResponse.indexOf(start);
    if (startIndex !== -1) {
      const endIndex = cleanedResponse.indexOf(end, startIndex);
      if (endIndex !== -1) {
        const fullBlock = cleanedResponse.substring(startIndex, endIndex + end.length);
        const jsonStr = cleanedResponse.substring(startIndex + start.length, endIndex).trim();
        try {
          const data = JSON.parse(jsonStr);
          actions.push({ type, data });
          cleanedResponse = cleanedResponse.replace(fullBlock, '').trim();
        } catch (error) {
          console.error(`Failed to parse ${type} data:`, error);
        }
      }
    }
  });

  return { cleanedResponse, actions };
}
