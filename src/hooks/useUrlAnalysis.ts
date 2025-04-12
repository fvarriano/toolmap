import { useState } from 'react';
import { analyzeUrl } from '../services/openai';
import { createWorkflow } from '../services/supabase';
import type { WorkflowAnalysis, NewWorkflow } from '../types';

export function useUrlAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Analyze URL using OpenAI
      const analysis = await analyzeUrl(url);

      // Create workflow in Supabase
      const newWorkflow: NewWorkflow = {
        name: analysis.suggestedName,
        sourceUrl: url,
        tags: analysis.suggestedTags,
        tools: analysis.identifiedTools.map(tool => ({
          name: tool.name,
          url: tool.url || '',
          primaryTag: tool.primaryTag,
        })),
      };

      await createWorkflow(newWorkflow);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyze,
    isLoading,
    error,
  };
} 