import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FaBriefcase, FaUsers, FaCheckCircle, FaPlus, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([
    { id: 1, title: 'Frontend Developer', location: 'Remote', salary: '$80k - $100k', status: 'Active', applicants: 45 },
    { id: 2, title: 'Backend Developer', location: 'New York', salary: '$90k - $120k', status: 'Active', applicants: 32 },
    { id: 3, title: 'UI/UX Designer', location: 'San Francisco', salary: '$70k - $90k', status: 'Closed', applicants: 28 },
    { id: 4, title: 'DevOps Engineer', location: 'Remote', salary: '$100k - $130k', status: 'Active', applicants: 19 },
  ]);

  const stats = {
    totalJobs: jobs.filter(j => j.status === 'Active').length,
    totalApplicants: jobs.reduce((sum, job) => sum + job.applicants, 0),
    activeJobs: jobs.filter(j => j.status === 'Active').length
  };

  const handlePostJob = () => {
    const newJob = {
      id: jobs.length + 1,
      title: 'New Position',
      location: 'Remote',
      salary: '$70k - $90k',
      status: 'Active',
      applicants: 0
    };
    setJobs([...jobs, newJob]);
    alert('New job posted! (Demo)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Navbar title="Recruiter Dashboard" />
        
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <FaBriefcase className="text-2xl text-teal-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.totalJobs}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Jobs Posted</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaUsers className="text-2xl text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.totalApplicants}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Applicants</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaCheckCircle className="text-2xl text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{stats.activeJobs}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Active Jobs</h3>
          </div>
        </div>
        
    
        <div className="mb-6 flex justify-end">
          <button
            onClick={handlePostJob}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            <FaPlus />
            <span>Post New Job</span>
          </button>
        </div>
        
      
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Posted Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaBriefcase className="text-teal-500 mr-2" />
                        <span className="font-medium text-gray-900">{job.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-gray-400 mr-2" />
                        <span className="text-gray-600">{job.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMoneyBillWave className="text-gray-400 mr-2" />
                        <span className="text-gray-600">{job.salary}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {job.applicants}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;