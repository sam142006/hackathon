import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBookmark,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCode,
  FaComments,
  FaEnvelope,
  FaEye,
  FaFileAlt,
  FaGithub,
  FaGlobe,
  FaGraduationCap,
  FaLinkedin,
  FaMapMarkerAlt,
  FaRegHeart,
  FaRocket,
  FaSpinner,
  FaStar,
  FaTimes,
  FaUserCircle,
} from 'react-icons/fa';
import CandidateResumePanel from '../components/CandidateResumePanel';
import { clearSession, getStoredToken } from '../utils/auth';
import { applyForJob, getCandidateJobs, mapJobFromApi } from '../utils/jobs';

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

const getResponseMessage = (payload) =>
  payload?.message ??
  payload?.error ??
  payload?.details ??
  payload?.data?.message ??
  payload?.result?.message ??
  '';

const getAppliedJobsStorageKey = (email) => `candidate-applied-jobs:${email || 'default'}`;

const readAppliedJobsCache = (email) => {
  try {
    const storedValue = localStorage.getItem(getAppliedJobsStorageKey(email));
    return storedValue ? JSON.parse(storedValue) : {};
  } catch {
    return {};
  }
};

const writeAppliedJobsCache = (email, value) => {
  try {
    localStorage.setItem(getAppliedJobsStorageKey(email), JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the in-memory state working.
  }
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const userName = localStorage.getItem('userName') || 'Alex Morgan';
  const userEmail = localStorage.getItem('userEmail') || 'alex.morgan@example.com';
  const userAvatar = userName
    .split(' ')
    .map((name) => name[0])
    .join('');

  const profile = {
    name: userName,
    email: userEmail,
    location: 'Bangalore, India',
    title: 'Software Professional',
    bio: 'Building a stronger profile and applying to roles that match core skills and growth goals.',
    skills: ['React.js', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'MongoDB', 'Tailwind CSS'],
    experienceHistory: [
      {
        company: 'Tech Solutions Inc.',
        position: 'Senior Full Stack Developer',
        period: '2022 - Present',
        description: 'Leading frontend initiatives and improving delivery quality across web applications.',
      },
      {
        company: 'Digital Innovations',
        position: 'Frontend Developer',
        period: '2019 - 2022',
        description: 'Developed responsive product experiences and collaborated closely with design and backend teams.',
      },
    ],
  };

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
      const response = await withAuth((token) => getCandidateJobs(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(data) || 'Unable to load jobs.');
      }

      const jobList = Array.isArray(data) ? data : data.jobs ?? [];
      const cachedAppliedJobs = readAppliedJobsCache(userEmail);
      setJobs(
        jobList.map(mapJobFromApi).map((job) => {
          const cachedJob = cachedAppliedJobs[job.id];

          if (!cachedJob) {
            return job;
          }

          return {
            ...job,
            applied: job.applied || Boolean(cachedJob.applied),
            applicationId: job.applicationId ?? cachedJob.applicationId ?? null,
          };
        })
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load jobs.');
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
        job.requiredSkills.some((skill) => skill.toLowerCase().includes(normalizedSearch));

      const normalizedTab = activeTab.toLowerCase();

      if (normalizedTab === 'remote') {
        return matchesSearch && job.location.toLowerCase().includes('remote');
      }

      if (normalizedTab === 'contract') {
        return matchesSearch && job.description.toLowerCase().includes('contract');
      }

      if (normalizedTab === 'featured') {
        return matchesSearch && job.requiredSkills.length >= 3;
      }

      return matchesSearch;
    });
  }, [activeTab, jobs, searchTerm]);

  const stats = useMemo(
    () => ({
      jobsApplied: jobs.filter((job) => job.applied).length,
      savedJobs: jobs.filter((job) => job.requiredSkills.length >= 4).length,
      interviews: jobs.filter((job) => job.applied).slice(0, 3).length,
      applicationSuccess:
        jobs.length > 0
          ? `${Math.round((jobs.filter((job) => job.applied).length / jobs.length) * 100)}%`
          : '0%',
    }),
    [jobs]
  );

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleEditProfile = () => {
    setMessage('Profile editing can be connected when the profile API is available.');
  };

  const openApplyModal = (job) => {
    setApplyModalJob(job);
    setCoverLetter('');
    setError('');
    setMessage('');
  };

  const closeApplyModal = () => {
    setApplyModalJob(null);
    setCoverLetter('');
  };

  const cacheAppliedJob = (jobId, applicationId = null) => {
    const currentCache = readAppliedJobsCache(userEmail);
    writeAppliedJobsCache(userEmail, {
      ...currentCache,
      [jobId]: {
        applied: true,
        applicationId: applicationId ?? currentCache[jobId]?.applicationId ?? null,
      },
    });
  };

  const openChatPage = (job) => {
    setError('');
    navigate('/candidate-chat', {
      state: {
        targetId: job.id,
        applicationId: job.applicationId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
      },
    });
  };

  const handleApply = async () => {
    if (!applyModalJob) {
      return;
    }

    if (!coverLetter.trim()) {
      setError('Please add a cover letter before applying.');
      return;
    }

    setApplying(true);
    setError('');

    try {
      const response = await withAuth((token) =>
        applyForJob(token, applyModalJob.id, coverLetter.trim())
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);
      const responseMessage = getResponseMessage(data);
      const normalizedMessage = responseMessage.toLowerCase();

      if (!response.ok) {
        if (
          normalizedMessage.includes('already applied') ||
          (response.status === 400 &&
            (normalizedMessage.includes('already') ||
              normalizedMessage.includes('duplicate') ||
              normalizedMessage.includes('exists') ||
              normalizedMessage.includes('applied')))
        ) {
          const resolvedApplicationId =
            data.applicationId ??
            data.id ??
            data.application?.id ??
            applyModalJob.applicationId ??
            null;

          cacheAppliedJob(applyModalJob.id, resolvedApplicationId);
          setJobs((currentJobs) =>
            currentJobs.map((job) =>
              job.id === applyModalJob.id
                ? {
                    ...job,
                    applied: true,
                    applicationId: resolvedApplicationId ?? job.applicationId,
                  }
                : job
            )
          );
          setMessage(responseMessage || `You have already applied for ${applyModalJob.title}.`);
          closeApplyModal();
          return;
        }

        throw new Error(responseMessage || 'Unable to apply for this job.');
      }

      const resolvedApplicationId =
        data.applicationId ??
        data.id ??
        data.application?.id ??
        applyModalJob.applicationId ??
        null;

      cacheAppliedJob(applyModalJob.id, resolvedApplicationId);
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === applyModalJob.id
            ? {
                ...job,
                applied: true,
                applicationId: resolvedApplicationId ?? job.applicationId,
              }
            : job
        )
      );
      setMessage(responseMessage || `Application submitted for ${applyModalJob.title}.`);
      closeApplyModal();
    } catch (applyError) {
      setError(applyError.message || 'Unable to apply for this job.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl shadow-lg">
                <FaRocket className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                  CareerPath
                </h1>
                <p className="text-xs text-gray-500">Your Dream Job Awaits</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {userAvatar}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-gradient-to-r from-teal-600 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 rounded-full p-2">
                <FaStar className="text-2xl" />
              </div>
              <h1 className="text-4xl font-bold">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  {userName.split(' ')[0]}
                </span>
                !
              </h1>
            </div>
            <p className="text-teal-100 text-lg mb-6">
              Fresh opportunities are loaded from the live API for you. Browse, filter, and apply
              with a tailored cover letter.
            </p>
            
              
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Jobs Applied', value: stats.jobsApplied, icon: FaBriefcase, color: 'from-teal-500 to-green-500' },
            { label: 'Skill Matches', value: stats.savedJobs, icon: FaBookmark, color: 'from-blue-500 to-cyan-500' },
            { label: 'Interview Leads', value: stats.interviews, icon: FaCalendarAlt, color: 'from-green-500 to-emerald-500' },
            { label: 'Apply Rate', value: stats.applicationSuccess, icon: FaChartLine, color: 'from-purple-500 to-pink-500' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${item.color} p-3 rounded-2xl shadow-lg`}>
                  <item.icon className="text-2xl text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-800">{item.value}</span>
              </div>
              <h3 className="text-gray-800 font-bold text-lg mb-1">{item.label}</h3>
              <p className="text-gray-500 text-sm">Live dashboard stats</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {userAvatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <FaEnvelope className="text-sm" /> {userEmail}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Available for work</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Open to opportunities</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl flex items-center gap-2"
              >
                <FaUserCircle /> Open Profile
              </button>
              <button
                onClick={handleEditProfile}
                className="px-5 py-2 border-2 border-teal-500 text-teal-600 rounded-xl flex items-center gap-2"
              >
                <FaFileAlt /> Edit Profile
              </button>
            </div>
          </div>

          
        </div>

        <CandidateResumePanel />

        <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaCode className="text-teal-600" /> Top Skills
            </h3>
            <button className="text-teal-600 text-sm">+ Add Skills</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.skills.slice(0, 8).map((skill) => (
              <span key={skill} className="px-4 py-2 bg-white rounded-full text-gray-700 text-sm shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 flex-wrap">
            {['All Jobs', 'Featured', 'Remote', 'Full-time', 'Contract'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-5 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">Showing {filteredJobs.length} jobs</p>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
              error ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-green-50 border border-green-100 text-green-700'
            }`}
          >
            {error || message}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <FaSpinner className="animate-spin text-3xl text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <FaBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No jobs available</h3>
            <p className="text-gray-500 mt-2">New API-backed opportunities will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        <FaBuilding />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <FaBuilding className="text-teal-400" /> {job.company}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition">
                      <FaRegHeart className="text-xl" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 leading-6 mb-4">{job.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="text-teal-500" /> {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaStar className="text-yellow-500" /> {job.package}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaCalendarAlt className="text-teal-500" /> {job.status}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaGraduationCap className="text-teal-500" /> {job.experience}+ years
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-2">
                        <FaEye className="text-teal-400" />
                        <span>{job.applicants} applicants</span>
                      </span>
                      {job.applied && (
                        <button
                          onClick={() => openChatPage(job)}
                          className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-teal-700 hover:bg-teal-100 transition"
                        >
                          <FaComments />
                          Chat
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => openApplyModal(job)}
                      disabled={job.applied}
                      className={`px-5 py-2 rounded-xl transition flex items-center gap-2 ${
                        job.applied
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-green-500 text-white hover:shadow-lg'
                      }`}
                    >
                      <FaEye /> {job.applied ? 'Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {applyModalJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 rounded-t-3xl text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Apply for {applyModalJob.title}</h3>
                <p className="text-sm text-teal-100 mt-1">{applyModalJob.company}</p>
              </div>
              <button onClick={closeApplyModal} className="p-2 rounded-full hover:bg-white/20 transition">
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Letter</label>
              <textarea
                rows={7}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Write a short cover letter highlighting why you're a strong fit for this role."
                className="w-full rounded-2xl border border-gray-200 p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeApplyModal} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {applying && <FaSpinner className="animate-spin" />}
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 rounded-t-3xl text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <FaUserCircle className="text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold">Profile Overview</h2>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {userAvatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
                  <p className="text-teal-600 font-semibold">{profile.title}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <FaEnvelope /> {profile.email}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <FaMapMarkerAlt /> {profile.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-2">About Me</h4>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Work Experience</h4>
                <div className="space-y-4">
                  {profile.experienceHistory.map((exp) => (
                    <div key={`${exp.company}-${exp.period}`} className="border-l-4 border-teal-500 pl-4">
                      <p className="font-semibold text-gray-800">{exp.position}</p>
                      <p className="text-teal-600 text-sm">{exp.company} | {exp.period}</p>
                      <p className="text-gray-500 text-sm mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button onClick={() => setShowProfileModal(false)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition">
                Close
              </button>
              <button onClick={handleEditProfile} className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDashboard;
