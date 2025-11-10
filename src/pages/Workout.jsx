import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaClock, FaSearch, FaTrashAlt } from "react-icons/fa";
import FooterNav from "../components/FooterNav";
import RecentWorkouts from "../components/RecentWorkouts";

export default function Workout() {
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [duration, setDuration] = useState("");
  const [userId, setUserId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalWorkout, setModalWorkout] = useState(null);
  const [modalDuration, setModalDuration] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    workoutId: null,
  });
  const [timeOfDay, setTimeOfDay] = useState("");
  const [shuffledDisplayWorkouts, setShuffledDisplayWorkouts] = useState([]);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Determine time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay("Morning");
    else if (hour >= 12 && hour < 17) setTimeOfDay("Afternoon");
    else if (hour >= 17 && hour < 21) setTimeOfDay("Evening");
    else setTimeOfDay("Night");
  }, []);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate("/login");
      setUserId(data.user.id);
    };
    getUser();
  }, [navigate]);

  // Fetch health profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("health_profiles")
        .select(
          "goal, gender, age, weight_kg, height_cm, activity_level, health_conditions,full_name"
        )
        .eq("user_id", userId)
        .single();
      if (!error) setProfile(data);
    };
    fetchProfile();
  }, [userId]);

  // Fetch workout types
  useEffect(() => {
    const fetchWorkoutTypes = async () => {
      const { data, error } = await supabase.from("workout_types").select("*");
      if (!error) setWorkoutTypes(data);
    };
    fetchWorkoutTypes();
  }, []);
  // Utility function to shuffle an array
  const shuffleArray = (array) => {
    if (!Array.isArray(array) || array.length === 0) return [];

    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }

    // Return a random selection (e.g., 6 items max)
    return newArr.slice(0, 6);
  };

  // Recommended workouts
  // Recommended workouts
  useEffect(() => {
    if (!workoutTypes.length) return;

    // ✅ If there's no profile or goal, show random shuffled workouts
    if (!profile?.goal) {
      setRecommended(shuffleArray(workoutTypes));
      return;
    }

    const goalLower = profile.goal?.toLowerCase().trim();
    const userHealthConditionsLower = (profile.health_conditions || []).map(
      (hc) => hc.toLowerCase().trim()
    );

    const matched = workoutTypes.filter((w) => {
      const suitableForGoal = w.suitable_for?.some(
        (g) => g.toLowerCase().trim() === goalLower
      );
      const unsafeLower = (w.unsuitable_for || []).map((hc) =>
        hc.toLowerCase().trim()
      );
      const safeForHealth = !unsafeLower.some((hc) =>
        userHealthConditionsLower.includes(hc)
      );
      return suitableForGoal && safeForHealth;
    });

    // ✅ If no matched workouts, still show random ones
    if (matched.length === 0) {
      setRecommended(shuffleArray(workoutTypes));
    } else {
      setRecommended(matched);
    }
  }, [profile, workoutTypes]);

  // Fetch logged workouts
  const fetchWorkouts = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("workouts")
      .select(
        "id,duration,calories_burned,fat_burned,carbs_burned,created_at,workout_types(id,name,unsuitable_for,image_url)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const userHealthConditionsLower = (profile?.health_conditions || []).map(
      (hc) => hc.toLowerCase().trim()
    );

    const safeWorkouts = (data || []).filter((w) => {
      const unsafeLower = (w.workout_types?.unsuitable_for || []).map((hc) =>
        hc.toLowerCase().trim()
      );
      return !unsafeLower.some((hc) => userHealthConditionsLower.includes(hc));
    });

    setWorkouts(safeWorkouts);
  };

  useEffect(() => {
    fetchWorkouts();
  }, [userId, profile]);

  // Filtered workouts for search
  const filteredWorkouts = useMemo(() => {
    if (!searchQuery) return workoutTypes;
    const userHealthConditionsLower = (profile?.health_conditions || []).map(
      (hc) => hc.toLowerCase().trim()
    );
    return workoutTypes.filter((w) => {
      const unsafeLower = (w.unsuitable_for || []).map((hc) =>
        hc.toLowerCase().trim()
      );
      const safe = !unsafeLower.some((hc) =>
        userHealthConditionsLower.includes(hc)
      );
      return safe && w.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [workoutTypes, searchQuery, profile]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add workout
  const handleAddWorkout = async (e) => {
    e?.preventDefault();
    if (!selectedWorkout || !duration)
      return setModal({ show: true, message: "Please fill all fields." });

    const workoutType = workoutTypes.find((w) => w.id === selectedWorkout);
    const userHealthConditionsLower = (profile?.health_conditions || []).map(
      (hc) => hc.toLowerCase().trim()
    );
    const unsafeLower = (workoutType?.unsuitable_for || []).map((hc) =>
      hc.toLowerCase().trim()
    );

    if (unsafeLower.some((hc) => userHealthConditionsLower.includes(hc))) {
      return setModal({
        show: true,
        message:
          "This workout is not recommended for your health condition(s).",
      });
    }

    setLoading(true);
    const { error } = await supabase
      .from("workouts")
      .insert([
        { user_id: userId, workout_type_id: selectedWorkout, duration },
      ]);
    setLoading(false);

    if (error)
      setModal({
        show: true,
        message: "Error saving workout: " + error.message,
      });
    else {
      setModal({ show: true, message: "Workout logged successfully!" });
      setDuration("");
      setSelectedWorkout("");
      setSearchQuery("");
      fetchWorkouts();
    }
  };

  // Delete workout
  const handleDeleteWorkout = async (id) => {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error)
      setModal({
        show: true,
        message: "Error deleting workout: " + error.message,
      });
    else {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      setModal({ show: true, message: "Workout deleted successfully." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex justify-center items-center p-4">
      <div className="bg-white w-[375px] h-[700px] rounded-3xl shadow-2xl overflow-hidden flex flex-col ">
        {/* Header */}

        <div className="bg-black w-full h-[130px] rounded-t-3xl flex flex-col px-2 pt-2 relative">
          <div className="flex justify-between items-start mb-6">
            <div className="p-5 ">
              <p className="text-m font-semibold text-white">
                Hi <span className="text-green-500">{profile?.full_name},</span>{" "}
                Good {timeOfDay}!
              </p>
              <p className="text-s font-medium flex items-center gap-2 text-white">
                Ready to start your workout?
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className=" p-4 flex-1 space-y-2 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col gap-2">
            <img
              src="Stronger Than Yesterday, Weaker Than Tomorrow (2).png" // path from public folder
              alt="Workout"
              className="w-full h-50 object-cover border rounded-xl"
            />
          </div>

          <form
            onSubmit={handleAddWorkout}
            className="space-y-5 relative  p-5 rounded-2xl "
          >
            {/* Search Bar */}
            <div className="relative" ref={dropdownRef}>
              <label className="block mb-1 text-sm font-medium text-black">
                Workout
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search workout..."
                  className="w-full p-2 pl-9 border rounded-lg placeholder-gray-400 "
                />
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute bg-white border rounded-lg shadow-md mt-1 max-h-48 overflow-y-auto w-full z-20">
                  <p className="px-3 pt-2 text-xs text-gray-500">
                    Recommended for {profile?.goal}{" "}
                    {profile?.health_conditions?.join(", ")}
                  </p>
                  {recommended.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      onClick={() => {
                        setModalWorkout(w);
                        setModalDuration("");
                        setShowAddModal(true);
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm flex items-center gap-2"
                    >
                      {w.image_url ? (
                        <img
                          src={w.image_url}
                          alt={w.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                      {w.name}
                    </div>
                  ))}
                  <hr className="my-1" />
                  {filteredWorkouts.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      onClick={() => {
                        setSelectedWorkout(w.id);
                        setSearchQuery(w.name);
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm flex items-center gap-2"
                    >
                      {w.image_url ? (
                        <img
                          src={w.image_url}
                          alt={w.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                      {w.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block mb-1 text-sm font-medium text-black">
                Duration (minutes)
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="w-full p-2 pl-9 border rounded-lg placeholder-gray-400 "
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded-lg  hover:bg-gray-400 transition font-medium"
            >
              {loading ? "Saving..." : "Add Workout"}
            </button>
          </form>
          <div className="space-y-3 relative p-5">
            <p className="text-black text-sm font-medium">
              Recommended Workouts
            </p>
            {recommended.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex flex-wrap gap-2">
                  {recommended.slice(0, 3).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setModalWorkout(w);
                        setModalDuration("");
                        setShowAddModal(true);
                      }}
                      className="px-2 py-1 rounded-xl text-black text-xs font-medium flex items-center gap-1 hover:bg-black hover:text-white transition"
                    >
                      {w.image_url ? (
                        <img
                          src={w.image_url}
                          alt={w.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr />
          <p className="font-bold text-2xl text-center">EXPLORE WORKOUTS</p>
          {recommended.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4 p-5">
              {shuffleArray(recommended)
                .slice(0, 4)
                .map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setModalWorkout(w);
                      setModalDuration("");
                      setShowAddModal(true);
                    }}
                    className="relative border border-green-100 rounded-2xl shadow-sm cursor-pointer hover:bg-green-100 transition overflow-hidden"
                    style={{ height: "160px" }}
                  >
                    {w.image_url ? (
                      <img
                        src={w.image_url}
                        alt={w.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                        N/A
                      </div>
                    )}

                    {/* Apply blur at top of the image using a gradient overlay */}
                    <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/50 to-transparent px-2 flex items-center">
                      <p className="text-white text-sm font-semibold truncate">
                        {w.name}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Recent Workouts */}
          {/* <RecentWorkouts
            workouts={workouts}
            setConfirmDelete={setConfirmDelete}
          /> */}
        </div>
        {/* Footer */}
        <FooterNav />

        {modal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm text-center">
              <p className="mb-4">{modal.message}</p>
              <button
                onClick={() => setModal({ show: false, message: "" })}
                className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Add Duration Modal */}
        {showAddModal && modalWorkout && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddModal(false);
            }}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl w-[320px] max-w-[90%] overflow-hidden animate-fadeIn">
              {/* Header with image */}
              <div className="relative">
                {modalWorkout.image_url ? (
                  <img
                    src={modalWorkout.image_url}
                    alt={modalWorkout.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center text-gray-500 text-sm">
                    No Image
                  </div>
                )}

                {/* Overlay Gradient with Title and X button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-start justify-between px-4 py-2">
                  <h2 className="text-base font-semibold text-white mt-auto mb-1">
                    {modalWorkout.name}
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-red-700 font-semibold bg-black/30 hover:bg-black/50 rounded-full w-7 h-7 flex items-center justify-center text-sm transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 text-center">
                <p className="text-black mb-3 text-sm">
                  Enter workout duration
                </p>

                <div className="relative mb-4">
                  <input
                    type="number"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                    min="1"
                    placeholder="30"
                    className="w-full p-2.5 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center text-gray-800 text-sm"
                  />
                  <span className="absolute right-10 top-2.5 text-gray-400 text-xs">
                    min
                  </span>
                </div>

                {/* Add Button */}
                <button
                  onClick={async () => {
                    if (!modalDuration)
                      return setModal({
                        show: true,
                        message: "Please enter duration",
                      });
                    setLoading(true);
                    const { error } = await supabase.from("workouts").insert([
                      {
                        user_id: userId,
                        workout_type_id: modalWorkout.id,
                        duration: modalDuration,
                      },
                    ]);
                    setLoading(false);
                    if (error)
                      setModal({
                        show: true,
                        message: "Error adding workout.",
                      });
                    else {
                      setModal({
                        show: true,
                        message: "Workout added successfully!",
                      });
                      fetchWorkouts();
                    }
                    setShowAddModal(false);
                  }}
                  className="w-full py-2 rounded-xl bg-black text-white hover:bg-gray-700 active:scale-95 transition text-sm font-semibold shadow-sm"
                >
                  {loading ? "Adding..." : "Add Workout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
