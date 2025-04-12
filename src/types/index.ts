export interface Tool {
  id: string;
  name: string;
  url: string;
  primaryTag: string;
  createdAt: Date;
}

export type NewTool = Omit<Tool, 'id' | 'createdAt'>;

export interface Workflow {
  id: string;
  name: string;
  sourceUrl: string;
  createdAt: Date;
  tags: string[];
  tools: Tool[];
}

export type NewWorkflow = Omit<Workflow, 'id' | 'createdAt'> & {
  tools: NewTool[];
};

export interface WorkflowAnalysis {
  suggestedName: string;
  suggestedTags: string[];
  identifiedTools: {
    name: string;
    purpose: string;
    primaryTag: string;
    url?: string;
  }[];
} 