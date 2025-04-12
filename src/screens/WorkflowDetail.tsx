import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import type { RootStackScreenProps } from '@navigation/types';
import { getWorkflowById } from '../services/supabase';
import type { Workflow } from '../types';

export default function WorkflowDetail({ route }: RootStackScreenProps<'WorkflowDetail'>) {
  const { id } = route.params;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getWorkflowById(id);
      console.log('Workflow data:', data); // Debug log
      
      // Transform the data to match our Workflow type
      const transformedWorkflow: Workflow = {
        id: data.id,
        name: data.name,
        sourceUrl: data.source_url,
        createdAt: new Date(data.created_at),
        tags: data.tags || [],
        tools: data.workflow_tools?.map((wt: any) => ({
          id: wt.tools.id,
          name: wt.tools.name,
          url: wt.tools.url,
          primaryTag: wt.tools.primary_tag,
          createdAt: new Date(wt.tools.created_at)
        })) || []
      };
      
      setWorkflow(transformedWorkflow);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !workflow) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Workflow not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workflow.name}</Text>
        {workflow.sourceUrl && (
          <Text 
            style={styles.sourceUrl}
            onPress={() => Linking.openURL(workflow.sourceUrl)}
          >
            Source: {workflow.sourceUrl}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagContainer}>
          {(workflow.tags || []).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tools Used</Text>
        {workflow.tools && workflow.tools.length > 0 ? (
          workflow.tools.map((tool) => (
            <View key={tool.id} style={styles.toolItem}>
              <Text style={styles.toolName}>{tool.name}</Text>
              {tool.primaryTag && (
                <Text style={styles.toolTag}>{tool.primaryTag}</Text>
              )}
              {tool.url && (
                <Text 
                  style={styles.toolUrl}
                  onPress={() => Linking.openURL(tool.url)}
                >
                  {tool.url}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No tools found for this workflow</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceUrl: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
  },
  toolItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  toolTag: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  toolUrl: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
}); 