import { useState, useEffect } from 'react';
import { Plus, Vote, Users, LogIn, LogOut, User } from 'lucide-react';
import { voting_app_backend } from 'declarations/voting-app-backend';
import { useAuth } from './AuthContext';

function App() {
  const { isAuthenticated, principal, login, logout, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState([]);
  const [pollsCount, setPollsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // New poll form
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  
  // Load polls count on start
  useEffect(() => {
    loadPollsCount();
  }, []);

  const loadPollsCount = async () => {
    try {
      const count = await voting_app_backend.Get_Polls_count();
      setPollsCount(Number(count));
      loadAllPolls(Number(count));
    } catch (error) {
      console.error('Error loading polls count:', error);
    }
  };

  const loadAllPolls = async (count) => {
    const pollsData = [];
    for (let i = 0; i < count; i++) {
      try {
        const poll = await voting_app_backend.Get_Poll(i);
        if (poll && poll[0]) {
          pollsData.push({ id: i, ...poll[0] });
        }
      } catch (error) {
        console.error(`Error loading poll ${i}:`, error);
      }
    }
    setPolls(pollsData);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to create polls');
      return;
    }
    
    if (!newPollTitle.trim() || newPollOptions.filter(opt => opt.trim()).length < 2) {
      alert('Please enter poll title and at least two options');
      return;
    }

    setLoading(true);
    try {
      const filteredOptions = newPollOptions.filter(opt => opt.trim());
      await voting_app_backend.Make_Poll(newPollTitle, filteredOptions);
      
      // Reset form
      setNewPollTitle('');
      setNewPollOptions(['', '']);
      
      // Reload polls
      loadPollsCount();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, option) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }
    
    setLoading(true);
    try {
      await voting_app_backend.vote(pollId, option);
      // Reload polls to show updated results
      loadPollsCount();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error voting');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const removeOption = (index) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Authentication */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              <Vote className="inline mr-2" size={32} />
              Voting System
            </h1>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <User className="inline mr-1" size={16} />
                    {principal ? principal.substring(0, 8) + '...' + principal.substring(principal.length - 4) : 'Loading...'}
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <LogIn size={16} />
                  Login with Internet Identity
                </button>
              )}
            </div>
          </div>
          
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You need to login with Internet Identity to create polls and vote.
              </p>
            </div>
          )}
        </div>

        {/* Create New Poll Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            <Plus className="inline mr-2" size={20} />
            Create New Poll
          </h2>
          
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please login to create polls</p>
              <button
                onClick={login}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mx-auto"
              >
                <LogIn size={16} />
                Login with Internet Identity
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Title
                </label>
                <input
                  type="text"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter poll title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {newPollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newPollOptions];
                        newOptions[index] = e.target.value;
                        setNewPollOptions(newOptions);
                      }}
                      className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Add Option
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Poll'}
              </button>
            </form>
          )}
        </div>

        {/* Polls List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">
            <Users className="inline mr-2" size={20} />
            Available Polls ({pollsCount})
          </h2>

          {polls.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No polls available yet</p>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  {poll.title}
                </h3>
                
                <div className="space-y-3">
                  {poll.options.map(([option, votes]) => (
                    <div key={option} className="flex items-center justify-between">
                      <button
                        onClick={() => handleVote(poll.id, option)}
                        disabled={loading || !isAuthenticated}
                        className="flex-1 text-left p-3 border rounded-md hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="font-medium">{option}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({Number(votes)} votes)
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Total Votes: {poll.options.reduce((total, [, votes]) => total + Number(votes), 0)}
                </div>
                
                {!isAuthenticated && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Login to vote on this poll</p>
                    <button
                      onClick={login}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mx-auto"
                    >
                      <LogIn size={16} />
                      Login
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
