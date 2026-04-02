import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
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
import { createRecruiterJob, getRecruiterJobs, mapJobFromApi } from '../utils/jobs';

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
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

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(createInitialFormData);

  const userName = localStorage.getItem('userName') || 'Sarah Johnson';
  const userEmail = localStorage.getItem('userEmail') || 'sarah.johnson@company.com';
  const userAvatar = userName
    .split(' ')
    .map((name) => name[0])
    .join('');

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

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load recruiter jobs.');
      }

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

      const matchesFilter = filterStatus === 'all' || job.status.toLowerCase() === filterStatus.toLowerCase();
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

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleFormChange = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  };

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
        requiredSkills: formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience: Number(formData.experience),
        package: formData.packageValue.trim(),
        location: formData.location.trim(),
      };

      const response = await withAuth((token) => createRecruiterJob(token, payload));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create job.');
      }

      const createdJob = mapJobFromApi(data.job ?? data);
      setJobs((currentJobs) => [createdJob, ...currentJobs]);
      setMessage(data.message || 'Job posted successfully.');
      setFormData(createInitialFormData());
      setShowPostJob(false);
    } catch (createError) {
      setError(createError.message || 'Unable to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl">
              <FaRocket className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                RecruitPro
              </h1>
              <p className="text-xs text-gray-500">Smart Hiring Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
              />
            </div>
            <button className="relative">
              <FaBell className="text-gray-600 text-xl" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm">
                {userAvatar}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 backdrop-blur rounded-full p-2">
                    <FaBriefcase className="text-2xl" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Welcome back, {userName.split(' ')[0]}!
                  </h1>
                </div>
                <p className="text-teal-100 text-lg">
                  Manage live recruiter jobs from the API and publish new roles with a clean posting flow.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs text-teal-100 uppercase">Total Jobs</p>
                <p className="text-3xl font-bold mt-2">{stats.totalJobs}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs text-teal-100 uppercase">Active Jobs</p>
                <p className="text-3xl font-bold mt-2">{stats.activeJobs}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs text-teal-100 uppercase">Applicants</p>
                <p className="text-3xl font-bold mt-2">{stats.totalApplicants}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs text-teal-100 uppercase">Response Rate</p>
                <p className="text-3xl font-bold mt-2">{stats.responseRate}</p>
              </div>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
              error
                ? 'bg-red-50 border border-red-100 text-red-700'
                : 'bg-green-50 border border-green-100 text-green-700'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaBriefcase className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.totalJobs}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Jobs</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaCheckCircle className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.activeJobs}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Active Jobs</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaUsers className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.totalApplicants}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Applicants</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaChartLine className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.responseRate}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Response Rate</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setShowPostJob(true)}
            className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl p-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-105 font-semibold"
          >
            <FaPlus /> Post New Job
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Job Postings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your live job listings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FaList />
            </button>
            <div className="relative ml-2">
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Jobs</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
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
            <button
              onClick={() => setShowPostJob(true)}
              className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition"
            >
              Post New Job
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition">
                        {job.title}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <FaBuilding className="text-teal-400" /> {job.company}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status.toLowerCase() === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 leading-6 mb-4">
                    {job.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 flex items-center gap-2 text-sm">
                      <FaMapMarkerAlt className="text-teal-500" /> {job.location}
                    </p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm">
                      <FaCalendarAlt className="text-teal-500" /> {job.experience}+ years experience
                    </p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm">
                      <FaUsers className="text-teal-500" /> {job.applicants} applicants
                    </p>
                    <p className="text-gray-600 flex items-center gap-2 text-sm">
                      <FaMoneyBillWave className="text-teal-500" /> {job.package}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
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
              <input
                type="text"
                placeholder="Job Title *"
                value={formData.title}
                onChange={(event) => handleFormChange('title', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <textarea
                rows="4"
                placeholder="Job Description *"
                value={formData.description}
                onChange={(event) => handleFormChange('description', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Required Skills (comma separated) *"
                value={formData.skills}
                onChange={(event) => handleFormChange('skills', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="number"
                placeholder="Experience in years *"
                value={formData.experience}
                onChange={(event) => handleFormChange('experience', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Package *"
                value={formData.packageValue}
                onChange={(event) => handleFormChange('packageValue', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Location *"
                value={formData.location}
                onChange={(event) => handleFormChange('location', event.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPostJob(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="inline-flex items-center gap-2">
                  <FaTimes />
                  Cancel
                </span>
              </button>
              <button
                onClick={handleCreateJob}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
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
