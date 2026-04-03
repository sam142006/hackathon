import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaList,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaRocket,
  FaSearch,
  FaSpinner,
  FaThLarge,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  createRecruiterJob,
  downloadCandidateResume,
  getJobApplications,
  getRecruiterJobs,
  getSkillGapRoadmap,
  mapApplicationFromApi,
  mapJobFromApi,
  toggleRecruiterJobStatus,
  updateApplicationStatus,
} from '../utils/jobs';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const createInitialFormData = () => ({
  title: '',
  description: '',
  skills: '',
  experience: '',
  packageValue: '',
  location: '',
});

const APPLICATION_STATUSES = ['PENDING', 'INTERVIEW', 'REJECTED', 'HIRED'];

const getStatusClasses = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (normalized === 'INACTIVE') return 'bg-gray-100 text-gray-700';
  if (normalized === 'INTERVIEW') return 'bg-blue-100 text-blue-700';
  if (normalized === 'REJECTED') return 'bg-red-100 text-red-700';
  if (normalized === 'HIRED') return 'bg-emerald-100 text-emerald-700';
  return 'bg-yellow-100 text-yellow-700';
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [skillGapLoadingId, setSkillGapLoadingId] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(createInitialFormData);
  const [statusUpdateData, setStatusUpdateData] = useState({});

  const userName = localStorage.getItem('userName') || 'Sarah Johnson';
  const userEmail = localStorage.getItem('userEmail') || 'sarah.johnson@company.com';
  const userAvatar = userName.split(' ').map((name) => name[0]).join('');

  const withAuth = async (request) => {
    const token = getStoredToken();
    if (!token) {
      clearSession();
      navigate('/', { replace: true });
      return null;
    }
    const response = await request(token);
    if (response.status === 401 || response.status === 403) {
      clearSession();
      navigate('/', { replace: true });
      return null;
    }
    return response;
  };

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await withAuth((token) => getRecruiterJobs(token));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to load recruiter jobs.');
      const jobList = Array.isArray(data) ? data : data.jobs ?? [];
      setJobs(jobList.map(mapJobFromApi));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load recruiter jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company.toLowerCase().includes(normalizedSearch) ||
        job.location.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filterStatus === 'all' || job.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, jobs, searchTerm]);

  const stats = useMemo(
    () => ({
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status.toLowerCase() === 'active').length,
      totalApplicants: jobs.reduce((sum, job) => sum + Number(job.applicants || 0), 0),
      responseRate: jobs.length > 0 ? `${Math.min(100, 80 + jobs.length * 3)}%` : '0%',
    }),
    [jobs]
  );

  const handleCreateJob = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.skills.trim() ||
      !formData.experience.trim() ||
      !formData.packageValue.trim() ||
      !formData.location.trim()
    ) {
      setError('Please fill all required job fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: formData.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        experience: Number(formData.experience),
        package: formData.packageValue.trim(),
        location: formData.location.trim(),
      };
      const response = await withAuth((token) => createRecruiterJob(token, payload));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to create job.');
      setJobs((currentJobs) => [mapJobFromApi(data.job ?? data), ...currentJobs]);
      setMessage(data.message || 'Job posted successfully.');
      setFormData(createInitialFormData());
      setShowPostJob(false);
    } catch (createError) {
      setError(createError.message || 'Unable to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleJobStatus = async (job) => {
    const nextStatus = job.status.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingJobId(job.id);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) =>
        toggleRecruiterJobStatus(token, job.id, { status: nextStatus })
      );
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to update job status.');
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id ? { ...currentJob, status: nextStatus } : currentJob
        )
      );
      setMessage(data.message || `${job.title} marked as ${nextStatus}.`);
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update job status.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleViewApplications = async (jobId) => {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      setApplications([]);
      return;
    }
    setSelectedJobId(jobId);
    setApplicationsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) => getJobApplications(token, jobId));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to load job applications.');
      const list = Array.isArray(data) ? data : data.applications ?? [];
      setApplications(list.map(mapApplicationFromApi));
    } catch (applicationsError) {
      setApplications([]);
      setError(applicationsError.message || 'Unable to load job applications.');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleStatusDraftChange = (applicationId, field, value) => {
    setStatusUpdateData((currentData) => ({
      ...currentData,
      [applicationId]: {
        status: currentData[applicationId]?.status ?? 'PENDING',
        message: currentData[applicationId]?.message ?? '',
        ...currentData[applicationId],
        [field]: value,
      },
    }));
  };

  const handleUpdateApplicationStatus = async (application) => {
    const draft = statusUpdateData[application.id] ?? {
      status: application.status,
      message: '',
    };
    setUpdatingApplicationId(application.id);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) =>
        updateApplicationStatus(token, application.id, {
          status: draft.status,
          message: draft.message,
        })
      );
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to update application status.');
      setApplications((currentApplications) =>
        currentApplications.map((currentApplication) =>
          currentApplication.id === application.id
            ? { ...currentApplication, status: draft.status }
            : currentApplication
        )
      );
      setMessage(data.message || `Application updated to ${draft.status}.`);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update application status.');
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleDownloadResume = async (application) => {
    if (!application.resumeId) {
      setError('Resume is not available for this candidate.');
      return;
    }

    setDownloadingResumeId(application.resumeId);
    setError('');
    setMessage('');

    try {
      const response = await withAuth((token) =>
        downloadCandidateResume(token, application.resumeId)
      );

      if (!response) {
        return;
      }

      if (!response.ok) {
        const data = await parseResponseBody(response);
        throw new Error(data.message || 'Unable to download candidate resume.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers.get('content-disposition');
      const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);

      link.href = downloadUrl;
      link.download = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1].replace(/"/g, ''))
        : `candidate-resume-${application.resumeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage(`Resume downloaded for ${application.candidateName}.`);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download candidate resume.');
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const handleGenerateSkillGap = async (application) => {
    if (!application.candidateId || !selectedJobId) {
      setError('Candidate ID or job ID is missing for skill-gap generation.');
      return;
    }

    setSkillGapLoadingId(application.id);
    setSkillGapData(null);
    setError('');
    setMessage('');

    try {
      const response = await withAuth((token) =>
        getSkillGapRoadmap(token, application.candidateId, selectedJobId)
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to generate skill-gap roadmap.');
      }

      setSkillGapData({
        applicationId: application.id,
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        roadmap: data.roadmap ?? data.roadmapText ?? 'No roadmap available.',
        learningResources: Array.isArray(data.learningResources) ? data.learningResources : [],
      });
      setMessage(`Skill-gap roadmap generated for ${application.candidateName}.`);
    } catch (skillGapError) {
      setError(skillGapError.message || 'Unable to generate skill-gap roadmap.');
    } finally {
      setSkillGapLoadingId(null);
    }
  };

  const selectedApplications = selectedJobId ? applications : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl">
              <FaRocket className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">RecruitPro</h1>
              <p className="text-xs text-gray-500">Smart Hiring Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search jobs..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
            </div>
            <button className="relative">
              <FaBell className="text-gray-600 text-xl" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm">{userAvatar}</div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <button onClick={() => { clearSession(); navigate('/'); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur rounded-full p-2">
                <FaBriefcase className="text-2xl" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {userName.split(' ')[0]}!</h1>
            </div>
            <p className="text-teal-100 text-lg">Manage live recruiter jobs from the API, review applications, and keep role statuses current.</p>
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${error ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-green-50 border border-green-100 text-green-700'}`}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Jobs', value: stats.totalJobs, icon: FaBriefcase },
            { label: 'Active Jobs', value: stats.activeJobs, icon: FaCheckCircle },
            { label: 'Total Applicants', value: stats.totalApplicants, icon: FaUsers },
            { label: 'Response Rate', value: stats.responseRate, icon: FaChartLine },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                  <item.icon className="text-2xl text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-800">{item.value}</span>
              </div>
              <h3 className="text-gray-600 font-medium">{item.label}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button onClick={() => setShowPostJob(true)} className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl p-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-105 font-semibold">
            <FaPlus /> Post New Job
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Job Postings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your live job listings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FaThLarge /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FaList /></button>
            <div className="relative ml-2">
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="all">All Jobs</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FaFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaSpinner className="animate-spin text-3xl text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading recruiter jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
            <p className="text-gray-500">Post a new role to see it appear here.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredJobs.map((job) => (
              <div key={job.id} className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all group ${selectedJobId === job.id ? 'ring-2 ring-teal-200' : ''}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition">{job.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-1"><FaBuilding className="text-teal-400" /> {job.company}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(job.status)}`}>{job.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-6 mb-4">{job.description || 'No description provided.'}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 flex items-center gap-2 text-sm"><FaMapMarkerAlt className="text-teal-500" /> {job.location}</p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm"><FaCalendarAlt className="text-teal-500" /> {job.experience}+ years experience</p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm"><FaUsers className="text-teal-500" /> {job.applicants} applicants</p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm"><FaMoneyBillWave className="text-teal-500" /> {job.package}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">{skill}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleViewApplications(job.id)} disabled={applicationsLoading && selectedJobId === job.id} className="flex-1 min-w-[150px] px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {applicationsLoading && selectedJobId === job.id ? <FaSpinner className="animate-spin" /> : selectedJobId === job.id ? <FaChevronUp /> : <FaChevronDown />}
                      {selectedJobId === job.id ? 'Hide Applications' : 'View Applications'}
                    </button>
                    <button onClick={() => handleToggleJobStatus(job)} disabled={updatingJobId === job.id} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
                      {updatingJobId === job.id ? <span className="inline-flex items-center gap-2"><FaSpinner className="animate-spin" /> Updating</span> : `Set ${job.status.toUpperCase() === 'ACTIVE' ? 'Inactive' : 'Active'}`}
                    </button>
                  </div>
                </div>

                {selectedJobId === job.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Applications</h4>
                      <span className="text-sm text-gray-500">{selectedApplications.length} loaded</span>
                    </div>
                    {applicationsLoading ? (
                      <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center">
                        <FaSpinner className="animate-spin text-2xl text-teal-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">Loading applications...</p>
                      </div>
                    ) : selectedApplications.length === 0 ? (
                      <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-sm text-gray-500">
                        No applications found for this job yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedApplications.map((application) => {
                          const draft = statusUpdateData[application.id] ?? { status: application.status, message: '' };
                          return (
                            <div key={application.id} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                  <h5 className="text-base font-semibold text-gray-800">{application.candidateName}</h5>
                                  <p className="text-sm text-gray-500 mt-1">{application.email}</p>
                                  <p className="text-xs text-gray-400 mt-2">Applied: {application.appliedDate || 'N/A'}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${getStatusClasses(application.status)}`}>{application.status}</span>
                              </div>
                              <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-800">Skills</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {application.skills.length > 0 ? application.skills.map((skill) => (
                                    <span key={skill} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">{skill}</span>
                                  )) : <span className="text-sm text-gray-500">No skills listed</span>}
                                </div>
                              </div>
                              <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-800">Cover Letter</p>
                                <p className="mt-2 text-sm leading-6 text-gray-600">{application.coverLetter}</p>
                              </div>
                              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-500">
                                Candidate ID: {application.candidateId ?? 'N/A'} | Resume ID: {application.resumeId ?? 'N/A'} | Application ID: {application.id} | Job ID: {selectedJobId ?? 'N/A'}
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleDownloadResume(application)}
                                  disabled={!application.resumeId || downloadingResumeId === application.resumeId}
                                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                  {!application.resumeId ? (
                                    'Resume Unavailable'
                                  ) : downloadingResumeId === application.resumeId ? (
                                    <span className="inline-flex items-center gap-2">
                                      <FaSpinner className="animate-spin" />
                                      Downloading
                                    </span>
                                  ) : (
                                    'Download Resume'
                                  )}
                                </button>
                                <button
                                  onClick={() => handleGenerateSkillGap(application)}
                                  disabled={skillGapLoadingId === application.id}
                                  className="px-4 py-2 border border-teal-200 text-teal-700 rounded-xl hover:bg-teal-50 transition disabled:opacity-50"
                                >
                                  {skillGapLoadingId === application.id ? (
                                    <span className="inline-flex items-center gap-2">
                                      <FaSpinner className="animate-spin" />
                                      Generating
                                    </span>
                                  ) : (
                                    'Generate Skill Gap'
                                  )}
                                </button>
                              </div>
                              <div className="mt-5 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-start">
                                <select value={draft.status} onChange={(event) => handleStatusDraftChange(application.id, 'status', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                  {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                                <textarea rows={3} value={draft.message} onChange={(event) => handleStatusDraftChange(application.id, 'message', event.target.value)} placeholder="Optional message for the candidate" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                <button onClick={() => handleUpdateApplicationStatus(application)} disabled={updatingApplicationId === application.id} className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 min-w-[110px]">
                                  {updatingApplicationId === application.id ? <span className="inline-flex items-center gap-2"><FaSpinner className="animate-spin" /> Saving</span> : 'Update'}
                                </button>
                              </div>
                              {skillGapData?.applicationId === application.id && (
                                <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                                  <p className="text-sm font-semibold text-gray-800">Skill Gap Roadmap</p>
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700">Missing Skills</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {skillGapData.missingSkills.length > 0 ? (
                                        skillGapData.missingSkills.map((skill) => (
                                          <span
                                            key={skill}
                                            className="px-2 py-1 bg-white text-teal-700 text-xs rounded-lg border border-teal-100"
                                          >
                                            {skill}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-sm text-gray-500">No missing skills returned.</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700">Roadmap</p>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                      {skillGapData.roadmap}
                                    </p>
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700">Learning Resources</p>
                                    <div className="mt-3 space-y-3">
                                      {skillGapData.learningResources.length > 0 ? (
                                        skillGapData.learningResources.map((resource, index) => (
                                          <div
                                            key={`${resource.skillName ?? resource.skill ?? 'resource'}-${index}`}
                                            className="rounded-2xl bg-white border border-gray-100 p-4"
                                          >
                                            <p className="text-sm font-semibold text-gray-800">
                                              {resource.skillName ?? resource.skill ?? 'Skill Resource'}
                                            </p>
                                            <div className="mt-3 space-y-3">
                                              {Array.isArray(resource.videos) && resource.videos.length > 0 ? (
                                                resource.videos.map((video, videoIndex) => (
                                                  <a
                                                    key={`${video.title ?? 'video'}-${videoIndex}`}
                                                    href={video.url || video.link || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block rounded-xl border border-gray-100 p-3 hover:border-teal-200 hover:bg-teal-50 transition"
                                                  >
                                                    <p className="text-sm font-semibold text-teal-700">
                                                      {video.title ?? 'Learning Video'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                      {video.channel ?? 'Channel'}
                                                      {video.views ? ` • ${video.views}` : ''}
                                                    </p>
                                                  </a>
                                                ))
                                              ) : (
                                                <p className="text-sm text-gray-500">No videos available.</p>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500">No learning resources returned.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPostJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Post a New Job</h2>
              <p className="text-teal-100 text-sm mt-1">Fill in the details to create a live job posting</p>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Job Title *" value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              <textarea rows="4" placeholder="Job Description *" value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Required Skills (comma separated) *" value={formData.skills} onChange={(event) => setFormData((current) => ({ ...current, skills: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="number" placeholder="Experience in years *" value={formData.experience} onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Package *" value={formData.packageValue} onChange={(event) => setFormData((current) => ({ ...current, packageValue: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Location *" value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowPostJob(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"><span className="inline-flex items-center gap-2"><FaTimes /> Cancel</span></button>
              <button onClick={handleCreateJob} disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                {submitting && <FaSpinner className="animate-spin" />}
                Submit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
