import { createClient } from '@supabase/supabase-js';
import { Tool, Workflow, NewWorkflow } from '../types';
import config from '../config/env';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

export async function createWorkflow(workflow: NewWorkflow) {
  try {
    // First, create the workflow
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .insert([{
        name: workflow.name,
        source_url: workflow.sourceUrl,
        tags: workflow.tags,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Then, create tools and relationships
    if (workflow.tools.length > 0) {
      // Create tools
      const toolInserts = workflow.tools.map(tool => ({
        name: tool.name,
        url: tool.url,
        primary_tag: tool.primaryTag,
        created_at: new Date().toISOString(),
      }));

      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .insert(toolInserts)
        .select();

      if (toolsError) throw toolsError;

      // Create workflow-tool relationships
      if (toolsData) {
        const relationships = toolsData.map(tool => ({
          workflow_id: workflowData.id,
          tool_id: tool.id,
        }));

        const { error: relError } = await supabase
          .from('workflow_tools')
          .insert(relationships);

        if (relError) throw relError;
      }
    }

    return workflowData;
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }
}

export async function getWorkflows() {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        workflow_tools (
          tools (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('Fetched workflows:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }
}

export async function getWorkflowById(id: string) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        workflow_tools (
          tools (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    console.log('Fetched workflow by id:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    throw error;
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workflow:', error);
    throw error;
  }
}

export async function updateWorkflowName(id: string, name: string) {
  try {
    const { error } = await supabase
      .from('workflows')
      .update({ name })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating workflow name:', error);
    throw error;
  }
}

export async function updateWorkflowTags(id: string, tags: string[]) {
  try {
    const { error } = await supabase
      .from('workflows')
      .update({ tags })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating workflow tags:', error);
    throw error;
  }
} 