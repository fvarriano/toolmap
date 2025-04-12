import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import type { RootStackScreenProps } from '@navigation/types';
import { useUrlAnalysis } from '../hooks/useUrlAnalysis';
import { getWorkflows, deleteWorkflow, updateWorkflowName, updateWorkflowTags } from '../services/supabase';
import type { Workflow } from '../types';

export default function Dashboard({ navigation }: RootStackScreenProps<'Dashboard'>) {
  const [url, setUrl] = useState('');
  const { analyze, isLoading: isAnalyzing, error: analysisError } = useUrlAnalysis();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isOptionsVisible, setOptionsVisible] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isTagsVisible, setTagsVisible] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoadingWorkflows(true);
      const data = await getWorkflows();
      // Transform the data to match our Workflow type
      const transformedWorkflows = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        sourceUrl: item.source_url,
        createdAt: new Date(item.created_at),
        tags: item.tags || [],
        tools: item.workflow_tools?.map((wt: any) => ({
          id: wt.tools.id,
          name: wt.tools.name,
          url: wt.tools.url,
          primaryTag: wt.tools.primary_tag,
          createdAt: new Date(wt.tools.created_at)
        })) || []
      }));
      setWorkflows(transformedWorkflows);
    } catch (err) {
      console.error('Error loading workflows:', err);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    try {
      // Basic URL validation
      let urlToAnalyze = url.trim();
      if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
        urlToAnalyze = 'https://' + urlToAnalyze;
      }

      console.log('Submitting URL for analysis:', urlToAnalyze);
      const analysis = await analyze(urlToAnalyze);
      console.log('Analysis result:', analysis);

      // Clear the input and refresh workflows
      setUrl('');
      loadWorkflows();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      Alert.alert(
        'Error',
        'Failed to analyze URL. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    Alert.alert(
      'Delete Workflow',
      `Are you sure you want to delete "${workflow.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkflow(workflow.id);
              loadWorkflows(); // Refresh the list
              Alert.alert('Success', 'Workflow deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete workflow');
            }
          },
        },
      ]
    );
  };

  const handleRename = async () => {
    if (!selectedWorkflow || !newName.trim()) return;

    try {
      await updateWorkflowName(selectedWorkflow.id, newName.trim());
      loadWorkflows(); // Refresh the list
      setIsRenaming(false);
      setSelectedWorkflow(null);
      setNewName('');
    } catch (err) {
      Alert.alert('Error', 'Failed to rename workflow');
    }
  };

  const handleAddTag = async () => {
    if (!selectedWorkflow || !newTag.trim()) return;

    try {
      const trimmedTag = newTag.trim().toLowerCase();
      const currentTags = selectedWorkflow.tags || [];
      
      if (currentTags.includes(trimmedTag)) {
        Alert.alert('Error', 'This tag already exists');
        return;
      }

      const updatedTags = [...currentTags, trimmedTag];
      await updateWorkflowTags(selectedWorkflow.id, updatedTags);
      loadWorkflows(); // Refresh the list
      setNewTag('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add tag');
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!selectedWorkflow) return;

    try {
      const updatedTags = selectedWorkflow.tags.filter(tag => tag !== tagToDelete);
      await updateWorkflowTags(selectedWorkflow.id, updatedTags);
      loadWorkflows(); // Refresh the list
    } catch (err) {
      Alert.alert('Error', 'Failed to delete tag');
    }
  };

  const showOptions = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setOptionsVisible(true);
  };

  const startRenaming = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setNewName(workflow.name);
    setIsRenaming(true);
    setOptionsVisible(false);
  };

  const showTags = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setTagsVisible(true);
  };

  const renderWorkflowItem = (workflow: Workflow) => (
    <View key={workflow.id} style={styles.workflowItem}>
      <TouchableOpacity
        style={styles.workflowContent}
        onPress={() => navigation.navigate('WorkflowDetail', { id: workflow.id })}
      >
        <View style={styles.workflowHeader}>
          <Text style={styles.workflowName}>{workflow.name}</Text>
          <Text style={styles.workflowDate}>
            {new Date(workflow.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tagContainer}>
          {workflow.tags && workflow.tags.length > 0 ? (
            <>
              {workflow.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {workflow.tags.length > 3 && (
                <Text style={styles.moreText}>+{workflow.tags.length - 3} more</Text>
              )}
            </>
          ) : (
            <Text style={styles.noTagsText}>No tags</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() => showOptions(workflow)}
      >
        <Text style={styles.optionsButtonText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a URL to start"
          placeholderTextColor="#666"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isAnalyzing}
          keyboardType="url"
          autoComplete="off"
        />
        <TouchableOpacity 
          style={[styles.button, isAnalyzing && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isAnalyzing}
        >
          <Text style={styles.buttonText}>
            {isAnalyzing ? 'Analyzing...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>

      {analysisError && (
        <Text style={styles.errorText}>{analysisError}</Text>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Previous Workflows</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WorkflowList')}>
            <Text style={styles.seeMore}>See more</Text>
          </TouchableOpacity>
        </View>

        {isLoadingWorkflows ? (
          <ActivityIndicator style={styles.loader} color="#007AFF" />
        ) : workflows.length > 0 ? (
          <View style={styles.workflowList}>
            {workflows.slice(0, 3).map(renderWorkflowItem)}
          </View>
        ) : (
          <Text style={styles.emptyText}>No workflows yet</Text>
        )}
      </View>

      {/* Options Modal */}
      <Modal
        visible={isOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsVisible(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                if (selectedWorkflow) startRenaming(selectedWorkflow);
              }}
            >
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                if (selectedWorkflow) {
                  setOptionsVisible(false);
                  setTagsVisible(true);
                }
              }}
            >
              <Text style={styles.optionText}>Manage Tags</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => {
                setOptionsVisible(false);
                if (selectedWorkflow) handleDelete(selectedWorkflow);
              }}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={isRenaming}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenaming(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsRenaming(false)}
        >
          <View style={styles.renameModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workflow</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsRenaming(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsRenaming(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleRename}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tags Modal */}
      <Modal
        visible={isTagsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTagsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTagsVisible(false)}
        >
          <View style={styles.tagsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Tags</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTagsVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.currentTags}>
              {selectedWorkflow?.tags?.map((tag, index) => (
                <View key={index} style={styles.managedTag}>
                  <Text style={styles.managedTagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteTag(tag)}
                    style={styles.deleteTagButton}
                  >
                    <Text style={styles.deleteTagText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add new tag"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={[styles.addTagButton, !newTag.trim() && styles.addTagButtonDisabled]}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Text style={styles.addTagButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setTagsVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeMore: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
  },
  workflowList: {
    gap: 12,
  },
  workflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  workflowContent: {
    flex: 1,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  workflowDate: {
    fontSize: 14,
    color: '#666',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  optionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  optionsButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#007AFF',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteText: {
    fontSize: 16,
    color: '#ff3b30',
  },
  renameModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addTagsText: {
    color: '#007AFF',
    fontSize: 14,
  },
  tagsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  currentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  managedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
  },
  managedTagText: {
    fontSize: 14,
    color: '#495057',
    marginRight: 4,
  },
  deleteTagButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTagText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 20,
  },
  addTagContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noTagsText: {
    color: '#666',
    fontSize: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    lineHeight: 22,
  },
}); 