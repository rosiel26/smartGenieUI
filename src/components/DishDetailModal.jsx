import React from "react";

const DishDetailModal = ({
  dish,
  onClose,
  onServingSizeChange,
  onIngredientAmountChange,
  onAddMeal,
  boholCities,
  selectedCityId,
  onCityChange,
  storeTypeFilters,
  onStoreTypeFilterChange,
  storeRecommendations,
}) => {
  // --- Compute total nutrition dynamically from ingredients ---
  const computeDishTotals = (currentDish) => {
    const ingredients = currentDish.ingredients_dish_id_fkey || [];
    return ingredients.reduce(
      (totals, ing) => ({
        calories: totals.calories + (ing.calories || 0),
        protein: totals.protein + (ing.protein || 0),
        carbs: totals.carbs + (ing.carbs || 0),
        fats: totals.fats + (ing.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const baseTotals = computeDishTotals(dish);
  const currentServingSize = dish.servingSize || dish.default_serving || 100;
  const defaultServing = dish.default_serving || 100;
  const multiplier = currentServingSize / defaultServing;

  const adjustedTotals = {
    calories: Math.round(baseTotals.calories * multiplier),
    protein: Math.round(baseTotals.protein * multiplier),
    carbs: Math.round(baseTotals.carbs * multiplier),
    fats: Math.round(baseTotals.fats * multiplier),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-3xl p-4 sm:p-6 shadow-2xl border border-green-100 overflow-auto max-h-[90vh] relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-900 text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Dish Title */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4">{dish.name}</h2>

        {/* Dish Info */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-4">
          <div className="flex-1 space-y-1">
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Meal Type:</span> {dish.meal_type}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Goal:</span> {dish.goal}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Dietary Style:</span>{" "}
              {dish.eating_style}
            </p>
          </div>
          {dish.description && (
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                Description
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {dish.description}
              </p>
            </div>
          )}
        </div>

        {/* Ingredients & Nutrition */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-0">
              Ingredients & Nutrition
            </h3>
            <label className="flex items-center text-sm text-gray-600 gap-1">
              Serving size:
              <input
                type="number"
                value={currentServingSize}
                min="1"
                className="w-16 px-2 py-1 border rounded text-sm"
                onChange={(e) =>
                  onServingSizeChange(parseInt(e.target.value) || 100)
                }
              />
              g
            </label>
          </div>

          {/* Nutritional Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 bg-emerald-50 p-2 sm:p-3 rounded-lg">
            {[
              {
                label: "Calories",
                value: adjustedTotals.calories,
                unit: "kcal",
              },
              { label: "Protein", value: adjustedTotals.protein, unit: "g" },
              { label: "Carbohydrates", value: adjustedTotals.carbs, unit: "g" },
              { label: "Fats", value: adjustedTotals.fats, unit: "g" },
            ].map((n, i) => (
              <div
                key={i}
                className="bg-white p-2 sm:p-3 rounded-lg shadow text-center"
              >
                <div className="text-xs sm:text-sm text-gray-600">{n.label}</div>
                <div className="text-sm sm:text-lg font-semibold text-emerald-700">
                  {Math.round(n.value)} {n.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Ingredient Table */}
          <div className="overflow-x-auto bg-gray-50 rounded-lg">
            <table className="min-w-[600px] w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 sm:p-3">Ingredient</th>
                  <th className="text-right p-2 sm:p-3">Amount</th>
                  <th className="text-right p-2 sm:p-3">Calories</th>
                  <th className="text-right p-2 sm:p-3">Protein</th>
                  <th className="text-right p-2 sm:p-3">Carbs</th>
                  <th className="text-right p-2 sm:p-3">Fats</th>
                  <th className="text-left p-2 sm:p-3">Allergens</th>
                </tr>
              </thead>
              <tbody>
                {(dish.ingredients_dish_id_fkey || []).map((ingredient) => (
                  <tr key={ingredient.id} className="border-t border-gray-200">
                    <td className="p-2 sm:p-3">{ingredient.name}</td>
                    <td className="text-right p-2 sm:p-3">
                      {ingredient.is_rice ? (
                        <input
                          type="number"
                          step="0.1"
                          className="w-16 sm:w-20 text-right px-1 py-0.5 border rounded"
                          value={ingredient.amount}
                          onChange={(e) =>
                            onIngredientAmountChange(
                              ingredient.id,
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <span>
                          {ingredient.amount} {ingredient.unit || "g"}
                        </span>
                      )}
                    </td>
                    <td className="text-right p-2 sm:p-3">
                      {Math.round(ingredient.calories || 0)}
                    </td>
                    <td className="text-right p-2 sm:p-3">
                      {Math.round(ingredient.protein || 0)}g
                    </td>
                    <td className="text-right p-2 sm:p-3">
                      {Math.round(ingredient.carbs || 0)}g
                    </td>
                    <td className="text-right p-2 sm:p-3">
                      {Math.round(ingredient.fats || 0)}g
                    </td>
                    <td className="p-2 sm:p-3 text-red-600">
                      {Array.isArray(ingredient.allergen_id)
                        ? ingredient.allergen_id.map((a) => a.name).join(", ")
                        : ingredient.allergen_id?.name || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Where to Buy */}
        <div className="mb-4 bg-white rounded-xl border border-green-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-green-700">
              Where to buy (Bohol)
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                City/Municipality
                <select
                  className="ml-1 border rounded px-2 py-1 text-sm"
                  value={selectedCityId}
                  onChange={(e) => onCityChange(e.target.value)}
                >
                  {boholCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {[
                { id: "supermarket", label: "Supermarket" },
                { id: "public_market", label: "Public Market" },
              ].map((t) => {
                const active = storeTypeFilters.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => onStoreTypeFilterChange(t.id)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-sm border ${
                      active
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-green-200"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {storeRecommendations.map((rec) => (
              <div
                key={rec.ingredient.id || rec.ingredient.name}
                className="border rounded-lg p-2 sm:p-3 border-green-100"
              >
                <div className="text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                  {rec.ingredient.name}
                </div>
                {rec.stores.length ? (
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {rec.stores.map((s) => (
                      <li key={s.id}>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-1 sm:ml-2 text-xs text-gray-500">
                          {s.type === "public_market"
                            ? "Public Market"
                            : "Supermarket"}
                        </span>
                        {s.address && (
                          <span className="ml-1 sm:ml-2 text-xs text-gray-500">
                            {s.address}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">
                    No suggestions for this city. Try removing filters.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preparation Steps */}
        {dish.steps?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Preparation Steps
            </h3>
            <ol className="list-decimal ml-4 space-y-1 sm:space-y-2 text-gray-700 text-xs sm:text-sm">
              {dish.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
          <button
            onClick={() =>
              dish.status !== "added" &&
              onAddMeal(
                dish,
                dish.planMealType || dish.meal_type,
                adjustedTotals,
                currentServingSize,
                dish.meal_date
              )
            }
            disabled={dish.status === "added"}
            className={`px-4 py-2 rounded-lg ${
              dish.status === "added"
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            }`}
          >
            {dish.status === "added" ? "Already Added" : "Add to Meal Log"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetailModal;
