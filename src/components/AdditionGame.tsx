import React, { useState } from "react";

export default function AdditionGame() {
  const [result, setResult] = useState("");

  const handleKeyClick = (value: any) => {
    setResult((prev) => prev + value);
  };

  const handleClear = () => {
    setResult("");
  };

  return (
    <div className="bg-[#e8f2fa] min-h-screen flex flex-col items-center justify-between p-3 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center w-full px-2">
        <div className="flex gap-2">
          <button className="bg-orange-400 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
            ←
          </button>
          <button className="bg-orange-400 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
            🏠
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-500 text-lg font-semibold">10</span>
          <div className="bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold">
            🪙
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mt-2 px-4">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-sky-500 h-2 rounded-full"
            style={{ width: "35%" }}
          ></div>
        </div>
        <p className="text-center text-sm text-gray-600 font-medium">
          Nom de la sous-compétence
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row justify-center items-center w-full mt-4 gap-6">
        {/* Addition Area */}
        <div className="bg-[#dff0fa] rounded-3xl shadow-md flex flex-col items-center justify-center p-8 text-center">
          <div className="text-3xl font-semibold text-[#1a4d7a]">
            <p>+ 27</p>
            <p>+ 46</p>
            <hr className="border-t-2 border-[#1a4d7a] my-2 w-24 mx-auto" />
          </div>
          <input
            type="text"
            value={result}
            placeholder="Entrez le résultat"
            readOnly
            className="mt-4 text-center border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyClick(num.toString())}
              className="bg-[#066ea1] text-white text-xl w-16 h-16 rounded-lg shadow-md"
            >
              {num}
            </button>
          ))}
          <div></div>
          <button
            onClick={() => handleKeyClick("0")}
            className="bg-[#066ea1] text-white text-xl w-16 h-16 rounded-lg shadow-md col-span-3"
          >
            0
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-end mt-4">
        <img
          src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
          alt="chat"
          className="w-16 h-16 object-contain ml-4"
        />
        <button
          onClick={handleClear}
          className="bg-orange-400 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg mr-4 text-3xl font-bold"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
