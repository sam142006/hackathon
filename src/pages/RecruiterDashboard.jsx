import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBriefcase, 
  FaUsers, 
  FaPlus, 
  FaMapMarkerAlt, 
  FaEye,
  FaTrash,
  FaUserCircle,
  FaSignOutAlt,
  FaSearch,
  FaClock,
  FaGraduationCap,
  FaBuilding,
  FaEnvelope,
  FaFileAlt,
  FaStar,
  FaArrowLeft,
  FaPercent,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCheckCircle,
  FaRegClock,
  FaFilter,
  FaThLarge,
  FaList,
  FaRocket,
  FaTrophy,
  FaCalendarAlt,
  FaEdit,
  FaTimes,
  FaUserTie,
  FaChartLine,
  FaDownload,
  FaSpinner,
  FaChartBar,
  FaBell,
  FaMoneyBillWave
} from 'react-icons/fa';
import { clearSession } from '../utils/auth';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicants, setShowApplicants] = useState(false);
  const [showAllApplicants, setShowAllApplicants] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showApplicantProfile, setShowApplicantProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('percentage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [jobs, setJobs] = useState([
    { 
      id: 1, 
      title: 'Senior Frontend Developer', 
      company: 'TechCorp Inc.',
      location: 'Remote, India', 
      salary: '$120k - $150k', 
      status: 'Active',
      applicants: 47,
      postedDate: '2024-03-15',
      type: 'Full-time',
      minExperience: '5 years',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      description: 'Looking for an experienced frontend developer to lead our UI team and build scalable web applications with cutting-edge technologies.',
      benefits: ['Health Insurance', '401k', 'Remote Work', 'Learning Budget'],
      applicantsList: [
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210', experience: '6 years', skills: ['React', 'TypeScript', 'Next.js'], percentage: 92, resume: 'john_doe_resume.pdf', avatar: 'JD', location: 'Mumbai, India', expectedSalary: '$130k', availability: 'Immediate', status: 'Pending', appliedDate: '2024-03-14' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+91 87654 32109', experience: '5 years', skills: ['React', 'JavaScript', 'Redux'], percentage: 88, resume: 'jane_smith_resume.pdf', avatar: 'JS', location: 'Bangalore, India', expectedSalary: '$120k', availability: '2 weeks', status: 'Reviewed', appliedDate: '2024-03-13' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+91 76543 21098', experience: '7 years', skills: ['React', 'TypeScript', 'Node.js'], percentage: 95, resume: 'mike_johnson_resume.pdf', avatar: 'MJ', location: 'Delhi, India', expectedSalary: '$145k', availability: 'Immediate', status: 'Interview', appliedDate: '2024-03-12' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+91 65432 10987', experience: '4 years', skills: ['React', 'Vue.js', 'Angular'], percentage: 78, resume: 'sarah_williams_resume.pdf', avatar: 'SW', location: 'Pune, India', expectedSalary: '$110k', availability: '1 month', status: 'Pending', appliedDate: '2024-03-11' }
      ]
    },
    { 
      id: 2, 
      title: 'Backend Engineer', 
      company: 'CloudSystems',
      location: 'Bangalore, India', 
      salary: '$100k - $130k', 
      status: 'Active',
      applicants: 32,
      postedDate: '2024-03-10',
      type: 'Full-time',
      minExperience: '3 years',
      requiredSkills: ['Node.js', 'Python', 'AWS', 'MongoDB', 'Docker'],
      description: 'Join our backend team to build scalable microservices and cloud infrastructure.',
      benefits: ['Health Insurance', 'Stock Options', 'Flexible Hours'],
      applicantsList: [
        { id: 5, name: 'Alex Kumar', email: 'alex@example.com', phone: '+91 98765 12345', experience: '4 years', skills: ['Node.js', 'Python', 'AWS'], percentage: 85, resume: 'alex_kumar_resume.pdf', avatar: 'AK', location: 'Chennai, India', expectedSalary: '$115k', availability: 'Immediate', status: 'Pending', appliedDate: '2024-03-09' }
      ]
    }
  ]);

  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    minExperience: '',
    description: '',
    requiredSkills: ''
  });

  const [editJob, setEditJob] = useState(null);

  const userName = localStorage.getItem('userName') || 'Sarah Johnson';
  const userEmail = localStorage.getItem('userEmail') || 'sarah.johnson@company.com';
  const userAvatar = userName.split(' ').map(n => n[0]).join('');

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'Active').length,
    totalApplicants: jobs.reduce((sum, job) => sum + job.applicants, 0),
    totalViews: 2847,
    responseRate: '94%',
    avgTimeToHire: '12 days',
    qualityScore: 'A+',
    monthlyGrowth: '+47%'
  };

  const allApplicants = jobs.flatMap(job => 
    job.applicantsList.map(applicant => ({
      ...applicant,
      jobTitle: job.title,
      jobId: job.id
    }))
  );

  const handlePostJob = () => {
    if (!newJob.title || !newJob.company || !newJob.location || !newJob.minExperience) {
      alert('Please fill all required fields');
      return;
    }

    const job = {
      id: jobs.length + 1,
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      salary: 'To be discussed',
      status: 'Active',
      applicants: 0,
      postedDate: new Date().toISOString().split('T')[0],
      type: 'Full-time',
      minExperience: newJob.minExperience,
      requiredSkills: newJob.requiredSkills.split(',').map(skill => skill.trim()),
      description: newJob.description,
      benefits: [],
      applicantsList: []
    };
    
    setJobs([...jobs, job]);
    setShowPostJob(false);
    setNewJob({
      title: '',
      company: '',
      location: '',
      minExperience: '',
      description: '',
      requiredSkills: ''
    });
    alert(' Job posted successfully!');
  };

  const handleUpdateJob = () => {
    if (!editJob.title || !editJob.company || !editJob.location || !editJob.minExperience) {
      alert('Please fill all required fields');
      return;
    }

    setJobs(jobs.map(job => job.id === editJob.id ? editJob : job));
    setShowEditJob(false);
    setEditJob(null);
    alert(' Job updated successfully!');
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      setJobs(jobs.filter(job => job.id !== jobId));
    }
  };

  const handleViewApplicants = (job) => {
    setSelectedJob(job);
    setShowApplicants(true);
  };

  const handleViewAllApplicants = () => {
    setShowAllApplicants(true);
  };

  const handleViewApplicantProfile = (applicant) => {
    setSelectedApplicant(applicant);
    setShowApplicantProfile(true);
  };

  const handleUpdateApplicantStatus = (applicantId, newStatus) => {
    setUpdatingStatus(true);
    setTimeout(() => {
      setJobs(jobs.map(job => ({
        ...job,
        applicantsList: job.applicantsList.map(applicant =>
          applicant.id === applicantId ? { ...applicant, status: newStatus } : applicant
        )
      })));
      if (selectedApplicant && selectedApplicant.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
      setUpdatingStatus(false);
      alert(` Applicant status updated to ${newStatus}`);
    }, 500);
  };

  const handleViewResume = (applicant) => {
    alert(` Opening resume: ${applicant.resume}\n\nThis would open the PDF in a real application.`);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Reviewed': return 'bg-blue-100 text-blue-800';
      case 'Interview': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortedApplicants = () => {
    if (!selectedJob) return [];
    const applicants = [...selectedJob.applicantsList];
    
    if (sortBy === 'percentage') {
      return applicants.sort((a, b) => sortOrder === 'desc' ? b.percentage - a.percentage : a.percentage - b.percentage);
    } else if (sortBy === 'experience') {
      return applicants.sort((a, b) => {
        const expA = parseInt(a.experience);
        const expB = parseInt(b.experience);
        return sortOrder === 'desc' ? expB - expA : expA - expB;
      });
    }
    return applicants;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  
  if (showAllApplicants) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAllApplicants(false)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                <FaArrowLeft /> Back to Dashboard
              </button>
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl">
                <FaUsers className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">All Applicants ({allApplicants.length})</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm">{userAvatar}</div>
                <span className="text-sm text-gray-700">{userName}</span>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allApplicants.map((applicant) => (
              <div key={applicant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {applicant.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{applicant.name}</h3>
                      <p className="text-sm text-gray-500">{applicant.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(applicant.status)}`}>
                    {applicant.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium text-gray-700">{applicant.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-gray-700">{applicant.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Match Score:</span>
                    <span className="font-bold text-teal-600">{applicant.percentage}%</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full ${applicant.percentage >= 90 ? 'bg-green-500' : applicant.percentage >= 80 ? 'bg-teal-500' : 'bg-yellow-500'}`} style={{ width: `${applicant.percentage}%` }}></div>
                </div>
                
                <button
                  onClick={() => handleViewApplicantProfile(applicant)}
                  className="w-full py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FaEye /> Open Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showApplicantProfile && selectedApplicant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowApplicantProfile(false)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                <FaArrowLeft /> Back
              </button>
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl">
                <FaUserTie className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Applicant Profile</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Logout</button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-green-700 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold backdrop-blur">
                  {selectedApplicant.avatar}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{selectedApplicant.name}</h1>
                  <p className="text-teal-100 mt-1">{selectedApplicant.email}</p>
                  <p className="text-teal-100">{selectedApplicant.phone}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="text-xl font-semibold text-gray-800">{selectedApplicant.experience}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Expected Salary</p>
                  <p className="text-xl font-semibold text-gray-800">{selectedApplicant.expectedSalary}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className="text-xl font-semibold text-gray-800">{selectedApplicant.availability}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-800">Match Score</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-teal-500 to-green-500 h-3 rounded-full" style={{ width: `${selectedApplicant.percentage}%` }}></div>
                  </div>
                  <span className="text-2xl font-bold text-teal-600">{selectedApplicant.percentage}%</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-800">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-800">Update Application Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['Pending', 'Reviewed', 'Interview', 'Rejected', 'Hired'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, status)}
                      disabled={updatingStatus}
                      className={`px-4 py-2 rounded-lg transition-all ${selectedApplicant.status === status ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {updatingStatus && selectedApplicant.status === status ? <FaSpinner className="animate-spin" /> : status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleViewResume(selectedApplicant)}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold"
              >
                <FaFileAlt /> Download Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  if (showApplicants && selectedJob) {
    const sortedApplicants = getSortedApplicants();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowApplicants(false)} className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                <FaArrowLeft /> Back
              </button>
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl">
                <FaUsers className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">{selectedJob.title} - Applicants ({selectedJob.applicantsList.length})</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Logout</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
      
          <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-2xl p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-3">{selectedJob.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><FaBuilding className="inline mr-2" /> {selectedJob.company}</div>
              <div><FaMapMarkerAlt className="inline mr-2" /> {selectedJob.location}</div>
              <div><FaGraduationCap className="inline mr-2" /> {selectedJob.minExperience}</div>
              <div><FaUsers className="inline mr-2" /> {selectedJob.applicantsList.length} Total Applicants</div>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-white/20 rounded-lg text-sm">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button onClick={() => { setSortBy('percentage'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} 
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${sortBy === 'percentage' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <FaPercent /> Filter by % {sortBy === 'percentage' && (sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
              </button>
              <button onClick={() => { setSortBy('experience'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }} 
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${sortBy === 'experience' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <FaClock /> Filter by Exp {sortBy === 'experience' && (sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Showing {sortedApplicants.length} applicants
            </div>
          </div>

       
          <div className="grid md:grid-cols-2 gap-6">
            {sortedApplicants.map((applicant) => (
              <div key={applicant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {applicant.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{applicant.name}</h3>
                      <p className="text-sm text-gray-500">{applicant.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-600">{applicant.percentage}%</div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                      <div className={`h-2 rounded-full ${applicant.percentage >= 90 ? 'bg-green-500' : applicant.percentage >= 80 ? 'bg-teal-500' : 'bg-yellow-500'}`} style={{ width: `${applicant.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div><span className="text-gray-500">Experience:</span> <span className="text-gray-700">{applicant.experience}</span></div>
                  <div><span className="text-gray-500">Salary:</span> <span className="text-gray-700">{applicant.expectedSalary}</span></div>
                  <div><span className="text-gray-500">Available:</span> <span className="text-gray-700">{applicant.availability}</span></div>
                  <div><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(applicant.status)}`}>{applicant.status}</span></div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleViewResume(applicant)} className="flex-1 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition text-sm flex items-center justify-center gap-1">
                    <FaFileAlt /> Resume
                  </button>
                  <button onClick={() => handleViewApplicantProfile(applicant)} className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm flex items-center justify-center gap-1">
                    <FaEye /> Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
      
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
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
              <input 
                type="text" 
                placeholder="Search jobs..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" 
              />
            </div>
            <button className="relative">
              <FaBell className="text-gray-600 text-xl" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{userAvatar}</div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
   
        <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 backdrop-blur rounded-full p-2">
                    <span className="text-2xl"></span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Welcome back, <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">{userName.split(' ')[0]}</span>!
                  </h1>
                </div>
                <p className="text-teal-100 text-lg mb-6">
                  Here's your hiring snapshot for today. You're doing great! 
                </p>
              </div>
              
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <FaBriefcase className="text-2xl text-yellow-300" />
                  <p className="text-xs text-teal-100 uppercase">Total Jobs</p>
                </div>
                <p className="text-3xl font-bold">{stats.totalJobs}</p>
                <p className="text-xs text-teal-100 mt-1">Posted</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <FaCheckCircle className="text-2xl text-green-300" />
                  <p className="text-xs text-teal-100 uppercase">Active Jobs</p>
                </div>
                <p className="text-3xl font-bold">{stats.activeJobs}</p>
                <p className="text-xs text-teal-100 mt-1">All open</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <FaUsers className="text-2xl text-blue-300" />
                  <p className="text-xs text-teal-100 uppercase">Applicants</p>
                </div>
                <p className="text-3xl font-bold">{stats.totalApplicants}</p>
                <p className="text-xs text-teal-100 mt-1">↑ 23% vs last month</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <FaChartLine className="text-2xl text-purple-300" />
                  <p className="text-xs text-teal-100 uppercase">Conversion</p>
                </div>
                <p className="text-3xl font-bold">{stats.responseRate}</p>
                <p className="text-xs text-teal-100 mt-1">Above avg</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Application Fulfillment</span>
                  <span className="text-sm font-bold">{Math.min(100, Math.round((stats.totalApplicants / (stats.activeJobs * 50)) * 100))}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-300 to-orange-300 h-2 rounded-full" style={{ width: `${Math.min(100, (stats.totalApplicants / (stats.activeJobs * 50)) * 100)}%` }}></div>
                </div>
                <p className="text-xs text-teal-100 mt-2">Target: 50 applicants per job</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Time to Hire</span>
                  <span className="text-sm font-bold">{stats.avgTimeToHire}</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-300 to-blue-300 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-teal-100 mt-2">Target: 15 days - You're ahead!</p>
              </div>
            </div>
            
            <div className="mt-4 bg-white/20 backdrop-blur rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                
                
              </div>
              
            </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaBriefcase className="text-2xl text-white" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-800">{stats.totalJobs}</span>
                <p className="text-xs text-green-500 mt-1">Total Posted</p>
              </div>
            </div>
            <h3 className="text-gray-600 font-medium">Total Jobs</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-gray-400">{stats.activeJobs} active positions</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaCheckCircle className="text-2xl text-white" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-800">{stats.activeJobs}</span>
                <p className="text-xs text-green-500 mt-1">Active</p>
              </div>
            </div>
            <h3 className="text-gray-600 font-medium">Active Jobs</h3>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaUsers className="text-2xl text-white" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-800">{stats.totalApplicants}</span>
                
                
              </div>
            </div>
            <h3 className="text-gray-600 font-medium">Total Applicants</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="w-6 h-6 bg-gradient-to-r from-teal-400 to-green-400 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <p className="text-xs text-gray-400">+{Math.floor(Math.random() * 50) + 20} new</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-3 rounded-xl group-hover:scale-110 transition">
                <FaChartLine className="text-2xl text-white" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-800">{stats.totalViews}</span>
                <p className="text-xs text-green-500 mt-1">Views</p>
              </div>
            </div>
            <h3 className="text-gray-600 font-medium">Total Views</h3>
            <div className="mt-2 flex items-center gap-2">
              <FaStar className="text-yellow-400 text-xs" />
              <p className="text-xs text-gray-400">↑ 23% this month</p>
            </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button onClick={() => setShowPostJob(true)} className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl p-4 flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-105 font-semibold">
            <FaPlus /> Post New Job
          </button>
          <button onClick={handleViewAllApplicants} className="bg-white rounded-xl p-4 border-2 border-teal-500 text-teal-600 flex items-center justify-center gap-2 hover:bg-teal-50 transition-all font-semibold">
            <FaUsers /> View All Applicants ({allApplicants.length})
          </button>
          
        </div>

        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Job Postings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your job listings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <FaThLarge />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <FaList />
            </button>
            <div className="relative ml-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="all">All Jobs</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
              <FaFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

       \
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition">{job.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                      <FaBuilding className="text-teal-400" /> {job.company}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 flex items-center gap-2 text-sm">
                    <FaMapMarkerAlt className="text-teal-500" /> {job.location}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 text-sm">
                    <FaGraduationCap className="text-teal-500" /> {job.minExperience} experience
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 text-sm">
                    <FaUsers className="text-teal-500" /> {job.applicants} applicants
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 text-sm">
                    <FaCalendarAlt className="text-teal-500" /> Posted {job.postedDate}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.requiredSkills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">{skill}</span>
                  ))}
                  {job.requiredSkills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">+{job.requiredSkills.length - 3}</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleViewApplicants(job)} className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm">
                    <FaEye /> View ({job.applicants})
                  </button>
                  <button onClick={() => { setEditJob(job); setShowEditJob(true); }} className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteJob(job.id)} className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or post a new job</p>
            <button onClick={() => setShowPostJob(true)} className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition">
              Post New Job
            </button>
          </div>
        )}
      </div>

      
      {showPostJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">✨ Post a New Job</h2>
              <p className="text-teal-100 text-sm mt-1">Fill in the details to find your perfect candidate</p>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Job Title *" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              <input type="text" placeholder="Company Name *" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Location *" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Minimum Experience *" value={newJob.minExperience} onChange={(e) => setNewJob({...newJob, minExperience: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Required Skills (comma separated)" value={newJob.requiredSkills} onChange={(e) => setNewJob({...newJob, requiredSkills: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <textarea rows="4" placeholder="Job Description" value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"></textarea>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowPostJob(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handlePostJob} className="px-6 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition">Post Job 🚀</button>
            </div>
          </div>
        </div>
      )}

     
      {showEditJob && editJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">✏️ Update Job</h2>
              <button onClick={() => setShowEditJob(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Job Title" value={editJob.title} onChange={(e) => setEditJob({...editJob, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
              <input type="text" placeholder="Company" value={editJob.company} onChange={(e) => setEditJob({...editJob, company: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" />
              <input type="text" placeholder="Location" value={editJob.location} onChange={(e) => setEditJob({...editJob, location: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" />
              <input type="text" placeholder="Min Experience" value={editJob.minExperience} onChange={(e) => setEditJob({...editJob, minExperience: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl" />
              <textarea rows="4" placeholder="Description" value={editJob.description} onChange={(e) => setEditJob({...editJob, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl"></textarea>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowEditJob(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateJob} className="px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition">Update Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;