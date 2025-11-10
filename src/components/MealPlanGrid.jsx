import React, { useState } from "react";

export default function MealPlanGrid({ weeklyPlan, mealTypes, onOpenDish }) {
  const [filterDays, setFilterDays] = useState("3"); // "3", "7", or "full"
  const [mealStatusFilter, setMealStatusFilter] = useState("all"); // "all", "missed", "added"

  if (!weeklyPlan?.plan || weeklyPlan.plan.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No meal plan generated yet.
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Filter days first (3, 7, full)
  const filteredPlan = weeklyPlan.plan.filter((_, index) => {
    if (filterDays === "3") return index < 3;
    if (filterDays === "7") return index < 7;
    return true;
  });

  // Compute macros from ingredients
  const computeMacros = (meal) => {
    const ingredients = meal.ingredients_dish_id_fkey || [];
    return {
      calories: Math.round(
        ingredients.reduce((sum, i) => sum + (i.calories || 0), 0)
      ),
      protein: Math.round(
        ingredients.reduce((sum, i) => sum + (i.protein || 0), 0)
      ),
      carbs: Math.round(
        ingredients.reduce((sum, i) => sum + (i.carbs || 0), 0)
      ),
      fats: Math.round(ingredients.reduce((sum, i) => sum + (i.fats || 0), 0)),
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Day Filter Buttons */}
      <div className="flex items-center gap-2 mb-2">
        {/* Day Filter Dropdown */}
        <select
          value={filterDays}
          onChange={(e) => setFilterDays(e.target.value)}
          className="px-3 py-1  text-sm font-medium bg-white text-gray-700 border border-black border-full rounded-lg "
        >
          <option value="3">3 Days</option>
          <option value="7">7 Days</option>
          <option value="full">Full</option>
        </select>

        {/* Status Filter Dropdown */}
        <select
          value={mealStatusFilter}
          onChange={(e) => setMealStatusFilter(e.target.value)}
          className="px-4 py-1  text-sm font-medium bg-white text-gray-700 border border-black border-full rounded-lg "
        >
          <option value="all">All</option>
          <option value="missed">Missed</option>
          <option value="added">Added</option>
        </select>
      </div>
      <hr className="border-2 border-lime-500 " />

      {filteredPlan.map((day, dayIndex) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dateLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Filter meals based on status filter
        const filteredMeals = day.meals.filter((meal) => {
          if (mealStatusFilter === "all") return true;
          return meal.status === mealStatusFilter;
        });

        if (filteredMeals.length === 0) return null;

        return (
          <div
            hr
            key={dayIndex}
            className="bg-black rounded-2xl shadow-lg border text-white p-4"
          >
            {/* Day Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold black">
                {dayName} - {dateLabel}
              </h3>
              <p className="text-xs text-gray-400">Day {dayIndex + 1}</p>
            </div>

            {/* Meals List */}
            <div className="flex flex-col gap-2">
              {filteredMeals.map((meal) => {
                const { calories, protein, carbs, fats } = computeMacros(meal);

                return (
                  <div
                    key={meal.id}
                    onClick={() => meal.status !== "added" && onOpenDish(meal)}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition 
                      ${
                        meal.status === "added"
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                          : meal.status === "missed"
                          ? "bg-red-50 border-red-200 cursor-pointer opacity-70 hover:bg-red-100"
                          : "bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                      }`}
                  >
                    {/* Dish Image or Placeholder */}
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0"></div>
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-medium  text-lime-500">
                        {meal.name}
                      </p>
                      <p className="text-xs text-gray-500">{meal.type}</p>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span>🔥 {calories} kcal</span>
                        <span>💪 {protein} g</span>
                        <span>🍞 {carbs} g</span>
                        <span>🧈 {fats} g</span>
                      </div>
                    </div>

                    {meal.status === "added" && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                        Added
                      </span>
                    )}
                    {meal.status === "missed" && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Missed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
