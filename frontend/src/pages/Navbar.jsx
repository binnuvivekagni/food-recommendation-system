import React, { useState, useEffect, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ModeToggle } from "./mood-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm } from "react-icons/wi";
import { FaUserCircle, FaEdit } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { UpdateProfile } from "./updateProfile";

// Memoize the EditProfileModal component
const EditProfileModal = memo(({ showEditModal, user, setUser, setShowEditModal }) => {
  if (!showEditModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <UpdateProfile
        user={user}
        setUser={setUser}
        setShowEditModal={setShowEditModal}
      />
    </div>
  );
});

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [weather, setWeather] = useState(null);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const updateAuthState = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("authChange", updateAuthState);
    return () => window.removeEventListener("authChange", updateAuthState);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await axios.get(
            `/api/v1/weather?lat=${latitude}&lon=${longitude}`
          );
          setWeather(response.data);
        });
      } catch (error) {
        console.error("Error fetching weather", error);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/v1/user/showMe", {
          withCredentials: true,
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user info", error);
      }
    };
    if (isLoggedIn) fetchUser();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await axios.get("/api/v1/auth/logout", {
        withCredentials: true,
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/auth");
      setTimeout(() => {
        window.history.pushState(null, null, "/auth");
        window.history.replaceState(null, null, "/auth");
      }, 50);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain) {
      case "Clear":
        return <WiDaySunny className="text-yellow-500 text-2xl" />;
      case "Clouds":
        return <WiCloud className="text-gray-400 text-2xl" />;
      case "Rain":
        return <WiRain className="text-blue-500 text-2xl" />;
      case "Snow":
        return <WiSnow className="text-blue-300 text-2xl" />;
      case "Thunderstorm":
        return <WiThunderstorm className="text-purple-600 text-2xl" />;
      default:
        return <WiCloud className="text-gray-400 text-2xl" />;
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 dark:from-orange-600 dark:to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl filter drop-shadow-md">🍽️</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                Mood Food
              </span>
            </motion.button>

            <div className="flex items-center gap-4">
              {weather && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  {getWeatherIcon(weather.weather[0].main)}
                  <span className="text-gray-900 dark:text-gray-300 font-medium">
                    {Math.round(weather.main.temp)}°C
                  </span>
                </motion.div>
              )}

              <Link to="/history">
                <Button
                  variant="ghost"
                  className="font-medium hover:bg-orange-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  📜 History
                </Button>
              </Link>

              <ModeToggle />

              {isLoggedIn && user && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 dark:from-gray-800 dark:to-gray-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all text-white dark:text-gray-200"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <FaUserCircle className="text-xl" />
                    <span className="font-medium">{user.name}</span>
                  </motion.button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200">
                              <span className="text-lg">👤</span>
                              <span className="font-medium">{user.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowEditModal(true);
                                setShowDropdown(false);
                              }}
                              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <FaEdit size={18} />
                            </button>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>📧 {user.email}</p>
                            <p>📅 Age: {user.age || 'Not set'}</p>
                            <p>⚖️ BMI: {user.bmi || 'Not calculated'}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!isLoggedIn && (
                <Link to="/auth">
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:shadow-lg transition-all"
                  >
                    🔑 Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <EditProfileModal 
        showEditModal={showEditModal}
        user={user}
        setUser={setUser}
        setShowEditModal={setShowEditModal}
      />
    </>
  );
}