import React from "react";

const AlertModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded-xl text-center shadow-xl border border-green-100 max-w-sm w-full">
      <p className="text-gray-700 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        OK
      </button>
    </div>
  </div>
);

export default AlertModal;
