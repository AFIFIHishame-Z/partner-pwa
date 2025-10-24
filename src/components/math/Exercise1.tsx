import { useState, useEffect } from "react";

const Exercise1 = () => {
  const [mathProblem, setMathProblem] = useState({
    num1: 0,
    num2: 0,
    operator: "+",
    answer: 0,
  });
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    generateRandomProblem();
  }, []);

  const generateRandomProblem = () => {
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 50) + 10;
    const answer = num1 + num2;

    setMathProblem({ num1, num2, operator: "+", answer });
    setUserInput(""); // Clear input when new problem is generated
  };

  const handleNumberClick = (number: string) => {
    setUserInput((prev) => prev + number);
  };

  const handleVoiceClick = () => {
    if (!userInput.trim()) {
      // No result entered - ask user to create result
      const message = "Veuillez entrer le résultat de l'opération";
      speakText(message);
    } else {
      // Read the operation and user's result
      const operationText = `${mathProblem.num1} plus ${mathProblem.num2}`;
      const userResult = userInput;
      const message = `L'opération est ${operationText}. Votre résultat est ${userResult}`;
      speakText(message);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR"; // French language
      utterance.rate = 0.8; // Slightly slower for clarity
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('/media/background/Exercices-apres.jpg')",
      }}
    >
      {/* Icons and Pattern in top left corner */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <img
          src="/media/icons/Group 219.png"
          alt="Icon"
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
        />
        <img
          src="/media/icons/Group 220.png"
          alt="Icon"
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
        />
        <img
          src="/media/patterns/Frame 409.png"
          alt="Pattern"
          className="w-auto h-6"
        />
      </div>

      {/* Center Pattern and Text */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-start">
        <img
          src="/media/patterns/Frame 404.png"
          alt="Pattern"
          className="w-auto h-auto"
        />
        <span
          className="font-medium drop-shadow-lg"
          style={{ color: "#057AA9", fontSize: "0.7rem" }}
        >
          Nom de la sous-competence
        </span>
      </div>

      {/* Avatar and Pattern in top right corner */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <img
          src="/media/patterns/Frame 401.png"
          alt="Pattern"
          className="w-auto h-6"
        />
        <img
          src="/media/avatars/Group 217.png"
          alt="Avatar"
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
        />
      </div>

      {/* Icon in right middle */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
        <img
          src="/media/icons/Layer_3.png"
          alt="Icon"
          onClick={handleVoiceClick}
          className="w-14 h-14 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
        />
      </div>

      {/* Icon in bottom right corner. */}
      <div className="absolute bottom-4 right-4 z-10">
        <img
          src="/media/icons/Frame 408.png"
          alt="Icon"
          className="w-14 h-14 rounded-full border-2 border-white shadow-lg"
        />
      </div>

      {/* Calculator in center */}
      <div className="flex items-center justify-center h-full">
        {/* Porte image on the left with math exercise */}
        <div className="mr-8 relative">
          <img
            src="/media/patterns/porte.png"
            alt="Porte"
            className="h-64 w-auto"
          />
          {/* Math exercise overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            {/* Math problem */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-blue-800 mb-2">
                {mathProblem.num1} {mathProblem.operator} {mathProblem.num2}
              </div>
              <div className="w-32 h-0.5 bg-gray-400 mb-4"></div>
            </div>

            {/* Input field */}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Entrez le résultat"
              className="w-48 h-12 px-4 text-center text-lg bg-white/90 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-500"
            />
          </div>
        </div>

        {/* Calculator */}
        <div
          className="grid grid-cols-3 gap-4 p-6"
          style={{ left: "70px", position: "relative", top: "20px" }}
        >
          {/* Row 1: 1, 2, 3 */}
          <button
            onClick={() => handleNumberClick("1")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            1
          </button>
          <button
            onClick={() => handleNumberClick("2")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            2
          </button>
          <button
            onClick={() => handleNumberClick("3")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            3
          </button>

          {/* Row 2: 4, 5, 6 */}
          <button
            onClick={() => handleNumberClick("4")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            4
          </button>
          <button
            onClick={() => handleNumberClick("5")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleNumberClick("6")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            6
          </button>

          {/* Row 3: 7, 8, 9 */}
          <button
            onClick={() => handleNumberClick("7")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            7
          </button>
          <button
            onClick={() => handleNumberClick("8")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            8
          </button>
          <button
            onClick={() => handleNumberClick("9")}
            className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
          >
            9
          </button>

          {/* Row 4: 0 centered */}
          <div className="col-span-3 flex justify-center">
            <button
              onClick={() => handleNumberClick("0")}
              className="w-14 h-14 bg-[#007AA9] text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-[#005f7a] transition-colors"
            >
              0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercise1;
