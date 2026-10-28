import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  BookOpen,
  Link as LinkIcon,
  Plus,
  Trash2,
  Search,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import {
  adminService,
  type TeacherSubjectMapping,
  type StudentEnrollmentMapping,
} from '../../services/admin.service';
import type { Subject, Profile } from '../../types/database';

export const AdminMappingPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // Active view tab: 'teachers' | 'students'
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');

  // Common reference data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTeachers, setActiveTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);

  // Teacher Mappings State
  const [teacherMappings, setTeacherMappings] = useState<TeacherSubjectMapping[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectIdForTeacher, setSelectedSubjectIdForTeacher] = useState('');
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);
  const [mappingToRemove, setMappingToRemove] = useState<TeacherSubjectMapping | null>(null);
  const [isRemovingTeacher, setIsRemovingTeacher] = useState(false);

  // Student Enrollments State
  const [enrollments, setEnrollments] = useState<StudentEnrollmentMapping[]>([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [searchEnrollment, setSearchEnrollment] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const pageSize = 8;
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<StudentEnrollmentMapping | null>(null);
  const [isRemovingEnrollment, setIsRemovingEnrollment] = useState(false);

  // Manual Enroll Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollSubjectId, setEnrollSubjectId] = useState('');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // 1. Fetch Reference Data (Subjects, Teachers, Students)
  const loadReferenceData = useCallback(async () => {
    try {
      const [subjectsData, teachersData, studentsData] = await Promise.all([
        adminService.getSubjects({ pageSize: 100 }),
        adminService.getUsers({ role: 'teacher', status: 'active', pageSize: 100 }),
        adminService.getUsers({ role: 'student', pageSize: 100 }),
      ]);
      setSubjects(subjectsData.subjects);
      setActiveTeachers(teachersData.users);
      setStudents(studentsData.users);

      if (subjectsData.subjects.length > 0) {
        setSelectedSubjectIdForTeacher(prev => prev || subjectsData.subjects[0].id);
        setEnrollSubjectId(prev => prev || subjectsData.subjects[0].id);
      }
      if (teachersData.users.length > 0) {
        setSelectedTeacherId(prev => prev || teachersData.users[0].id);
      }
      if (studentsData.users.length > 0) {
        setEnrollStudentId(prev => prev || studentsData.users[0].id);
      }
    } catch (err) {
      toastError('Failed to load reference data', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [toastError]);

  // 2. Fetch Teacher Mappings
  const fetchTeacherMappings = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      const mappings = await adminService.getTeacherMappings();
      setTeacherMappings(mappings);
    } catch (err) {
      toastError('Failed to load teacher mappings', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingTeachers(false);
    }
  }, [toastError]);

  // 3. Fetch Student Enrollments
  const fetchEnrollments = useCallback(async () => {
    setIsLoadingEnrollments(true);
    try {
      const data = await adminService.getStudentEnrollments({
        search: searchEnrollment,
        subjectId: subjectFilter,
        page: enrollmentPage,
        pageSize,
      });
      setEnrollments(data.enrollments);
      setTotalEnrollments(data.total);
    } catch (err) {
      toastError('Failed to load enrollments', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, [searchEnrollment, subjectFilter, enrollmentPage, pageSize, toastError]);

  useEffect(() => {
    loadReferenceData();
    fetchTeacherMappings();
  }, [loadReferenceData, fetchTeacherMappings]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Teacher Assignment Action Handlers
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectIdForTeacher) {
      toastError('Missing Selection', 'Please select both a faculty member and a subject.');
      return;
    }

    setIsAssigningTeacher(true);
    try {
      const result = await adminService.assignTeacherSubject(selectedTeacherId, selectedSubjectIdForTeacher);
      if (result.success) {
        const teacher = activeTeachers.find(t => t.id === selectedTeacherId);
        const subject = subjects.find(s => s.id === selectedSubjectIdForTeacher);
        success(
          'Faculty Assigned',
          `${teacher?.full_name || 'Educator'} was assigned to ${subject?.code || 'course'}.`
        );
        fetchTeacherMappings();
      } else {
        toastError('Assignment Failed', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to assign teacher.');
    } finally {
      setIsAssigningTeacher(false);
    }
  };

  const handleConfirmRemoveTeacher = async () => {
    if (!mappingToRemove) return;
    setIsRemovingTeacher(true);
    try {
      const result = await adminService.removeTeacherSubject(mappingToRemove.id);
      if (result.success) {
        info(
          'Assignment Removed',
          `${mappingToRemove.teacher_name} is no longer assigned to ${mappingToRemove.subject_code}.`
        );
        setMappingToRemove(null);
        fetchTeacherMappings();
      } else {
        toastError('Failed to remove assignment', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to remove assignment.');
    } finally {
      setIsRemovingTeacher(false);
    }
  };

  // Student Enrollment Action Handlers
  const handleConfirmRemoveEnrollment = async () => {
    if (!enrollmentToRemove) return;
    setIsRemovingEnrollment(true);
    try {
      const result = await adminService.removeStudentEnrollment(enrollmentToRemove.id);
      if (result.success) {
        info(
          'Enrollment Removed',
          `${enrollmentToRemove.student_name} was removed from ${enrollmentToRemove.subject_code}.`
        );
        setEnrollmentToRemove(null);
        fetchEnrollments();
      } else {
        toastError('Failed to remove enrollment', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to remove enrollment.');
    } finally {
      setIsRemovingEnrollment(false);
    }
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId || !enrollSubjectId) {
      toastError('Incomplete form', 'Please select both a student and a subject course.');
      return;
    }

    setIsSubmittingEnroll(true);
    try {
      const result = await adminService.enrollStudent(enrollStudentId, enrollSubjectId);
      if (result.success) {
        const student = students.find(s => s.id === enrollStudentId);
        const subject = subjects.find(sub => sub.id === enrollSubjectId);
        success(
          'Student Enrolled',
          `${student?.full_name || 'Student'} is now enrolled in ${subject?.code || 'course'}.`
        );
        setIsEnrollModalOpen(false);
        fetchEnrollments();
      } else {
        toastError('Enrollment Failed', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to enroll student.');
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Admin Center</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Curriculum & Faculty Mapping
            </h1>
            <Badge variant="amber" size="sm">
              <LinkIcon size={12} />
              <span>Relational Links</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assign authorized teachers to subjects and audit or remove student course enrollments.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'teachers'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap size={14} />
            <span>Teacher Assignments</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'teachers' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {teacherMappings.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'students'
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>Student Enrollments</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'students' ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {totalEnrollments}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: TEACHER TO SUBJECT ASSIGNMENTS */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {/* Quick Assign Form */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Assign Faculty Member to Subject
                </h3>
              </div>
            }
          >
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Granting subject assignment allows an approved teacher to create daily topics, publish AI-generated quizzes, and inspect cohort mastery metrics.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <Select
                  label="Verified Teacher"
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  options={
                    activeTeachers.length > 0
                      ? activeTeachers.map(t => ({
                          value: t.id,
                          label: `${t.full_name} (${t.email})`,
                        }))
                      : [{ value: '', label: 'No active teachers available' }]
                  }
                  disabled={activeTeachers.length === 0}
                />

                <Select
                  label="Curriculum Subject"
                  value={selectedSubjectIdForTeacher}
                  onChange={e => setSelectedSubjectIdForTeacher(e.target.value)}
                  options={
                    subjects.length > 0
                      ? subjects.map(s => ({
                          value: s.id,
                          label: `${s.code} - ${s.name}`,
                        }))
                      : [{ value: '', label: 'No subjects created' }]
                  }
                  disabled={subjects.length === 0}
                />

                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<Plus size={14} />}
                  isLoading={isAssigningTeacher}
                  disabled={activeTeachers.length === 0 || subjects.length === 0}
                  className="w-full sm:w-auto"
                >
                  Assign to Course
                </Button>
              </div>

              {activeTeachers.length === 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                  <span>Note: Only approved faculty with status=active appear here. Check the </span>
                  <Link to="/admin/users" className="underline font-bold hover:text-amber-700">
                    Users tab
                  </Link>
                  <span> to approve pending educators.</span>
                </div>
              )}
            </form>
          </Card>

          {/* Teacher Mappings Catalog Table */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Active Faculty Assignments ({teacherMappings.length})
                  </h3>
                </div>
                <Badge variant="slate" size="sm">
                  <span>Enforced by Postgres RLS</span>
                </Badge>
              </div>
            }
          >
            {isLoadingTeachers ? (
              <div className="space-y-3 p-4">
                <Skeleton height={40} className="w-full" />
                <Skeleton height={40} className="w-full" />
                <Skeleton height={40} className="w-full" />
              </div>
            ) : teacherMappings.length === 0 ? (
              <EmptyState
                icon={<GraduationCap size={32} />}
                title="No Teacher Mappings Configured"
                description="Assign approved educators to courses above to delegate quiz creation and syllabus management."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Faculty Member</th>
                      <th className="py-3 px-4">Course Subject</th>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Assigned On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {teacherMappings.map(mapping => (
                      <tr
                        key={mapping.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                              <GraduationCap size={15} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {mapping.teacher_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {mapping.teacher_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {mapping.subject_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="cyan" size="sm">
                            <span>{mapping.subject_code}</span>
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{new Date(mapping.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMappingToRemove(mapping)}
                            title="Remove assignment"
                            aria-label={`Remove assignment for ${mapping.teacher_name}`}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} className="mr-1" />
                            <span>Remove</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: STUDENT ENROLLMENTS */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Subject Filter, Manual Enroll */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <Input
                  placeholder="Search student name, email, or subject code..."
                  value={searchEnrollment}
                  onChange={e => {
                    setSearchEnrollment(e.target.value);
                    setEnrollmentPage(1);
                  }}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="w-full sm:w-56">
                <Select
                  value={subjectFilter}
                  onChange={e => {
                    setSubjectFilter(e.target.value);
                    setEnrollmentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All Subjects' },
                    ...subjects.map(s => ({
                      value: s.id,
                      label: `${s.code} - ${s.name}`,
                    })),
                  ]}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsEnrollModalOpen(true)}
            >
              Manual Enroll
            </Button>
          </div>

          {/* Student Enrollments Table */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-cyan-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Student Enrollments ({totalEnrollments})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Showing page {enrollmentPage} of {Math.max(1, Math.ceil(totalEnrollments / pageSize))}
                </span>
              </div>
            }
          >
            {isLoadingEnrollments ? (
              <div className="space-y-3 p-4">
                <Skeleton height={40} className="w-full" />
                <Skeleton height={40} className="w-full" />
                <Skeleton height={40} className="w-full" />
              </div>
            ) : enrollments.length === 0 ? (
              <EmptyState
                icon={<Users size={32} />}
                title="No Enrollments Found"
                description={
                  searchEnrollment || subjectFilter !== 'all'
                    ? 'No student enrollments match your filter criteria.'
                    : 'Students register with a course code or can be enrolled manually above.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Enrolled Course</th>
                      <th className="py-3 px-4">Course Code</th>
                      <th className="py-3 px-4">Enrollment Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {enrollments.map(enr => (
                      <tr
                        key={enr.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                              <Users size={15} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {enr.student_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {enr.student_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {enr.subject_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="cyan" size="sm">
                            <span>{enr.subject_code}</span>
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{new Date(enr.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEnrollmentToRemove(enr)}
                            title="Remove student enrollment"
                            aria-label={`Remove enrollment for ${enr.student_name}`}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} className="mr-1" />
                            <span>Remove</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingEnrollments && totalEnrollments > pageSize && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={enrollmentPage}
                  totalItems={totalEnrollments}
                  pageSize={pageSize}
                  onPageChange={setEnrollmentPage}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* CONFIRM REMOVE TEACHER DIALOG */}
      <ConfirmDialog
        isOpen={!!mappingToRemove}
        onClose={() => setMappingToRemove(null)}
        onConfirm={handleConfirmRemoveTeacher}
        title="Remove Faculty Assignment"
        message={
          mappingToRemove
            ? `Are you sure you want to remove ${mappingToRemove.teacher_name} from ${mappingToRemove.subject_code}? The educator will lose access to authoring assignments and inspecting mastery reports for this course.`
            : ''
        }
        confirmText="Remove Assignment"
        isDestructive
        isLoading={isRemovingTeacher}
      />

      {/* CONFIRM REMOVE STUDENT ENROLLMENT DIALOG */}
      <ConfirmDialog
        isOpen={!!enrollmentToRemove}
        onClose={() => setEnrollmentToRemove(null)}
        onConfirm={handleConfirmRemoveEnrollment}
        title="Remove Student Enrollment"
        message={
          enrollmentToRemove
            ? `Are you sure you want to remove ${enrollmentToRemove.student_name} from ${enrollmentToRemove.subject_code}? The student will lose access to assignments, quizzes, and recommendation practice for this subject.`
            : ''
        }
        confirmText="Remove Enrollment"
        isDestructive
        isLoading={isRemovingEnrollment}
      />

      {/* MANUAL ENROLL MODAL */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Manual Student Enrollment"
        description="Link a registered student directly to a course subject."
      >
        <form onSubmit={handleManualEnroll} className="space-y-4">
          <Select
            label="Select Student"
            value={enrollStudentId}
            onChange={e => setEnrollStudentId(e.target.value)}
            options={
              students.length > 0
                ? students.map(s => ({
                    value: s.id,
                    label: `${s.full_name} (${s.email})`,
                  }))
                : [{ value: '', label: 'No students registered' }]
            }
            disabled={students.length === 0}
            required
          />

          <Select
            label="Select Course Subject"
            value={enrollSubjectId}
            onChange={e => setEnrollSubjectId(e.target.value)}
            options={
              subjects.length > 0
                ? subjects.map(s => ({
                    value: s.id,
                    label: `${s.code} - ${s.name}`,
                  }))
                : [{ value: '', label: 'No subjects available' }]
            }
            disabled={subjects.length === 0}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEnrollModalOpen(false)}
              disabled={isSubmittingEnroll}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingEnroll}
              disabled={students.length === 0 || subjects.length === 0}
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
