import { useEffect, useState } from "react";
import Modal from "react-modal";
import CreateQuestionForm from "../components/CreateQuestionForm";

Modal.setAppElement("#root");

function QuestionsPage() {
    const [questions, setQuestions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [admin, setAdmin] = useState(false);
    const [showAnswersModal, setShowAnswersModal] = useState(false);
    const [myAnswers, setMyAnswers] = useState([]);

    const isAdmin = () => {
        const token = localStorage.getItem("token");
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] === "Admin";
        } catch (e) {
            return false;
        }
    };
    const fetchMyAnswers = async () => {
        try {
            const res = await fetch("https://localhost:7119/api/question/my-answers", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setMyAnswers(data);
            setShowAnswersModal(true);
        } catch (err) {
            console.error("Failed to fetch answers:", err);
            alert("Could not load your answers.");
        }
    };

    const fetchQuestions = async () => {
        try {
            const res = await fetch("https://localhost:7119/api/question/today");
            if (!res.ok) throw new Error("Failed to fetch questions");
            const data = await res.json();
            setQuestions(data);

            if (!data.length) {
                setUserAnswers({});
                return;
            }

            const token = localStorage.getItem("token");
            const allAnswers = {};
            for (const q of data) {
                const answerRes = await fetch(`https://localhost:7119/api/question/${q.id}/answers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (answerRes.ok) {
                    const answers = await answerRes.json();
                    const currentUserId = token
                        ? JSON.parse(atob(token.split('.')[1]))["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
                        : null;
                    const myAnswer = answers.find((a) => a.userId === Number(currentUserId));
                    if (myAnswer) {
                        allAnswers[q.id] = myAnswer;
                    }
                }
            }
            setUserAnswers(allAnswers);
        } catch (err) {
            console.error(err);
            alert("Could not load questions.");
        }
    };


    useEffect(() => {
        setAdmin(isAdmin());
        fetchQuestions();
    }, []);

    const submitAnswer = async (questionId, selectedAnswerIndex) => {
        try {
            const res = await fetch("https://localhost:7119/api/question/answer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ questionId, selectedAnswerIndex }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }

            alert("Answer submitted!");
            await fetchQuestions();
        } catch (err) {
            console.error(err);
            alert("Failed to submit answer: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold">Today's Questions</h2>
      
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={fetchMyAnswers}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold w-full sm:w-auto"
              >
                View My Answers
              </button>
      
              {admin && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-semibold w-full sm:w-auto"
                >
                  Create New Question
                </button>
              )}
            </div>
          </div>
      
          {questions.length === 0 ? (
            <p className="text-gray-300">No questions for today.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="bg-slate-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white">{q.title}</h3>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-gray-400">Game:</span>{" "}
                      <span className="text-white">
                        {q.game?.homeTeam} vs {q.game?.awayTeam}
                      </span>
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-gray-400">Deadline:</span>{" "}
                      {new Date(q.deadline).toLocaleString()}
                    </p>
                  </div>
      
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to answer 'Yes'?")) {
                          submitAnswer(q.id, 0);
                        }
                      }}
                      disabled={!!userAnswers[q.id]}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold text-center transition
                        ${userAnswers[q.id]
                          ? userAnswers[q.id].selectedAnswerIndex === 0
                            ? "bg-green-600 text-white font-bold"
                            : "bg-gray-700 text-gray-400"
                          : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                      Yes
                    </button>
      
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to answer 'No'?")) {
                          submitAnswer(q.id, 1);
                        }
                      }}
                      disabled={!!userAnswers[q.id]}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold text-center transition
                        ${userAnswers[q.id]
                          ? userAnswers[q.id].selectedAnswerIndex === 1
                            ? "bg-red-600 text-white font-bold"
                            : "bg-gray-700 text-gray-400"
                          : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                    >
                      No
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
      
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className="bg-slate-800 p-6 rounded-md max-w-2xl mx-auto mt-24 shadow-lg outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50"
          >
            <CreateQuestionForm
              onSuccess={() => {
                setIsModalOpen(false);
                fetchQuestions();
              }}
            />
          </Modal>
      
          <Modal
            isOpen={showAnswersModal}
            onRequestClose={() => setShowAnswersModal(false)}
            className="bg-slate-800 p-6 rounded-md max-w-3xl mx-auto mt-24 shadow-lg outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">My Answers</h2>
                <p className="text-sm text-green-400 mt-1">
                  Total Coins Earned: {myAnswers.filter((a) => a.isCorrect).length * 10}
                </p>
              </div>
              <button
                onClick={() => setShowAnswersModal(false)}
                className="text-white text-2xl font-bold"
              >
                &times;
              </button>
            </div>
      
            {myAnswers.length === 0 ? (
              <p className="text-gray-300">No answers found.</p>
            ) : (
              <table className="min-w-full text-white text-sm">
                <thead>
                  <tr className="bg-slate-700">
                    <th className="px-3 py-2 text-left">Question</th>
                    <th className="px-3 py-2 text-left">Answer</th>
                    <th className="px-3 py-2 text-left">Correct?</th>
                    <th className="px-3 py-2 text-left">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {myAnswers.map((a, idx) => (
                    <tr key={idx} className="border-t border-slate-600">
                      <td className="px-3 py-2">{a.title || "N/A"}</td>
                      <td className="px-3 py-2">{a.answer === 0 ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">
                        {a.isCorrect ? (
                          <span className="text-green-400 font-bold">Yes</span>
                        ) : (
                          <span className="text-red-400 font-bold">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{a.isCorrect ? 10 : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Modal>
        </div>
      );
      
}

export default QuestionsPage;
