import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import { FaSpinner, FaLocationArrow, FaClock, FaUser } from "react-icons/fa";

const moodEmojis = [
  { emoji: "😊", label: "Happy", color: "from-yellow-400 to-yellow-500" },
  { emoji: "😐", label: "Bored", color: "from-gray-400 to-gray-500" },
  { emoji: "😫", label: "Stressed", color: "from-red-400 to-red-500" },
  { emoji: "😢", label: "Sad", color: "from-blue-400 to-blue-500" },
  { emoji: "🥺", label: "Lonely", color: "from-purple-400 to-purple-500" },
  { emoji: "😴", label: "Tired", color: "from-indigo-400 to-indigo-500" },
  { emoji: "😤", label: "Frustrated", color: "from-orange-400 to-orange-500" },
  { emoji: "🙂", label: "Normal", color: "from-green-400 to-green-500" }
];


export function Dashboard() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [userLocation, setUserLocation] = useState({ lat: null, long: null });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const BACKEND_URL = "/api/v1";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/auth/me`, {
          withCredentials: true,
        });
        setUser(response.data.user);
      } catch (error) {
        toast.error("You need to log in first.");
        navigate("/auth");
      }
    };

    fetchUser();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, long: position.coords.longitude });
      },
      (error) => {
        toast.error("Location permission denied. Please enable it.");
      }
    );
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) return toast.error("Please select a mood before submitting.");
    if (userLocation.lat === null || userLocation.long === null) return toast.error("Location is required.");
    if (!user) return toast.error("User is not authenticated.");

    try {
      setLoading(true);
      const payload = { mood: selectedMood.label, prompt, latitude: userLocation.lat, longitude: userLocation.long };
      const response = await axios.post(`${BACKEND_URL}/food/recommend`, payload, { withCredentials: true });
      toast.success("Recommendations received!");
      navigate("/recommendations", { state: { recommendations: response.data } });
    } catch (error) {
      toast.error("Failed to get recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-center" reverseOrder={false} />
      
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            How are you feeling today?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Let's find the perfect meal to match your mood! 🍽️
          </p>
        </div>

        {/* Mood Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {moodEmojis.map((mood, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm
                ${selectedMood === mood 
                  ? `bg-gradient-to-br ${mood.color} text-white ring-4 ring-red-500/50` 
                  : 'bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700'}
                transition-all duration-300 p-6 flex flex-col items-center
              `}
              onClick={() => setSelectedMood(mood)}
              disabled={loading}
            >
              <span className="text-4xl mb-2">{mood.emoji}</span>
              <span className="text-sm font-medium">{mood.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Input Form */}
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell us more about your mood... (e.g., 'I just finished a workout' or 'I had a stressful day')"
              className="w-full p-4 h-32 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                       bg-white/90 dark:bg-gray-700/90
                       text-gray-900 dark:text-white placeholder-gray-500
                       focus:border-red-500 focus:ring-2 focus:ring-red-500/50
                       transition-all duration-300 resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <FaLocationArrow className="text-red-500" />
              <span>{userLocation.lat ? "Location enabled" : "Enable location"}</span>
            </div>
            {selectedMood && (
              <span>Selected mood: {selectedMood.emoji} {selectedMood.label}</span>
            )}
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full py-4 px-6 rounded-xl font-medium text-lg
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'}
              text-white shadow-lg hover:shadow-xl
              transform transition-all duration-300
              flex items-center justify-center space-x-2
            `}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Finding perfect meals...</span>
              </>
            ) : (
              <>
                <span>Get Food Recommendations</span>
                <span>🍳</span>
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}