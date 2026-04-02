import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaPlay,
  FaSpinner,
  FaStopCircle,
  FaTrophy,
  FaBrain,
  FaRegClock,
  FaArrowLeft,
  FaRegEdit,
} from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  endInterviewSession,
  getInterviewResult,
  startInterviewSession,
  submitInterviewAnswer,
} from '../utils/interview';

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

const normalizeList = (items) => (Array.isArray(items) ? items : []);

const MockInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answer, setAnswer] = useState('');
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const strengths = useMemo(() => normalizeList(resultData?.strengths), [resultData]);
  const weaknesses = useMemo(() => normalizeList(resultData?.weaknesses), [resultData]);
  const qaHistory = useMemo(
    () => normalizeList(resultData?.questionAnswers).length > 0
      ? normalizeList(resultData?.questionAnswers)
      : questionAnswers,
    [questionAnswers, resultData]
  );

  const handleUnauthorized = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  const withAuth = async (request) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return null;
    }

    const response = await request(token);

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return null;
    }

    return response;
  };

  const resetInterviewState = (nextMessage = '') => {
    setCurrentQuestion('');
    setQuestionNumber(0);
    setTotalQuestions(10);
    setAnswer('');
    setInterviewCompleted(false);
    setResultData(null);
    setQuestionAnswers([]);
    setSessionStarted(false);
    setMessage(nextMessage);
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setLoadingAction('start');
    setError('');
    setMessage('');

    try {
      const response = await withAuth((token) => startInterviewSession(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to start interview session.');
      }

      setSessionStarted(true);
      setInterviewCompleted(false);
      setResultData(null);
      setQuestionAnswers([]);
      setCurrentQuestion(data.question || '');
      setQuestionNumber(data.currentQuestionNumber ?? 1);
      setTotalQuestions(data.totalQuestions ?? 10);
      setAnswer('');
      setMessage(data.sessionStatus || 'Interview session started.');
    } catch (startError) {
      setError(startError.message || 'Unable to start interview session.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  useEffect(() => {
    if (location.state?.autoStart) {
      handleStartInterview();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please write an answer before submitting.');
      return;
    }

    setLoading(true);
    setLoadingAction('submit');
    setError('');
    setMessage('');

    try {
      const payload = {
        questionNumber,
        answer: answer.trim(),
      };

      const response = await withAuth((token) => submitInterviewAnswer(token, payload));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit answer.');
      }

      setQuestionAnswers((previous) => [
        ...previous,
        {
          questionNumber,
          question: currentQuestion,
          answer: answer.trim(),
        },
      ]);

      if (data.completed) {
        setInterviewCompleted(true);
        setSessionStarted(true);
        setCurrentQuestion('');
        setAnswer('');
        setQuestionNumber(data.nextQuestionNumber ?? questionNumber);
        setTotalQuestions(data.totalQuestions ?? totalQuestions);
        setMessage('Interview completed. You can now fetch your result.');
        return;
      }

      setCurrentQuestion(data.nextQuestion || '');
      setQuestionNumber(data.nextQuestionNumber ?? questionNumber + 1);
      setTotalQuestions(data.totalQuestions ?? totalQuestions);
      setAnswer('');
      setMessage(`Answer submitted. Moving to question ${data.nextQuestionNumber ?? questionNumber + 1}.`);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit answer.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleGetResult = async () => {
    setLoading(true);
    setLoadingAction('result');
    setError('');
    setMessage('');

    try {
      const response = await withAuth((token) => getInterviewResult(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch interview result.');
      }

      setResultData(data);
      setMessage('Interview result loaded successfully.');
    } catch (resultError) {
      setError(resultError.message || 'Unable to fetch interview result.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    setLoadingAction('end');
    setError('');

    try {
      const response = await withAuth((token) => endInterviewSession(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to end interview session.');
      }

      resetInterviewState(data.message || 'Interview session ended.');
    } catch (endError) {
      setError(endError.message || 'Unable to end interview session.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const progressPercent =
    totalQuestions > 0 && questionNumber > 0
      ? Math.min(100, Math.round((questionNumber / totalQuestions) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-teal-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-green-100/60 blur-3xl" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                AI Interview Studio
              </p>
              <h1 className="text-3xl font-bold text-gray-800 mt-2">SmartHire Mock Interview</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                Answer each question one by one and review your AI interview result at the end.
              </p>
            </div>
            <button
              onClick={() => navigate('/candidate-dashboard')}
              className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              <span className="inline-flex items-center gap-2">
                <FaArrowLeft />
                Exit
              </span>
            </button>
          </div>

          {!sessionStarted ? (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
              <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-green-500 rounded-3xl p-7 text-white shadow-lg">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
                  <FaBrain />
                  AI Guided Session
                </div>
                <h2 className="mt-5 text-3xl font-bold leading-tight">
                  Start a focused interview session in a dedicated workspace.
                </h2>
                <p className="mt-4 text-sm text-teal-50 max-w-xl leading-6">
                  You&apos;ll receive one question at a time, write your response in a distraction-free
                  answer block, and get a structured result card after completion.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/90">
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/80">Questions</p>
                    <p className="mt-1 text-2xl font-bold">10</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/80">Flow</p>
                    <p className="mt-1 text-lg font-semibold">Answer, submit, review</p>
                  </div>
                </div>
                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="mt-8 px-6 py-3 bg-white text-teal-700 rounded-2xl font-semibold hover:shadow-lg transition disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingAction === 'start' ? <FaSpinner className="animate-spin" /> : <FaPlay />}
                  Start AI Interview
                </button>
              </div>

              <div className="rounded-3xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-800">What happens here</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-sm font-semibold text-gray-800">1. Receive a question</p>
                    <p className="mt-2 text-sm text-gray-600 leading-6">
                      The session begins with the first AI-generated interview prompt.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-sm font-semibold text-gray-800">2. Write your answer</p>
                    <p className="mt-2 text-sm text-gray-600 leading-6">
                      Use the answer block to draft a clear, structured response before you submit.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-sm font-semibold text-gray-800">3. Review the result</p>
                    <p className="mt-2 text-sm text-gray-600 leading-6">
                      After the final question, fetch your overall score, strengths, weaknesses, and analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.9fr] gap-5">
                <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/70 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                        Live Session
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        {interviewCompleted
                          ? 'Interview completed successfully'
                          : `Question ${questionNumber} of ${totalQuestions}`}
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        {interviewCompleted
                          ? 'Fetch your result to review the full interview analysis.'
                          : 'Read the prompt carefully and write a focused, structured answer.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white border border-teal-100 px-3 py-1.5 text-gray-700">
                        <FaRegClock className="text-teal-600" />
                        {qaHistory.length} answered
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white border border-teal-100 px-3 py-1.5 text-gray-700">
                        <FaBrain className="text-teal-600" />
                        {interviewCompleted ? 'Ready for result' : 'AI session active'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 w-full bg-white/80 rounded-full h-3 border border-teal-100 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {message && (
                    <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {message}
                    </div>
                  )}

                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {!interviewCompleted && (
                    <div className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-teal-50 p-3 text-teal-600">
                          <FaBrain />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Current Question</p>
                          <h3 className="mt-2 text-xl font-semibold leading-8 text-gray-900">
                            {currentQuestion || 'No interview question is available right now.'}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50/80 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaRegEdit className="text-teal-600" />
                          Your Answer
                        </div>
                        <textarea
                          value={answer}
                          onChange={(event) => setAnswer(event.target.value)}
                          rows={9}
                          placeholder="Write your answer here with context, action, and measurable impact..."
                          className="mt-3 w-full border border-gray-200 rounded-2xl bg-white p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-gray-700 leading-6"
                          disabled={loading}
                        />
                        <p className="mt-3 text-xs text-gray-500">
                          Tip: keep your answer specific, concise, and outcome-focused.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                    Session Controls
                  </p>
                  <div className="mt-5 space-y-3">
                    {!interviewCompleted && (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-2xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingAction === 'submit' ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCheckCircle />
                        )}
                        Submit Answer
                      </button>
                    )}

                    {interviewCompleted && (
                      <button
                        onClick={handleGetResult}
                        disabled={loading}
                        className="w-full px-6 py-3 border-2 border-teal-500 text-teal-600 rounded-2xl font-semibold hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingAction === 'result' ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrophy />
                        )}
                        Get Result
                      </button>
                    )}

                    <button
                      onClick={handleEndInterview}
                      disabled={loading}
                      className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingAction === 'end' ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaStopCircle />
                      )}
                      End Interview
                    </button>
                  </div>

                  <div className="mt-6 rounded-2xl bg-teal-50 border border-teal-100 p-4">
                    <p className="text-sm font-semibold text-gray-800">Session Snapshot</p>
                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Current progress</span>
                        <span className="font-semibold text-gray-800">
                          {interviewCompleted ? `${totalQuestions}/${totalQuestions}` : `${questionNumber}/${totalQuestions}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Answers saved</span>
                        <span className="font-semibold text-gray-800">{qaHistory.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <span className="font-semibold text-gray-800">
                          {interviewCompleted ? 'Completed' : 'In progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {resultData && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white p-5 shadow-lg">
                      <p className="text-sm text-teal-700 font-semibold">Score</p>
                      <p className="mt-2 text-4xl font-bold text-white">
                        {resultData.score ?? 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 lg:col-span-3 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Feedback</p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {resultData.feedback || 'No interview feedback was returned.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Technical Analysis</p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {resultData.technicalAnalysis || 'No technical analysis available.'}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Behavioral Analysis</p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {resultData.behavioralAnalysis || 'No behavioral analysis available.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Strengths</p>
                      {strengths.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                          {strengths.map((item) => (
                            <li key={item} className="rounded-xl bg-green-50 px-3 py-2 border border-green-100">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No strengths returned yet.</p>
                      )}
                    </div>
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Weaknesses</p>
                      {weaknesses.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                          {weaknesses.map((item) => (
                            <li key={item} className="rounded-xl bg-red-50 px-3 py-2 border border-red-100">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No weaknesses returned yet.</p>
                      )}
                    </div>
                  </div>

                  {qaHistory.length > 0 && (
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">Question & Answer History</p>
                      <div className="mt-4 space-y-4">
                        {qaHistory.map((entry, index) => (
                          <div key={`${entry.questionNumber ?? index}-${index}`} className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                            <p className="text-sm font-semibold text-gray-800">
                              Q{entry.questionNumber ?? index + 1}. {entry.question || 'Question'}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {entry.answer || entry.userAnswer || 'No answer recorded.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
