import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHelpCircle,
  FiMail,
  FiFileText,
  FiAlertCircle,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import FooterNav from "../components/FooterNav.jsx";

export default function Settings() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Help",
      items: [
        { label: "FAQ", icon: <FiHelpCircle />, path: "/faq" },
        { label: "Contact Us", icon: <FiMail />, path: "/contact-us" },
      ],
    },
    {
      title: "Legal",
      items: [
        { label: "Terms & Conditions", icon: <FiFileText />, path: "/terms" },
        { label: "Disclaimer", icon: <FiAlertCircle />, path: "/disclaimer" },
      ],
    },
    {
      title: "Manage Account",
      items: [
        { label: "Account Management", icon: <FiUser />, path: "/account" },
      ],
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("hasSeenDisclaimer"); // reset disclaimer flag
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-6">
      <div className="bg-white w-[375px] min-h-[700px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 p-5 rounded-t-3xl text-white shadow-lg flex justify-center items-center">
          <span className="text-xl font-bold">Settings</span>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 flex-1 overflow-auto">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-sm font-sans font-bold text-black uppercase">
                {section.title}
              </h2>
              <div className="bg-green-50 rounded-2xl border border-green-100 shadow-sm divide-y">
                {section.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-4 w-full p-4 text-left hover:bg-green-100 transition rounded-2xl"
                  >
                    <span className="text-green-600 text-lg">{item.icon}</span>
                    <span className="text-gray-800 font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* LOGOUT BUTTON */}
          <div>
            <h2 className="text-sm font-sans font-bold text-black uppercase">
              Account
            </h2>
            <div className="bg-green-50 rounded-2xl border border-green-100 shadow-sm">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-full p-4 text-left text-red-600 hover:bg-red-50 transition rounded-2xl"
              >
                <FiLogOut className="text-red-600 text-lg" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER NAV */}
        <FooterNav />
      </div>{" "}
    </div>
  );
}
