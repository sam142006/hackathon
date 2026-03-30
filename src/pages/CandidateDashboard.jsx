import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FaBriefcase, FaBookmark, FaCalendarAlt, FaMapMarkerAlt, FaBuilding, FaUpload, FaUser, FaEnvelope } from 'react-icons/fa';

const CandidateDashboard = () => {
  const [jobs, setJobs] = useState([
    { id: 1, title: 'Frontend Developer', company: 'Tech Corp', location: 'Remote', applied: false },
    { id: 2, title: 'Backend Developer', company: 'Innovate Inc', location: 'New York', applied: true },
    { id: 3, title: 'UI/UX Designer', company: 'Creative Studio', location: 'San Francisco', applied: false },
    { id: 4, title: 'DevOps Engineer', company: 'Cloud Solutions', location: 'Remote', applied: false },
    { id: 5, title: 'Product Manager', company: 'Startup Hub', location: 'Austin', applied: true },
  ]);

  const [appliedJobs, setAppliedJobs] = useState(jobs.filter(job => job.applied));
  const [savedJobs, setSavedJobs] = useState(3);
  const [interviews, setInterviews] = useState(2);
  const [resume, setResume] = useState(null);

  const userName = localStorage.getItem('userName') || 'John Doe';
  const userEmail = localStorage.getItem('userEmail') || 'john.doe@example.com';

  const stats = {
    jobsApplied: appliedJobs.length,
    savedJobs: savedJobs,
    interviews: interviews
  };

  const handleApply = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, applied: true } : job
    ));
    const appliedJob = jobs.find(job => job.id === jobId);
    setAppliedJobs([...appliedJobs, { ...appliedJob, applied: true }]);
    alert(`Applied to ${appliedJob.title} successfully!`);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file.name);
      alert(`Resume "${file.name}" uploaded successfully!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Navbar title="Candidate Dashboard" />
        
      
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 p-4 rounded-full">
              <FaUser className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
              <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <FaEnvelope className="text-sm" />
                <span>{userEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="bg-teal-100 p-2 rounded-full">
                <FaUpload className="text-teal-600" />
              </div>
              <span className="text-gray-700">Upload Resume</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
              {resume && (
                <span className="text-sm text-green-600">✓ {resume}</span>
              )}
            </label>
          </div>
        </div>
        
    
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <FaBriefcase className="text-2xl text-teal-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.jobsApplied}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Jobs Applied</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaBookmark className="text-2xl text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.savedJobs}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Saved Jobs</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaCalendarAlt className="text-2xl text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.interviews}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Interviews</h3>
          </div>
        </div>
        
      
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Available Jobs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaBriefcase className="text-teal-500" />
                      <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <FaBuilding />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaMapMarkerAlt />
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={job.applied}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                      job.applied
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-green-500 text-white hover:from-teal-600 hover:to-green-600 shadow-md'
                    }`}
                  >
                    {job.applied ? 'Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
       
        {appliedJobs.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white rounded-2xl shadow-lg">
            <FaBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No applications yet</h3>
            <p className="text-gray-500">Start applying to jobs to see them here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;