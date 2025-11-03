import { useState, useEffect, useRef } from "react";
import { iframeCommunication } from "../../services/IframeCommunication";

const Exercise1 = () => {
  const [mathProblem, setMathProblem] = useState({
    num1: 0,
    num2: 0,
    operator: "+",
    answer: 0,
  });
  const [userInput, setUserInput] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedVoice, setCapturedVoice] = useState<string | null>(null);
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  // const [base64Voice, setBase64Voice] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  // const [debugStatus, setDebugStatus] = useState<string>("");
  const isStoppingRef = useRef(false);
  const MAX_RECORDING_DURATION = 60; // Maximum recording duration in seconds
  const [showResultVideo, setShowResultVideo] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const resultVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    generateRandomProblem();
    checkSpeechSupport();
  }, []);

  useEffect(() => {
    if (showResultVideo && resultVideoRef.current) {
      resultVideoRef.current.currentTime = 0;
      resultVideoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [showResultVideo]);

  const checkSpeechSupport = () => {
    // Check if speech synthesis is available
    const supported = "speechSynthesis" in window;
    setSpeechSupported(supported);

    if (supported) {
      console.log("Speech synthesis is supported");
    } else {
      console.log("Speech synthesis not supported, using fallback methods");
    }
  };

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
    // Ensure user interaction for iframe speech compatibility
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

  const handleMicrophoneClick = () => {
    setShowVoicePopup(true);
    setRecordingDuration(0);
    // setDebugStatus("");
    // setBase64Voice(null);
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      isStoppingRef.current = false;
      setRecordingDuration(0);

      const response = await iframeCommunication.startVoiceRecording({
        maxDuration: MAX_RECORDING_DURATION,
        audioFormat: "webm",
      });

      if (!response.success) {
        alert(
          `Erreur: ${
            response.error || "Impossible de démarrer l'enregistrement"
          }`
        );
        setIsRecording(false);
      } else {
        // Start duration timer
        let currentDuration = 0;
        let hasStopped = false; // Flag to prevent multiple stops
        const timer = setInterval(() => {
          if (hasStopped || isStoppingRef.current) {
            clearInterval(timer);
            (window as any).recordingTimer = null;
            return;
          }

          currentDuration += 0.1;
          const newDuration = Math.min(currentDuration, MAX_RECORDING_DURATION);
          setRecordingDuration(newDuration);

          // Auto-stop when reaching 58 seconds
          if (newDuration >= 58 && !hasStopped && !isStoppingRef.current) {
            hasStopped = true;
            clearInterval(timer);
            (window as any).recordingTimer = null;
            console.log("🛑 Auto-stopping at 58 seconds");

            // Set state immediately to prevent double-stop
            isStoppingRef.current = true;
            setIsRecording(false);

            // Stop recording automatically at 58s and send message to parent
            // Call stopVoiceRecording directly to ensure message is sent
            iframeCommunication
              .stopVoiceRecording()
              .then((response) => {
                console.log("✅ Auto-stop response received:", response);
                if (response.success && response.data?.recordDataBase64) {
                  try {
                    // Convert base64 to audio URL for playback
                    const binaryString = atob(response.data.recordDataBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const mimeType = response.data.format || "audio/webm";
                    const audioBlob = new Blob([bytes], { type: mimeType });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setCapturedVoice(audioUrl);
                  } catch (error) {
                    console.error("Error converting base64 to blob:", error);
                  }
                } else {
                  console.warn(
                    "Auto-stop: No audio data in response:",
                    response.error
                  );
                }
                isStoppingRef.current = false;
              })
              .catch((error) => {
                console.error("Error auto-stopping recording:", error);
                isStoppingRef.current = false;
              });
          }
        }, 100);
        (window as any).recordingTimer = timer;
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Erreur lors du démarrage de l'enregistrement");
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    // Prevent double-stop
    if (isStoppingRef.current || !isRecording) {
      return;
    }

    try {
      isStoppingRef.current = true;
      // Clear timer
      if ((window as any).recordingTimer) {
        clearInterval((window as any).recordingTimer);
        (window as any).recordingTimer = null;
      }

      setIsRecording(false);

      let response;
      try {
        // setDebugStatus("⏳ Calling stopVoiceRecording...");
        response = await iframeCommunication.stopVoiceRecording();
        if (response) {
          // setDebugStatus("✅ Response received from parent");
        } else {
          // setDebugStatus("⚠️ Response is NULL from parent");
        }
      } catch (error) {
        // setDebugStatus(
        //   `❌ Promise rejected: ${
        //     error instanceof Error ? error.message : "Unknown error"
        //   }`
        // );
        // If promise rejects, create a response object
        response = {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Erreur lors de l'arrêt de l'enregistrement",
        };
      }

      // Ensure we always have a response object, even if null/undefined from parent
      if (!response) {
        // setDebugStatus("⚠️ Response is NULL/UNDEFINED - No response received!");
        response = {
          success: false,
          error: "No response received from parent",
        };
      } else {
        if (response.success) {
          // setDebugStatus("✅ Response: SUCCESS");
        } else {
          // setDebugStatus(
          //   `❌ Response: FAILED - ${response.error || "Unknown error"}`
          // );
        }
      }

      // setBase64Voice(response);
      if (response.success && response.data?.recordDataBase64) {
        try {
          // Convert base64 to audio URL for playback
          const binaryString = atob(response.data.recordDataBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const mimeType = response.data.format || "audio/webm";
          const audioBlob = new Blob([bytes], { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          setCapturedVoice(audioUrl);
        } catch (error) {
          console.error("Error converting base64 to blob:", error);
          alert("Erreur lors de la conversion de l'audio");
        }
      } else {
        // Always show error message even if response doesn't have data
        const errorMessage = response.error || "Enregistrement échoué";
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      // Create a response object even in the outer catch
      const errorResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors de l'arrêt de l'enregistrement",
      };
      // setBase64Voice(errorResponse);
      alert(`Erreur: ${errorResponse.error}`);
    } finally {
      isStoppingRef.current = false;
    }
  };

  const handleCameraClick = async () => {
    try {
      setIsCapturing(true);
      console.log("📸 Starting camera capture...");

      const response = await iframeCommunication.requestCameraCapture({
        quality: 0.8,
        allowEditing: false,
        correctOrientation: true,
      });

      console.log("📸 Camera response received:", response);

      if (response.success && response.data) {
        const imageData =
          response.data.dataUrl || response.data.base64 || response.data.path;
        if (imageData) {
          setCapturedImage(imageData);
          setShowImagePopup(true);
          console.log("📸 Image captured and displayed successfully");
        } else {
          console.error("📸 No image data received");
          alert("Erreur: Aucune image reçue");
        }
      } else {
        console.error("📸 Camera capture failed:", response.error);
        alert(`Erreur de capture: ${response.error || "Capture échouée"}`);
      }
    } catch (error) {
      console.error("📸 Camera capture error:", error);
      alert(
        `Erreur de capture: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // const handleMicrophoneClick = async () => {
  //   try {
  //     setIsRecording(true);
  //     console.log("🎤 Starting microphone recording...");

  //     const response = await iframeCommunication.requestVoiceRecord({
  //       maxDuration: 60,
  //       audioFormat: "webm",
  //       quality: "medium",
  //     });

  //     console.log("🎤 Voice recording response received:", response);

  //     if (response.success && response.data) {
  //       let audioUrl: string | null = null;

  //       // Handle audioUrl (string)
  //       if (response.data.audioUrl) {
  //         audioUrl = response.data.audioUrl;
  //       }
  //       // Handle audioBlob (Blob)
  //       else if (response.data.audioBlob) {
  //         audioUrl = URL.createObjectURL(response.data.audioBlob);
  //       }

  //       if (audioUrl) {
  //         setCapturedVoice(audioUrl);
  //         setShowVoicePopup(true);
  //         console.log("🎤 Voice recorded and displayed successfully");
  //       } else {
  //         console.error("🎤 No audio data received");
  //         alert("Erreur: Aucun enregistrement audio reçu");
  //       }
  //     } else {
  //       console.error("🎤 Voice recording failed:", response.error);
  //       alert(
  //         `Erreur d'enregistrement: ${
  //           response.error || "Enregistrement échoué"
  //         }`
  //       );
  //     }
  //   } catch (error) {
  //     console.error("🎤 Voice recording error:", error);
  //     alert(
  //       `Erreur d'enregistrement: ${
  //         error instanceof Error ? error.message : "Erreur inconnue"
  //       }`
  //     );
  //   } finally {
  //     setIsRecording(false);
  //   }
  // };

  const speakText = (text: string) => {
    // Try multiple approaches for iframe/PWA compatibility
    try {
      // Method 1: Direct speech synthesis (works in most browsers)
      if (speechSupported && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        utterance.rate = 0.8;
        utterance.volume = 1.0;

        // Add error handling
        utterance.onerror = (event) => {
          console.warn("Speech synthesis failed:", event);
          // Fallback to parent window communication
          sendToParentWindow(text);
        };

        utterance.onstart = () => {
          console.log("Speech started");
        };

        speechSynthesis.speak(utterance);
        return;
      }
    } catch (error) {
      console.warn("Speech synthesis error:", error);
    }

    // Method 2: Try to communicate with parent window (for iframe context)
    sendToParentWindow(text);
  };

  const sendToParentWindow = (text: string) => {
    try {
      // Check if we're in an iframe
      if (window.parent !== window) {
        // Send message to parent window
        window.parent.postMessage(
          {
            type: "SPEAK_TEXT",
            text: text,
            language: "fr-FR",
            rate: 0.8,
          },
          "*"
        );

        console.log("Sent speech request to parent window:", text);
        return;
      }
    } catch (error) {
      console.warn("Failed to communicate with parent window:", error);
    }

    // Method 3: Fallback - show text in console or alert
    console.log("Speech text (fallback):", text);

    // Optional: Show a visual indicator that speech was requested
    showSpeechIndicator(text);
  };

  const showSpeechIndicator = (text: string) => {
    // Create a temporary visual indicator
    const indicator = document.createElement("div");
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
      font-size: 16px;
      text-align: center;
      max-width: 300px;
    `;
    indicator.textContent = `🔊 ${text}`;

    document.body.appendChild(indicator);

    // Remove after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 3000);
  };

  const handleBackToNeighborhoods = () => {
    console.log("Exercise1: Requesting navigation back to neighborhoods");
    iframeCommunication.requestNavigation("/neighborhoods");
  };

  const handleBackToWorldmap = () => {
    console.log("Exercise1: Requesting navigation back to subject");
    iframeCommunication.requestNavigation("/worldmap");
  };

  const handleCheckAnswer = () => {
    if (!userInput.trim()) {
      // No answer entered
      return;
    }

    const userAnswer = parseInt(userInput.trim(), 10);
    const isCorrect = userAnswer === mathProblem.answer;
    if (!isCorrect) {
      setUserInput("");
    }
    setIsCorrectAnswer(isCorrect);
    setShowResultVideo(true);

    // Reset video to start if it exists
    if (resultVideoRef.current) {
      resultVideoRef.current.currentTime = 0;
      resultVideoRef.current.play();
    }
  };

  const handleVideoEnded = () => {
    setShowResultVideo(false);

    if (isCorrectAnswer) {
      // Correct answer: generate new problem
      generateRandomProblem();
    } else {
      // Incorrect answer: clear input field
      setUserInput("");
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
          alt="Back to Neighborhoods"
          className="w-10 h-10 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform"
          onClick={handleBackToNeighborhoods}
          title="Retour aux quartiers"
        />
        <img
          src="/media/icons/Group 220.png"
          alt="Icon"
          className="w-10 h-10 rounded-full  shadow-lg"
          onClick={handleBackToWorldmap}
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
          className="w-10 h-10 rounded-full  shadow-lg"
        />
      </div>

      {/* Icon in right middle */}
      <div
        className="absolute right-4 z-10 flex flex-col gap-3"
        style={{ top: "27%" }}
      >
        <img
          src="/media/icons/Layer_3.png"
          alt="Icon"
          onClick={handleVoiceClick}
          className="w-14 h-14 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
        />
        <div
          className="w-14 h-14 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/20 backdrop-blur-sm"
          onClick={handleCameraClick}
        >
          <span
            className="text-2xl"
            style={{
              fontSize: "2rem",
              top: isCapturing ? "-3px" : "-7px",
              position: "relative",
            }}
          >
            {isCapturing ? "⏳" : "📸"}
          </span>
        </div>
        <div
          className="w-14 h-14 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/20 backdrop-blur-sm"
          onClick={handleMicrophoneClick}
        >
          <span
            className="text-2xl"
            style={{
              fontSize: "2rem",
              top: isRecording ? "-3px" : "-7px",
              position: "relative",
            }}
          >
            {isRecording ? "⏳" : "🎤"}
          </span>
        </div>
      </div>

      {/* Icon in bottom right corner. */}
      <div className="absolute bottom-4 right-4 z-10">
        <img
          src="/media/icons/Frame 408.png"
          alt="Icon"
          className="w-14 h-14 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform"
          onClick={handleCheckAnswer}
        />
      </div>

      {/* Video in bottom left corner */}
      {!showResultVideo && (
        <div className="absolute bottom-4 left-4 z-10">
          <video
            src="/media/videos/WhatsApp Video 2025-10-30 at 12.31.19 PM.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="rounded-lg shadow-lg"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              position: "relative",
              top: "20px",
            }}
          />
        </div>
      )}

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

            {/* Input field with clear button */}
            <div className="relative w-48">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Entrez le résultat"
                className="w-full h-12 px-4  text-center text-lg bg-white/90 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-500"
              />
              {/* {userInput && (
                <button
                  onClick={() => setUserInput("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-400 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center font-bold"
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    fontSize: "0.8rem",
                  }}
                  title="Effacer"
                >
                  ×
                </button>
              )} */}
            </div>
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

      {/* Image Popup */}
      {showImagePopup && capturedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowImagePopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Image Capturée
            </h3>
            <div className="text-center flex justify-center items-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: "160px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Voice Recording Popup - WhatsApp Style */}
      {showVoicePopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Prevent closing dialog when clicking outside during recording
            if (isRecording) {
              e.stopPropagation();
              return;
            }
            // Only close if clicking on the backdrop (not the dialog content)
            if (e.target === e.currentTarget) {
              if ((window as any).recordingTimer) {
                clearInterval((window as any).recordingTimer);
                (window as any).recordingTimer = null;
              }
              setShowVoicePopup(false);
              setIsRecording(false);
              isStoppingRef.current = false;
              setRecordingDuration(0);
              if (capturedVoice && capturedVoice.startsWith("blob:")) {
                URL.revokeObjectURL(capturedVoice);
              }
              setCapturedVoice(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 relative shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => {
                // Prevent closing when recording
                if (isRecording) {
                  return;
                }
                if ((window as any).recordingTimer) {
                  clearInterval((window as any).recordingTimer);
                  (window as any).recordingTimer = null;
                }
                setShowVoicePopup(false);
                setIsRecording(false);
                isStoppingRef.current = false;
                setRecordingDuration(0);
                // setDebugStatus("");
                if (capturedVoice && capturedVoice.startsWith("blob:")) {
                  URL.revokeObjectURL(capturedVoice);
                }
                setCapturedVoice(null);
                // setBase64Voice(null);
              }}
              disabled={isRecording}
              className={`absolute top-4 right-4 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                isRecording
                  ? "text-gray-300 cursor-not-allowed opacity-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title={isRecording ? "Enregistrement en cours..." : "Fermer"}
            >
              ×
            </button>

            {/* Bonjour text */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Bonjour</h2>
            </div>

            {/* Recording status */}
            {isRecording && (
              <div className="text-center mb-4">
                <p className="text-sm text-red-500 font-medium">
                  Enregistrement... {recordingDuration.toFixed(1)} /{" "}
                  {MAX_RECORDING_DURATION}s
                </p>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-100"
                    style={{
                      width: `${
                        (recordingDuration / MAX_RECORDING_DURATION) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Debug Panel - Visual Debugging for Phone */}
            {/* <div className="mb-4 p-3 bg-gray-100 rounded-lg border-2 border-blue-300">
              <div className="text-xs font-bold text-gray-700 mb-2">
                🔍 Debug Info:
              </div>
              <div className="text-xs space-y-1">
                {debugStatus && (
                  <div className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-300">
                    <span className="font-semibold">Status: </span>
                    <span className="text-gray-800">{debugStatus}</span>
                  </div>
                )}
                {base64Voice ? (
                  <>
                    <div>
                      <span className="font-semibold">Response Status: </span>
                      <span
                        className={
                          base64Voice.success
                            ? "text-green-600 font-bold"
                            : "text-red-600 font-bold"
                        }
                      >
                        {base64Voice.success ? "✅ SUCCESS" : "❌ FAILED"}
                      </span>
                    </div>
                    {base64Voice.error && (
                      <div>
                        <span className="font-semibold">Error: </span>
                        <span className="text-red-600 break-words">
                          {base64Voice.error}
                        </span>
                      </div>
                    )}
                    {base64Voice.data?.recordDataBase64 ? (
                      <div>
                        <span className="font-semibold">Audio Data: </span>
                        <span className="text-green-600">
                          ✅ Present (
                          {Math.round(
                            (base64Voice.data.recordDataBase64.length || 0) /
                              1024
                          )}{" "}
                          KB)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold">Audio Data: </span>
                        <span className="text-orange-600">❌ Not present</span>
                      </div>
                    )}
                    {base64Voice.requestId && (
                      <div>
                        <span className="font-semibold">Request ID: </span>
                        <span className="text-gray-600 font-mono text-[10px] break-all">
                          {String(base64Voice.requestId)}
                        </span>
                      </div>
                    )}
                    {!base64Voice.success && !base64Voice.error && (
                      <div className="text-red-600 font-bold">
                        ⚠️ No error message provided
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-red-600 font-bold">
                    ⚠️ Response is NULL - No data received
                  </div>
                )}
              </div>
            </div> */}

            {/* Playback if recording is complete */}
            {capturedVoice && !isRecording && (
              <div className="mb-6">
                <audio
                  src={capturedVoice}
                  controls
                  className="w-full"
                  autoPlay={false}
                >
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
              </div>
            )}

            {/* Click to Start/Stop Button */}
            <div className="flex justify-center items-center">
              <button
                onClick={() => {
                  if (isRecording) {
                    handleStopRecording();
                  } else {
                    handleStartRecording();
                  }
                }}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-200 shadow-lg
                  ${
                    isRecording
                      ? "bg-red-500 scale-110 animate-pulse"
                      : "bg-blue-500 hover:bg-blue-600 active:scale-95"
                  }
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-10 w-10 ${
                    isRecording ? "text-white" : "text-white"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isRecording ? (
                    // Stop icon (square)
                    <path d="M6 6h12v12H6z" />
                  ) : (
                    // Microphone icon
                    <path d="M12 14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2s-2 .9-2 2v6c0 1.1.9 2 2 2zm5-2v-1c0-2.8-2.2-5-5-5S7 8.2 7 11v1c0 .6-.4 1-1 1s-1-.4-1-1v-1c0-3.9 3.1-7 7-7s7 3.1 7 7v1c0 .6-.4 1-1 1s-1-.4-1-1zm-5 4c-2.2 0-4-1.8-4-4v-2h2v2c0 1.1.9 2 2 2s2-.9 2-2v-2h2v2c0 2.2-1.8 4-4 4z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Instruction text */}
            <p className="text-center text-sm text-gray-600 mt-4">
              {isRecording
                ? "Cliquez pour arrêter"
                : capturedVoice
                ? "Cliquez pour enregistrer à nouveau"
                : "Cliquez pour enregistrer"}
            </p>
          </div>
        </div>
      )}

      {/* Result Video Overlay with Animation */}
      {showResultVideo && (
        <div
          className="absolute bottom-4 left-4 z-50"
          style={{
            animation: "slideUp 0.5s ease-out forwards",
          }}
        >
          <video
            ref={resultVideoRef}
            src={
              isCorrectAnswer
                ? "/media/videos/WhatsApp Video 2025-10-30 at 12.31.27 PM.mp4"
                : "/media/videos/WhatsApp Video 2025-10-30 at 12.31.38 PM.mp4"
            }
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="rounded-lg shadow-lg"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              position: "relative",
              top: "20px",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Exercise1;
