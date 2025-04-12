import axios from 'axios';
import { WorkflowAnalysis } from '../types';
import config from '../config/env';

const api = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${config.openAiApiKey}`,
    'Content-Type': 'application/json',
  },
});

const SYSTEM_PROMPT = `You are an AI assistant that analyzes URLs to identify tools and workflows. Your task is to:
1. Extract all tools mentioned in the content
2. Identify the primary purpose/category of each tool
3. Suggest relevant tags for the workflow
4. Create a descriptive name for the workflow

Format your response as a JSON object with the following structure:
{
  "suggestedName": "Brief but descriptive workflow name",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "identifiedTools": [
    {
      "name": "Tool name",
      "purpose": "Brief description of what this tool does",
      "primaryTag": "Primary category (e.g., 'video', 'animation', 'design')",
      "url": "Tool's website URL if mentioned"
    }
  ]
}`;

export async function analyzeUrl(url: string): Promise<WorkflowAnalysis> {
  try {
    console.log('Analyzing URL:', url);
    console.log('Using OpenAI API Key:', config.openAiApiKey.substring(0, 10) + '...');

    const response = await api.post('/chat/completions', {
      model: 'gpt-3.5-turbo-1106', // Using a specific version that supports JSON mode
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Please analyze this URL and provide information in the specified JSON format: ${url}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI Response:', response.data);

    const content = response.data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(content);
      
      // Validate the response structure
      if (!analysis.suggestedName || !Array.isArray(analysis.suggestedTags) || !Array.isArray(analysis.identifiedTools)) {
        console.error('Invalid response structure:', analysis);
        throw new Error('Invalid response format from OpenAI');
      }

      return analysis;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content:', content);
      // Fallback response if parsing fails
      return {
        suggestedName: 'New Workflow',
        suggestedTags: ['unspecified'],
        identifiedTools: [],
      };
    }
  } catch (error) {
    console.error('Error analyzing URL:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    throw error;
  }
} 