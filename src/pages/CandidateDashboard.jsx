import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBriefcase, 
  FaSignOutAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaBuilding,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaBookmark,
  FaCalendarAlt,
  FaUpload,
  FaFileAlt,
  FaStar,
  FaHeart,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaChartLine,
  FaRocket,
  FaBell,
  FaCode,
  FaUsers,
  FaFire,
  FaRegHeart,
  FaRegBookmark,
  FaRegClock,
  FaEnvelope,
  FaGraduationCap,
  FaUserCircle,
  FaArrowLeft,
  FaThumbsUp,
  FaSpinner,
  FaTimes,
  FaPhone,
  FaUserTie,
  FaBriefcase as FaBriefcaseIcon,
  FaAward,
  FaCertificate,
  FaLanguage,
  FaTools
} from 'react-icons/fa';

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const userName = localStorage.getItem('userName') || 'Alex Morgan';
  const userEmail = localStorage.getItem('userEmail') || 'alex.morgan@example.com';
  const userAvatar = userName.split(' ').map(n => n[0]).join('');
  

  const [profile, setProfile] = useState({
    name: userName,
    email: userEmail,
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    title: 'Senior Full Stack Developer',
    experience: '6+ years',
    currentCompany: 'Tech Solutions Inc.',
    education: 'B.Tech in Computer Science - IIT Delhi',
    bio: 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Expert in React, Node.js, and cloud technologies.',
    skills: ['React.js', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'GraphQL', 'MongoDB', 'Tailwind CSS', 'Next.js'],
    certifications: ['AWS Certified Developer', 'Meta Frontend Developer', 'Google Cloud Associate'],
    languages: ['English (Fluent)', 'Hindi (Native)', 'Spanish (Basic)'],
    socialLinks: {
      linkedin: 'linkedin.com/in/alexmorgan',
      github: 'github.com/alexmorgan',
      portfolio: 'alexmorgan.dev'
    },
    experience_history: [
      { company: 'Tech Solutions Inc.', position: 'Senior Full Stack Developer', period: '2022 - Present', description: 'Leading frontend team, architecting React applications' },
      { company: 'Digital Innovations', position: 'Frontend Developer', period: '2019 - 2022', description: 'Developed responsive web applications' },
      { company: 'Startup Hub', position: 'Junior Developer', period: '2017 - 2019', description: 'Built and maintained client websites' }
    ]
  });
  
  const [jobs] = useState([
    { 
      id: 1, 
      title: 'Senior Frontend Developer', 
      company: 'TechCorp Inc.',
     
      location: 'Remote, India', 
      salary: '$120k - $150k', 
      type: 'Full-time',
      experience: '5+ years',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
      posted: '2 days ago',
      applicants: 47,
      featured: true,
      description: 'Join our innovative team to build next-generation web applications...',
      matchPercentage: 92
    },
    { 
      id: 2, 
      title: 'Backend Engineer', 
      company: 'CloudSystems',
      
      location: 'Bangalore, India', 
      salary: '$100k - $130k', 
      type: 'Full-time',
      experience: '3+ years',
      skills: ['Node.js', 'Python', 'AWS', 'MongoDB'],
      posted: '3 days ago',
      applicants: 32,
      featured: false,
      description: 'Build scalable microservices and cloud infrastructure...',
      matchPercentage: 85
    },
    { 
      id: 3, 
      title: 'UI/UX Designer', 
      company: 'CreativeStudio',
      
      location: 'Mumbai, India', 
      salary: '$80k - $100k', 
      type: 'Contract',
      experience: '2+ years',
      skills: ['Figma', 'Adobe XD', 'User Research'],
      posted: '1 day ago',
      applicants: 28,
      featured: true,
      description: 'Create beautiful user experiences for our products...',
      matchPercentage: 78
    }
  ]);

  const stats = {
    jobsApplied: 8,
    savedJobs: 12,
    interviews: 3,
    profileViews: 245,
    applicationSuccess: '68%'
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const handleApply = (job) => {
    alert(`✨ Application submitted for ${job.title} at ${job.company}!\n\nYour application has been sent to the recruiter.`);
  };

  const handleSaveJob = (jobId) => {
    alert(` Job saved to your wishlist!`);
  };

  const handleEditProfile = () => {
    alert(` Edit profile feature coming soon!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50">
    
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 p-2 rounded-xl shadow-lg transform hover:scale-105 transition">
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
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search jobs, companies..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-80 text-sm" 
                />
              </div>
              
              <button className="relative group">
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  3
                </div>
                <FaBell className="text-gray-600 text-xl group-hover:text-teal-600 transition" />
              </button>
              
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-green-500 rounded-full blur opacity-50 group-hover:opacity-100 transition"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {userAvatar}
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       
        <div className="relative bg-gradient-to-r from-teal-600 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 backdrop-blur rounded-full p-2">
                <FaStar className="text-2xl" />
              </div>
              <h1 className="text-4xl font-bold">
                Welcome back, <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">{userName.split(' ')[0]}</span>! 👋
              </h1>
            </div>
            <p className="text-teal-100 text-lg mb-6">
              Your next career opportunity is just a click away. {stats.jobsApplied} applications sent, {stats.interviews} interviews scheduled! 🎯
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-2 bg-white text-teal-600 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2">
                <FaChartLine /> View Analytics
              </button>
              <button className="px-6 py-2 bg-white/20 backdrop-blur rounded-xl font-semibold hover:bg-white/30 transition flex items-center gap-2">
                <FaFileAlt /> Resume Builder
              </button>
              <button className="px-6 py-2 bg-white/20 backdrop-blur rounded-xl font-semibold hover:bg-white/30 transition flex items-center gap-2">
                <FaChartLine /> Career Path
              </button>
            </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-teal-500 to-green-500 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition">
                <FaCheckCircle className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                {stats.jobsApplied}
              </span>
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">Jobs Applied</h3>
            <p className="text-gray-500 text-sm">Active applications</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition">
                <FaBookmark className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.savedJobs}
              </span>
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">Saved Jobs</h3>
            <p className="text-gray-500 text-sm">Your wishlist</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition">
                <FaCalendarAlt className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.interviews}
              </span>
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">Interviews</h3>
            <p className="text-gray-500 text-sm">Upcoming interviews</p>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition">
                <FaChartLine className="text-2xl text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.applicationSuccess}
              </span>
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">Success Rate</h3>
            <p className="text-gray-500 text-sm">Application to interview</p>
          </div>
        </div>

       
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-green-500 rounded-full blur opacity-50"></div>
                <div className="relative w-20 h-20 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {userAvatar}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
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
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
              >
                <FaUserCircle /> Open Profile
              </button>
              <button 
                onClick={handleEditProfile}
                className="px-5 py-2 border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition flex items-center gap-2"
              >
                <FaFileAlt /> Edit Profile
              </button>
            </div>
          </div>
          
          <div className="border-t mt-6 pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition cursor-pointer">
                <FaLinkedin className="text-xl" /> <span className="text-sm">linkedin.com/in/alexmorgan</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition cursor-pointer">
                <FaGithub className="text-xl" /> <span className="text-sm">github.com/alexmorgan</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition cursor-pointer">
                <FaGlobe className="text-xl" /> <span className="text-sm">alexmorgan.dev</span>
              </div>
            </div>
          </div>
        </div>

       
        <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaCode className="text-teal-600" /> Top Skills
            </h3>
            <button className="text-teal-600 text-sm hover:text-teal-700">+ Add Skills</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.skills.slice(0, 8).map((skill, i) => (
              <span key={i} className="px-4 py-2 bg-white rounded-full text-gray-700 text-sm shadow-sm hover:shadow-md transition cursor-pointer hover:bg-teal-50 hover:text-teal-600">
                {skill}
              </span>
            ))}
          </div>
        </div>

       
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['All Jobs', 'Featured', 'Remote', 'Full-time', 'Contract'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-5 py-2 rounded-xl font-medium transition-all ${activeTab === tab.toLowerCase() ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">Showing {filteredJobs.length} jobs</p>
        </div>

      
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
           
            <div className="hidden md:block text-6xl"></div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105">
              {job.featured && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold px-3 py-1 inline-block rounded-br-xl">
                  <FaStar className="inline mr-1" /> Featured
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      {job.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition">
                        {job.title}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <FaBuilding className="text-teal-400" /> {job.company}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleSaveJob(job.id)} className="text-gray-400 hover:text-red-500 transition">
                    <FaRegHeart className="text-xl" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-teal-500" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaStar className="text-yellow-500" /> {job.salary}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="text-teal-500" /> {job.type}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaGraduationCap className="text-teal-500" /> {job.experience}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaUsers className="text-teal-400" />
                    <span>{job.applicants} applicants</span>
                    <span className="mx-1">•</span>
                    <FaRegClock className="text-teal-400" />
                    <span>{job.posted}</span>
                  </div>
                  <button
                    onClick={() => handleApply(job)}
                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
                  >
                    <FaEye /> Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
         
            <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 rounded-t-3xl text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur p-3 rounded-full">
                    <FaUserTie className="text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold">Profile Overview</h2>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

          
            <div className="p-6">
              
              <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    {userAvatar}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
                  <p className="text-teal-600 font-semibold">{profile.title}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-sm text-gray-500"><FaEnvelope /> {profile.email}</span>
                    <span className="flex items-center gap-1 text-sm text-gray-500"><FaPhone /> {profile.phone}</span>
                    <span className="flex items-center gap-1 text-sm text-gray-500"><FaMapMarkerAlt /> {profile.location}</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition flex items-center gap-2">
                  <FaFileAlt /> Download Resume
                </button>
              </div>

            
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <FaUserCircle /> About Me
                </h4>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>

           
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaBriefcaseIcon /> Work Experience
                </h4>
                <div className="space-y-4">
                  {profile.experience_history.map((exp, i) => (
                    <div key={i} className="border-l-4 border-teal-500 pl-4">
                      <p className="font-semibold text-gray-800">{exp.position}</p>
                      <p className="text-teal-600 text-sm">{exp.company} | {exp.period}</p>
                      <p className="text-gray-500 text-sm mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaCode /> Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaAward /> Certifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <FaCertificate className="text-teal-500" />
                      <span className="text-gray-700 text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

             
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaLanguage /> Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

             
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaGlobe /> Social Profiles
                </h4>
                <div className="flex gap-4">
                  <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                    <FaLinkedin className="text-xl" /> LinkedIn
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                    <FaGithub className="text-xl" /> GitHub
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                    <FaGlobe className="text-xl" /> Portfolio
                  </a>
                </div>
              </div>
            </div>

          
            <div className="border-t p-6 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button 
                onClick={handleEditProfile}
                className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;