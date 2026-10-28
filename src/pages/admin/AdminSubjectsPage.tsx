import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { adminService } from '../../services/admin.service';
import type { Subject, Topic } from '../../types/database';

export const AdminSubjectsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected Subject for Topic Management
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);

  // Subject Modals State
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Subject Form State
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  // Topic Modals State
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // Topic Form State
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicOrder, setTopicOrder] = useState<number>(1);
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubjects({
        search,
        page: currentPage,
        pageSize,
      });
      setSubjects(data.subjects);
      setTotalCount(data.total);

      // Auto-select first subject if none selected
      if (!selectedSubject && data.subjects.length > 0) {
        setSelectedSubject(data.subjects[0]);
      }
    } catch (err) {
      toastError('Failed to load subjects', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [search, currentPage, pageSize, selectedSubject, toastError]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Load topics whenever selectedSubject changes
  const loadTopicsForSubject = useCallback(async (subjectId: string) => {
    setIsTopicsLoading(true);
    try {
      const list = await adminService.getTopicsBySubject(subjectId);
      setTopics(list);
    } catch (err) {
      toastError('Failed to load topics', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsTopicsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (selectedSubject) {
      loadTopicsForSubject(selectedSubject.id);
    } else {
      setTopics([]);
    }
  }, [selectedSubject, loadTopicsForSubject]);

  // Generate unique code helper
  const handleGenerateCode = () => {
    const existingCodes = subjects.map((s) => s.code);
    const code = adminService.generateSubjectCode(subjectName, existingCodes);
    setSubjectCode(code);
  };

  // Open Create Subject Modal
  const openCreateSubject = () => {
    setSubjectName('');
    setSubjectCode('');
    setSubjectDesc('');
    setIsCreateSubjectOpen(true);
  };

  // Open Edit Subject Modal
  const openEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectName(sub.name);
    setSubjectCode(sub.code);
    setSubjectDesc(sub.description || '');
  };

  // Save Subject (Create or Edit)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) {
      toastError('Missing fields', 'Subject name and unique code are required.');
      return;
    }

    setIsSavingSubject(true);
    try {
      if (editingSubject) {
        const res = await adminService.updateSubject(editingSubject.id, {
          name: subjectName,
          code: subjectCode,
          description: subjectDesc,
        });
        if (res.success) {
          success('Subject Updated', `Updated "${subjectName}" (${subjectCode}).`);
          setEditingSubject(null);
          fetchSubjects();
          if (selectedSubject?.id === editingSubject.id) {
            setSelectedSubject({ ...editingSubject, name: subjectName, code: subjectCode, description: subjectDesc });
          }
        } else {
          toastError('Update failed', res.error);
        }
      } else {
        const res = await adminService.createSubject({
          name: subjectName,
          code: subjectCode,
          description: subjectDesc,
        });
        if (res.success && res.subject) {
          success('Subject Created', `Created course "${res.subject.name}" (${res.subject.code}).`);
          setIsCreateSubjectOpen(false);
          fetchSubjects();
          setSelectedSubject(res.subject);
        } else {
          toastError('Creation failed', res.error);
        }
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Subject operation failed');
    } finally {
      setIsSavingSubject(false);
    }
  };

  // Delete Subject Confirm
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      const res = await adminService.deleteSubject(subjectToDelete.id);
      if (res.success) {
        success('Subject Deleted', `Removed "${subjectToDelete.name}".`);
        if (selectedSubject?.id === subjectToDelete.id) {
          setSelectedSubject(null);
        }
        setSubjectToDelete(null);
        fetchSubjects();
      } else {
        toastError('Deletion failed', res.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Open Create Topic Modal
  const openCreateTopic = () => {
    if (!selectedSubject) return;
    setTopicName('');
    setTopicSlug('');
    setTopicDesc('');
    setTopicOrder(topics.length + 1);
    setIsCreateTopicOpen(true);
  };

  // Open Edit Topic Modal
  const openEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setTopicName(t.name);
    setTopicSlug(t.slug);
    setTopicDesc(t.description || '');
    setTopicOrder(t.order_index);
  };

  // Save Topic (Create or Edit)
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !topicName.trim()) {
      toastError('Missing fields', 'Topic name is required.');
      return;
    }

    setIsSavingTopic(true);
    try {
      if (editingTopic) {
        const res = await adminService.updateTopic(editingTopic.id, {
          name: topicName,
          slug: topicSlug,
          description: topicDesc,
          order_index: topicOrder,
        });
        if (res.success) {
          success('Topic Updated', `Updated topic "${topicName}".`);
          setEditingTopic(null);
          loadTopicsForSubject(selectedSubject.id);
        } else {
          toastError('Update failed', res.error);
        }
      } else {
        const res = await adminService.createTopic({
          subject_id: selectedSubject.id,
          name: topicName,
          slug: topicSlug,
          description: topicDesc,
          order_index: topicOrder,
        });
        if (res.success) {
          success('Topic Added', `Added topic "${topicName}" to ${selectedSubject.name}.`);
          setIsCreateTopicOpen(false);
          loadTopicsForSubject(selectedSubject.id);
        } else {
          toastError('Creation failed', res.error);
        }
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Topic operation failed');
    } finally {
      setIsSavingTopic(false);
    }
  };

  // Delete Topic Confirm
  const confirmDeleteTopic = async () => {
    if (!topicToDelete || !selectedSubject) return;
    try {
      const res = await adminService.deleteTopic(topicToDelete.id);
      if (res.success) {
        success('Topic Deleted', `Removed topic "${topicToDelete.name}".`);
        setTopicToDelete(null);
        loadTopicsForSubject(selectedSubject.id);
      } else {
        toastError('Deletion failed', res.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Back button */}
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Admin Center</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Curriculum Subjects & Topics Management
            </h1>
            <Badge variant="cyan" size="sm">Syllabus Architecture</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define institutional subjects, generate unique course codes, and organize sequential learning topics.
          </p>
        </div>

        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreateSubject}>
          Add New Subject
        </Button>
      </div>

      {/* Main Grid: Left = Subjects List; Right = Topic Manager */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <Input
              id="search-subjects"
              label="Search Subjects"
              placeholder="Filter by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton height={90} className="w-full rounded-2xl" />
              <Skeleton height={90} className="w-full rounded-2xl" />
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={30} />}
              title="No Subjects Found"
              description="No curriculum subjects currently match your search."
              actionText="Create First Subject"
              onAction={openCreateSubject}
            />
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => {
                const isSelected = selectedSubject?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {sub.name}
                        </span>
                        <Badge variant="cyan" size="sm">
                          {sub.code}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-slate-500 hover:text-cyan-600"
                          onClick={() => openEditSubject(sub)}
                          title="Edit subject details"
                          aria-label={`Edit ${sub.name}`}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-slate-500 hover:text-rose-600"
                          onClick={() => setSubjectToDelete(sub)}
                          title="Delete subject"
                          aria-label={`Delete ${sub.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sub.description || 'No course syllabus description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span>Click to view & manage topics</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
                          <CheckCircle2 size={12} />
                          Active selection
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <Pagination
                currentPage={currentPage}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Topics Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSubject ? (
            <Card
              header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Layers size={18} className="text-cyan-500" />
                      <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        Topics for {selectedSubject.name}
                      </h2>
                      <Badge variant="slate" size="sm">{selectedSubject.code}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sequential syllabus topics used for daily topic assignments and adaptive practice.
                    </p>
                  </div>

                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreateTopic}>
                    Add Topic
                  </Button>
                </div>
              }
            >
              {isTopicsLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton height={50} className="w-full" />
                  <Skeleton height={50} className="w-full" />
                  <Skeleton height={50} className="w-full" />
                </div>
              ) : topics.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<Layers size={28} />}
                    title="No Topics Defined"
                    description={`There are currently no topics defined for ${selectedSubject.name}. Add your first topic below.`}
                    actionText="Add First Topic"
                    onAction={openCreateTopic}
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <ArrowUpDown size={10} />
                            #{t.order_index}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {t.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            /{t.slug}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-slate-500 hover:text-cyan-600"
                          onClick={() => openEditTopic(t)}
                          title="Edit topic"
                          aria-label={`Edit ${t.name}`}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-slate-500 hover:text-rose-600"
                          onClick={() => setTopicToDelete(t)}
                          title="Delete topic"
                          aria-label={`Delete ${t.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="text-center py-12">
              <EmptyState
                icon={<BookOpen size={32} />}
                title="Select a Subject"
                description="Select a subject from the left column to view, reorder, and configure its topics."
              />
            </Card>
          )}
        </div>
      </div>

      {/* CREATE / EDIT SUBJECT MODAL */}
      <Modal
        isOpen={isCreateSubjectOpen || Boolean(editingSubject)}
        onClose={() => {
          setIsCreateSubjectOpen(false);
          setEditingSubject(null);
        }}
        title={editingSubject ? 'Edit Curriculum Subject' : 'Create New Subject'}
        description="Provide a descriptive title, unique course code, and syllabus summary."
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <Input
            id="sub-name"
            label="Subject Name"
            placeholder="e.g. Operating Systems & Kernel Architecture"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
            disabled={isSavingSubject}
          />

          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id="sub-code"
                  label="Course Code (Unique)"
                  placeholder="e.g. CS201"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  required
                  disabled={isSavingSubject}
                  helperText="Unique uppercase identifier students use to self-enroll."
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mb-6 whitespace-nowrap"
                leftIcon={<Sparkles size={14} className="text-cyan-500" />}
                onClick={handleGenerateCode}
                title="Automatically generate code from subject name"
              >
                Generate Code
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sub-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Syllabus Summary
            </label>
            <textarea
              id="sub-desc"
              rows={3}
              value={subjectDesc}
              onChange={(e) => setSubjectDesc(e.target.value)}
              placeholder="Outline the core topics and learning goals..."
              disabled={isSavingSubject}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateSubjectOpen(false);
                setEditingSubject(null);
              }}
              disabled={isSavingSubject}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingSubject}>
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE SUBJECT */}
      <ConfirmDialog
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={confirmDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}" (${subjectToDelete?.code})? This will delete all its child topics and cascade enrollments.`}
        confirmText="Delete Subject"
        isDestructive
      />

      {/* CREATE / EDIT TOPIC MODAL */}
      <Modal
        isOpen={isCreateTopicOpen || Boolean(editingTopic)}
        onClose={() => {
          setIsCreateTopicOpen(false);
          setEditingTopic(null);
        }}
        title={editingTopic ? 'Edit Syllabus Topic' : `Add Topic to ${selectedSubject?.name}`}
        description="Configure topic title, url-friendly slug, description, and sequence order."
      >
        <form onSubmit={handleSaveTopic} className="space-y-4">
          <Input
            id="topic-name"
            label="Topic Name"
            placeholder="e.g. Memory Allocation & Heap Fragmentation"
            value={topicName}
            onChange={(e) => {
              setTopicName(e.target.value);
              if (!editingTopic) {
                setTopicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
              }
            }}
            required
            disabled={isSavingTopic}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="topic-slug"
              label="URL Slug"
              placeholder="e.g. heap-memory"
              value={topicSlug}
              onChange={(e) => setTopicSlug(e.target.value.toLowerCase())}
              required
              disabled={isSavingTopic}
            />

            <Input
              id="topic-order"
              label="Sequence Order"
              type="number"
              min={1}
              value={topicOrder}
              onChange={(e) => setTopicOrder(parseInt(e.target.value, 10) || 1)}
              required
              disabled={isSavingTopic}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="topic-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Concept Description
            </label>
            <textarea
              id="topic-desc"
              rows={3}
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Describe concepts covered in this topic..."
              disabled={isSavingTopic}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateTopicOpen(false);
                setEditingTopic(null);
              }}
              disabled={isSavingTopic}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingTopic}>
              {editingTopic ? 'Save Topic' : 'Add Topic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE TOPIC */}
      <ConfirmDialog
        isOpen={Boolean(topicToDelete)}
        onClose={() => setTopicToDelete(null)}
        onConfirm={confirmDeleteTopic}
        title="Delete Topic"
        message={`Are you sure you want to delete topic "${topicToDelete?.name}"? Questions referencing this topic will be affected.`}
        confirmText="Delete Topic"
        isDestructive
      />
    </div>
  );
};
