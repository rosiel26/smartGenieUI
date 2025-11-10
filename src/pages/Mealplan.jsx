import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import {
  getBoholCities,
  recommendStoresForIngredients,
} from "../services/storeService";
import MealPlanGrid from "../components/MealPlanGrid";
import DishDetailModal from "../components/DishDetailModal";
import AlertModal from "../components/AlertModal";
import NoProfile from "../components/NoProfile";
import MealPlanLoader from "../components/MealPlanLoader";
import {
  createSmartWeeklyMealPlan,
  markAddedMeals,
  prepareDishForModal,
  computeDishTotalsWithIngredientOverrides,
  formatDateRange,
} from "../utils/mealplan";

export default function Mealplan({ userId }) {
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [mealLog, setMealLog] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState("tagbilaran");
  const [storeTypeFilters, setStoreTypeFilters] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [boholCities, setBoholCities] = useState([]);
  const [storeRecommendations, setStoreRecommendations] = useState([]);

  const navigate = useNavigate();

  // -------------------- FETCH DATA --------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      // Fetch profile, dishes, and meal logs in parallel
      const [profileResult, dishesResult, mealResult] = await Promise.all([
        supabase
          .from("health_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase.from("dishes").select(`
        id, name, description, default_serving, meal_type, goal,
        eating_style, health_condition, steps, image_url,
        ingredients_dish_id_fkey(id, name, amount, unit, calories, protein, fats, carbs, is_rice)
      `),
        supabase.from("meal_logs").select("*").eq("user_id", user.id),
      ]);

      const profileData = profileResult.data;
      const dishesData = dishesResult.data || [];
      const mealData = mealResult.data || [];

      if (!profileData) {
        setAlertMessage("Please complete your health profile first");
        setShowAlertModal(true);
        navigate("/healthprofile");
        return;
      }

      setProfile(profileData);
      setDishes(dishesData);
      setMealLog(mealData);

      let plan = null;
      let shouldRegeneratePlan = false;

      // 1️⃣ Try loading plan from database first
      if (profileData.plan_start_date && profileData.plan_end_date) {
        const savedPlanRaw = localStorage.getItem(`weeklyPlan_${user.id}`);
        if (savedPlanRaw) {
          plan = JSON.parse(savedPlanRaw);

          // Check if the existing plan is outdated or timeframe has changed
          console.log("Debug: profileData before date parsing:", profileData);
          console.log(
            "Debug: profileData.plan_start_date:",
            profileData.plan_start_date
          );
          console.log(
            "Debug: profileData.plan_end_date:",
            profileData.plan_end_date
          );
          const planStartDate = new Date(profileData.plan_start_date);
          const planEndDate = new Date(profileData.plan_end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const planDuration =
            (planEndDate.getTime() - planStartDate.getTime()) /
              (1000 * 60 * 60 * 24) +
            1;

          if (planEndDate < today || planDuration !== profileData.timeframe) {
            console.log(
              "Existing plan is outdated or timeframe changed. Regenerating plan."
            );
            shouldRegeneratePlan = true;
            plan = null; // Invalidate the old plan
          }
        } else {
          // If no plan in localStorage, but dates in DB, assume plan needs to be fetched or regenerated
          // For now, let's assume if not in localStorage, it needs regeneration to simplify
          shouldRegeneratePlan = true;
        }
      } else {
        // No plan dates in DB, definitely regenerate
        shouldRegeneratePlan = true;
      }

      // 2️⃣ Only generate a new plan if no plan exists or if regeneration is forced
      if (!plan || shouldRegeneratePlan) {
        plan = createSmartWeeklyMealPlan(profileData, dishesData);

        // Save to localStorage
        localStorage.setItem(`weeklyPlan_${user.id}`, JSON.stringify(plan));

        // Save start/end date in DB
        console.log("Attempting to update health_profiles with:");
        console.log("plan_start_date:", plan.start_date);
        console.log("plan_end_date:", plan.end_date);
        console.log("user_id:", user.id);
        await supabase
          .from("health_profiles")
          .update({
            plan_start_date: plan.start_date,
            plan_end_date: plan.end_date,
          })
          .eq("user_id", user.id);

        // Optional: save plan JSON to DB too
        await supabase
          .from("health_profiles")
          .update({ weekly_plan_json: plan })
          .eq("user_id", user.id);
      }

      // -------- Mark added meals --------
      const updatedPlan = markAddedMeals(plan, mealData);
      setWeeklyPlan(updatedPlan);

      // Persist updated plan
      localStorage.setItem(
        `weeklyPlan_${user.id}`,
        JSON.stringify(updatedPlan)
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlertMessage("An error occurred while loading your meal plan");
      setShowAlertModal(true);
      setWeeklyPlan({ plan: [], start_date: null, end_date: null });
      setDishes([]);
      setProfile({});
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay("Morning");
    else if (hour >= 12 && hour < 17) setTimeOfDay("Afternoon");
    else if (hour >= 17 && hour < 21) setTimeOfDay("Evening");
    else setTimeOfDay("Night");
  }, []);

  useEffect(() => {
    (async () => {
      const cities = await getBoholCities();
      setBoholCities(cities || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedDish) {
        setStoreRecommendations([]);
        return;
      }
      const ings = selectedDish.ingredients_dish_id_fkey || [];
      const recs = await recommendStoresForIngredients(ings, selectedCityId, {
        onlyTypes: storeTypeFilters,
      });
      setStoreRecommendations(recs || []);
    })();
  }, [selectedDish, selectedCityId, storeTypeFilters]);

  // -------------------- HANDLERS --------------------
  const handleOpenDish = (dish) => {
    const full = dishes.find((d) => d.id === dish.id) || dish;
    const prepared = prepareDishForModal(full);
    if (dish && dish.type) prepared.planMealType = dish.type;
    else if (dish && dish.meal_type) prepared.planMealType = dish.meal_type;
    if (dish && dish.status) prepared.status = dish.status; // Pass the status
    setSelectedDish(prepared);
  };

  const handleServingSizeChange = (newSize) => {
    setSelectedDish((prev) => {
      if (!prev) return prev;
      const newDish = { ...prev, servingSize: newSize };
      const adjusted = computeDishTotalsWithIngredientOverrides(newDish);
      return { ...newDish, ...adjusted };
    });
  };

  const handleIngredientAmountChange = (ingredientId, newAmountRaw) => {
    const newAmount = Number(newAmountRaw) || 0;
    setSelectedDish((prev) => {
      if (!prev) return prev;
      const ingredients = (prev.ingredients_dish_id_fkey || []).map((ing) =>
        ing.id !== ingredientId
          ? ing
          : { ...ing, amount: newAmount, customAmount: true }
      );
      const updatedDish = { ...prev, ingredients_dish_id_fkey: ingredients };
      const adjusted = computeDishTotalsWithIngredientOverrides(updatedDish);
      return { ...updatedDish, ...adjusted };
    });
  };

  const handleAddMeal = async (
    meal,
    mealType,
    adjustedTotals,
    servingSize,
    mealDate = null
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAlertMessage("Please log in to add meals");
        setShowAlertModal(true);
        return;
      }

      const today = mealDate || new Date().toISOString().split("T")[0];

      const riceIngredient = (meal.ingredients_dish_id_fkey || []).find(
        (ing) => ing.is_rice
      );
      const hasRice = riceIngredient && riceIngredient.amount > 0;
      const dishName = hasRice
        ? `${meal.name || "Unknown Dish"} with rice`
        : meal.name || "Unknown Dish";

      const mealLogData = {
        user_id: user.id,
        dish_id: parseInt(meal.id),
        dish_name: dishName,
        meal_date: today,
        calories: adjustedTotals.calories,
        protein: adjustedTotals.protein,
        carbs: adjustedTotals.carbs,
        fat: adjustedTotals.fats,
        meal_type: mealType || "unknown",
        serving_label: `${servingSize} g`,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("meal_logs").insert([mealLogData]);
      if (error) throw error;

      // Update meal log state
      setMealLog((prev) => [...(prev || []), mealLogData]);

      // ✅ Update weeklyPlan state to mark this meal as "added"
      setWeeklyPlan((prev) => {
        const newPlan = {
          ...prev,
          plan: prev.plan.map((day) => {
            const dayCopy = { ...day };
            if (dayCopy.date === today) {
              dayCopy.meals = dayCopy.meals.map((m) =>
                Number(m.id) === Number(meal.id) &&
                m.type === (meal.planMealType || meal.type)
                  ? { ...m, status: "added" }
                  : m
              );
            }
            return dayCopy;
          }),
        };

        // Update localStorage too
        localStorage.setItem(`weeklyPlan_${user.id}`, JSON.stringify(newPlan));
        return newPlan;
      });

      setSelectedDish(null);
      setAlertMessage(
        mealDate && mealDate !== new Date().toISOString().split("T")[0]
          ? "Meal added retroactively!"
          : "Meal added successfully!"
      );
      setShowAlertModal(true);
    } catch (error) {
      console.error("Error adding meal:", error);
      setAlertMessage("Failed to add meal. Please try again.");
      setShowAlertModal(true);
    }
  };

  const memoizedWeeklyPlan = useMemo(() => {
    if (!weeklyPlan?.plan || !Array.isArray(weeklyPlan.plan))
      return { plan: [], start_date: null, end_date: null };
    return weeklyPlan;
  }, [weeklyPlan]);

  const mealTypes = useMemo(
    () => ["Breakfast", "Lunch", "Dinner", "Snack"],
    []
  );
  const dateRange = useMemo(
    () =>
      formatDateRange(
        memoizedWeeklyPlan.start_date,
        memoizedWeeklyPlan.end_date
      ),
    [memoizedWeeklyPlan.start_date, memoizedWeeklyPlan.end_date]
  );

  // -------------------- CONDITIONAL RENDER --------------------
  if (loading) return <MealPlanLoader timeframe={profile?.timeframe} />;
  if (!profile) return <NoProfile onNavigate={navigate} />;

  // -------------------- MAIN RENDER --------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex justify-center items-center p-4">
      <div className="bg-white w-[375px] h-[700px] rounded-3xl shadow-2xl overflow-hidden flex flex-col ">
        {/* Header */}

        <div className="bg-white w-full h-[130px] rounded-t-3xl flex flex-col px-2 pt-2 relative border-b-4  border-black">
          <div className="flex justify-between items-start mb-6">
            <div className="p-5 ">
              <p className="text-m font-semibold text-black">
                Good {timeOfDay}{" "}
                <span className="text-black font-bold">
                  {" "}
                  {profile?.full_name}!
                </span>
              </p>
              <p className="text-s font-medium flex items-center gap-2 text-black">
                Here's your meal plan for today
              </p>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className=" p-4 flex-1 space-y-2 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {dateRange && (
            <p className="text-sm font-medium mb-2 ">
              {dateRange.start} – {dateRange.end} ({profile.timeframe || 7}{" "}
              Days)
            </p>
          )}

          <MealPlanGrid
            weeklyPlan={memoizedWeeklyPlan}
            mealTypes={mealTypes}
            onOpenDish={handleOpenDish}
          />

          {showAlertModal && (
            <AlertModal
              message={alertMessage}
              onClose={() => setShowAlertModal(false)}
            />
          )}

          {selectedDish && (
            <DishDetailModal
              dish={selectedDish}
              onClose={() => setSelectedDish(null)}
              onServingSizeChange={handleServingSizeChange}
              onIngredientAmountChange={handleIngredientAmountChange}
              onAddMeal={handleAddMeal}
              boholCities={boholCities}
              selectedCityId={selectedCityId}
              onCityChange={setSelectedCityId}
              storeTypeFilters={storeTypeFilters}
              onStoreTypeFilterChange={(type) =>
                setStoreTypeFilters((prev) =>
                  prev.includes(type)
                    ? prev.filter((x) => x !== type)
                    : [...prev, type]
                )
              }
              storeRecommendations={storeRecommendations}
            />
          )}
        </div>
        {/* FOOTER */}
        <FooterNav />
      </div>
    </div>
  );
}
