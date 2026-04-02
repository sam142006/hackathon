import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const interviewQuestions = [
  'Tell me about yourself and your recent experience.',
  'What project are you most proud of, and why?',
  'How do you approach learning a new technology quickly?',
  'Describe a challenging bug you solved recently.',
  'How do you prioritize tasks when deadlines overlap?',
  'Tell me about a time you handled feedback or conflict at work.',
  'How do you ensure your code is maintainable and scalable?',
  'What would you improve in your current or last team workflow?',
  'Why are you interested in this role and company type?',
  'Where do you want your career to grow over the next two years?',
];

const MockInterview = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => interviewQuestions.map(() => ''));
  const [showAnalysis, setShowAnalysis] = useState(false);

  const currentQuestion = interviewQuestions[currentIndex];
  const isLastQuestion = currentIndex === interviewQuestions.length - 1;
  const completedAnswers = answers.filter((answer) => answer.trim().length > 0).length;

  const feedback = useMemo(() => {
    const averageLength =
      answers.reduce((total, answer) => total + answer.trim().length, 0) / answers.length;

    if (completedAnswers === 0) {
      return 'Add a few answers to get meaningful feedback.';
    }

    if (completedAnswers < interviewQuestions.length) {
      return 'You answered some questions well, but finishing all 10 will give you stronger interview coverage.';
    }

    if (averageLength > 180) {
      return 'Strong depth overall. Your answers show detail and structure; next step is tightening a few responses with measurable outcomes.';
    }

    if (averageLength > 90) {
      return 'Good foundation. Try adding more concrete examples, metrics, and decision-making details to stand out.';
    }

    return 'Your responses are concise. Add situation, action, and result details so each answer feels more convincing.';
  }, [answers, completedAnswers]);

  const handleAnswerChange = (value) => {
    setAnswers((previousAnswers) =>
      previousAnswers.map((answer, index) => (index === currentIndex ? value : answer))
    );
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((previousIndex) => previousIndex + 1);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setShowAnalysis(false);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">SmartHire Mock Interview</h1>
              <p className="text-sm text-gray-500 mt-2">
                Practice 10 interview questions and review instant feedback.
              </p>
            </div>
            <button
              onClick={() => navigate('/candidate-dashboard')}
              className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Exit
            </button>
          </div>

          {!started ? (
            <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl p-6">
              <p className="text-gray-700 mb-4">
                You&apos;ll answer one question at a time, and your responses stay in local state for
                this session.
              </p>
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Get Mock Interview
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Question {currentIndex + 1} of {interviewQuestions.length}
                </span>
                <span>{completedAnswers} answered</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / interviewQuestions.length) * 100}%` }}
                />
              </div>

              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{currentQuestion}</h2>
                <textarea
                  value={answers[currentIndex]}
                  onChange={(event) => handleAnswerChange(event.target.value)}
                  rows={8}
                  placeholder="Write your answer here..."
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setShowAnalysis(true)}
                  disabled={!isLastQuestion}
                  className="px-6 py-3 border-2 border-teal-500 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Analysis
                </button>
              </div>

              {showAnalysis && (
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Interview Feedback</h3>
                  <p className="text-gray-700 mb-3">{feedback}</p>
                  <p className="text-sm text-gray-500">
                    Tip: keep answers structured with context, action, and measurable impact.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockInterview;