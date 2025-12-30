import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { Smile, Frown, Meh, Coffee, Utensils, Heart, Loader, Angry } from "lucide-react";
import { motion } from "framer-motion";

export default function History() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [moodFoodData, setMoodFoodData] = useState({});
  const [editing, setEditing] = useState(false);
  const [moodFoodId, setMoodFoodId] = useState(null);

  const API_BASE = "/api/v1/moodfood";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(API_BASE, { withCredentials: true });
        if (response.data) {
          setHistory(response.data);
          setMoodFoodId(response.data._id);
          setIsNewUser(false);
        }
      } catch (err) {
        if (err.response?.status === 400) {
          setIsNewUser(true);
        } else {
          setError(err.response?.data?.message || "Failed to fetch history.");
          toast.error(err.response?.data?.message || "Failed to fetch history.");
        }
      }
    };

    fetchHistory();
  }, []);

  const handleInputChange = (mood, value) => {
    setMoodFoodData((prev) => ({
      ...prev,
      [mood]: value.split(",").map((item) => item.trim()),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isNewUser) {
        response = await axios.post(`${API_BASE}/create`, moodFoodData, { withCredentials: true });
        setIsNewUser(false);
        toast.success("Mood-Food preferences saved!");
      } else {
        if (!moodFoodId) {
          toast.error("MoodFood ID is missing. Try refreshing.");
          return;
        }
        response = await axios.patch(`${API_BASE}/${moodFoodId}`, moodFoodData, { withCredentials: true });
        setEditing(false);
        toast.success("Mood-Food updated successfully!");
      }
      setHistory(response.data.data);
      setMoodFoodData({});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
      toast.error(err.response?.data?.message || "Failed to update.");
    }
  };

  const moodIcons = {
    happy: <Smile className="text-yellow-500" size={26} />, 
    sad: <Frown className="text-blue-500" size={26} />, 
    bored: <Meh className="text-gray-500" size={26} />, 
    stressed: <Coffee className="text-red-500" size={26} />, 
    lonely: <Heart className="text-pink-500" size={26} />, 
    tired: <Utensils className="text-green-500" size={26} />, 
    frustrated: <Angry className="text-orange-500" size={26} />,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-center" reverseOrder={false} />
      <h2 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        🍽️ Mood-Based Food Preferences
      </h2>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {isNewUser || editing ? (
        <motion.form
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 border border-gray-300 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-200">
            {isNewUser ? "📝 Enter Your Mood-Food Preferences" : "✏️ Edit Your Preferences"}
          </h3>
          {Object.keys(moodIcons).map((mood) => (
            <motion.div
              key={mood}
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 border p-3 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 transition"
            >
              <span>{moodIcons[mood]}</span>
              <label className="font-medium w-32 text-gray-800 dark:text-gray-300">
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </label>
              <input
                type="text"
                placeholder="Enter foods (comma separated)"
                className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                defaultValue={Array.isArray(history?.[mood]) ? history[mood].join(", ") : ""}
                onChange={(e) => handleInputChange(mood, e.target.value)}
              />
            </motion.div>
          ))}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg shadow-md hover:opacity-90 transition"
          >
            {isNewUser ? "Save Preferences" : "Update Preferences"}
          </button>
        </motion.form>
      ) : history ? (
        <div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(history).map(
              (mood) =>
                Array.isArray(history[mood]) && (
                  <motion.div
                    key={mood}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-5 rounded-lg shadow-md bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      {moodIcons[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 mt-2">
                      {history[mood].map((food, index) => (
                        <li key={index} className="py-1 text-md">{food}</li>
                      ))}
                    </ul>
                  </motion.div>
                )
            )}
          </div>
          <button onClick={() => setEditing(true)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition">Edit Preferences</button>
        </div>
      ) : (
        <div className="flex justify-center items-center mt-6">
          <Loader className="animate-spin text-gray-400" size={32} />
        </div>
      )}
    </div>
  );
}