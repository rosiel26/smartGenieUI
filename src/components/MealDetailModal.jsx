import React, { useEffect } from "react";

const MealDetailModal = ({
  showMealModal,
  selectedDish,
  setShowMealModal,
  selectedMealType,
  setSelectedMealType,
  servingSize,
  setServingSize,
  handleAddMeal,
  setAlertMessage,
  setShowAlertModal,
}) => {
  // Set default serving size to 100g when modal opens
  useEffect(() => {
    if (selectedDish) setServingSize(100);
  }, [selectedDish]);

  // Compute total nutrition dynamically from ingredients
  const computeDishTotals = (dish) => {
    const ingredients = dish.ingredients_dish_id_fkey || [];
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

  const totals = selectedDish
    ? computeDishTotals(selectedDish)
    : { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const multiplier = servingSize / 100; // Default per 100g
  const steps = selectedDish?.steps || [];

  const handleAdd = () => {
    if (!selectedMealType) {
      setAlertMessage("Please select a meal type.");
      setShowAlertModal(true);
      return;
    }
    handleAddMeal(selectedDish, selectedMealType, multiplier, servingSize);
    setShowMealModal(false);
  };

  return (
    <>
      {showMealModal && selectedDish && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white w-[350px] h-[70vh] border rounded-2xl shadow-2xl flex flex-col relative">
            {/* Close Button */}
            <button
              onClick={() => setShowMealModal(false)}
              className="absolute top-2 right-2 text-red-500 text-2xl z-50 font-bold"
            >
              ✕
            </button>

            {/* Image or Card Header */}
            <div className="relative flex-shrink-0">
              {selectedDish.image_url ? (
                <>
                  <img
                    src={selectedDish.image_url}
                    alt={selectedDish.name}
                    className="w-full h-50 object-cover rounded-t-2xl"
                  />

                  {/* Bottom overlay with name, description, and Add button */}
                  <div className="absolute bottom-0 left-0 w-full bg-black/80 p-3 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-white text-lg font-bold truncate border-b">
                        {selectedDish.name}
                      </h2>
                      <button
                        onClick={handleAdd}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium border-2 border-lime-400 hover:bg-lime-600 transition shadow-lg"
                      >
                        Add
                      </button>
                    </div>

                    {selectedDish.description && (
                      <p className="text-white text-sm leading-relaxed line-clamp-3 mt-1">
                        {selectedDish.description}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full bg-white rounded-2xl p-4 shadow-md flex flex-col space-y-2">
                  <h2 className="text-gray-900 text-lg font-bold">
                    {selectedDish.name}
                  </h2>
                  {selectedDish.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedDish.description}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleAdd}
                      className="bg-lime-500 text-white px-4 py-2 rounded-lg hover:bg-lime-600 transition shadow-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content with hidden scrollbar */}
            <div className="overflow-y-auto scrollbar-hide px-4 py-5 space-y-2 flex-1 rounded-2xl">
              {/* Nutrition Info */}
              <div className="p-3 rounded-lg text-xs text-black grid grid-cols-4 gap-4 text-center">
                <div className="border border-lime-500 rounded-lg p-1">
                  <span>🔥</span>
                  <span className="font-sm block">Calories</span>
                  <p className="text-lime-500 font-semibold">
                    {Math.round(totals.calories * multiplier)} kcal
                  </p>
                </div>
                <div className="border border-pink-500 rounded-lg p-1">
                  <span>💪</span>
                  <span className="font-sm block">Protein</span>
                  <p className="text-pink-500 font-semibold">
                    {Math.round(totals.protein * multiplier)} g
                  </p>
                </div>
                <div className="border border-yellow-500 rounded-lg p-1">
                  <span>🍞</span>
                  <span className="font-sm block">Carbs</span>
                  <p className="text-yellow-500 font-semibold">
                    {Math.round(totals.carbs * multiplier)} g
                  </p>
                </div>
                <div className="border border-violet-500 rounded-lg p-1">
                  <span>🧈</span>
                  <span className="font-sm block">Fats</span>
                  <p className="text-violet-500 font-semibold">
                    {Math.round(totals.fats * multiplier)} g
                  </p>
                </div>
              </div>

              {/* Meal Type and Serving Size */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block font-medium text-gray-700 mb-1 text-center">
                    Meal Type
                  </label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Meal Type</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block font-medium text-gray-700 mb-1 text-center">
                    Serving Size (g)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={servingSize}
                    onChange={(e) => setServingSize(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter servings (e.g. 100)"
                  />
                </div>
              </div>

              <hr className="border-2 border-lime-500" />

              {/* Ingredients Table */}
              {selectedDish.ingredients_dish_id_fkey?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-center">
                    Ingredients
                  </h3>
                  <div className="bg-white border rounded-lg overflow-hidden text-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-black text-lime-500 text-center">
                          <th className="text-left p-2">Ingredient</th>
                          <th className="text-right p-2">Cal</th>
                          <th className="text-right p-2">Pro</th>
                          <th className="text-right p-2">Carbs</th>
                          <th className="text-right p-2">Fats</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDish.ingredients_dish_id_fkey.map((ing) => (
                          <tr key={ing.id} className="border-t">
                            <td className="p-2">{ing.name}</td>
                            <td className="text-right p-2">
                              {Math.round(ing.calories || 0)}
                            </td>
                            <td className="text-right p-2">
                              {Math.round(ing.protein || 0)}g
                            </td>
                            <td className="text-right p-2">
                              {Math.round(ing.carbs || 0)}g
                            </td>
                            <td className="text-right p-2">
                              {Math.round(ing.fats || 0)}g
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <hr className="border-2 border-lime-500" />

              {/* Steps */}
              {steps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-center">
                    Steps
                  </h3>
                  <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                    {steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MealDetailModal;
