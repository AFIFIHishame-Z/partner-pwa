import "./App.css";
import { DeviceStorageTest } from "./components/DeviceStorageTest";
import { SpeechToTextExample } from "./components/SpeechToTextExample";
import { TextToSpeechExample } from "./components/TextToSpeechExample";
import { SubmitAssessmentResultsTest } from "./components/SubmitAssessmentResultsTest";
import { VoiceRecorderCapacitorSimple } from "./components/VoiceRecorderCapacitorSimple";
// import { VoiceRecorderCapacitorWithCheckpoints } from "./components/VoiceRecorderCapacitorWithCheckpoints";
// import { SubmitAssessmentResultsTest } from "./components/SubmitAssessmentResultsTest";
//import { TokenProviderExample } from "./components/TokenProviderExample";
// import { SpeechToTextExample } from "./components/SpeechToTextExample";
// import { TokenProviderExample } from "./components/TokenProviderExample";
// import { VoiceRecorderCapacitorSimple } from "./components/VoiceRecorderCapacitorSimple";
// import Exercise1 from "./components/math/Exercise1";
// import { VoiceRecorderCapacitorWithCheckpoints } from "./components/VoiceRecorderCapacitorWithCheckpoints";
// import { VoiceRecorderCapacitorSimple } from "./components/VoiceRecorderCapacitorSimple";
// import { VoiceRecorderCapacitorWithCheckpoints } from "./components/VoiceRecorderCapacitorWithCheckpoints";

interface NavigationRequest {
  type: "NAVIGATION_REQUEST";
  route: string;
}

function sendMessageToParent(navigationRequest: NavigationRequest): void {
  window.parent.postMessage(navigationRequest, "*");
}

function requestNavigation(): void {
  const navigationRequest: NavigationRequest = {
    type: "NAVIGATION_REQUEST",
    route: "/worldmap",
  };
  sendMessageToParent(navigationRequest);
}

function App() {
  return (
    <>
      {/* Back to Super App - top left */}
      <button
        type="button"
        onClick={requestNavigation}
        style={{
          position: "relative",
          top: "16px",
          left: "16px",
          zIndex: 9999,
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#fff",
          backgroundColor: "#6366f1",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.4)",
        }}
      >
        ← Retour à la Super App
      </button>
      {/* <TestSpeechToTextPackage/> */}
      {/* <MyComponent /> */}
      <SpeechToTextExample />
      <TextToSpeechExample />
      {/* <Exercise1 /> */}
      {/* <TokenProviderExample /> */}
      {/* <VoiceRecorderExample /> */}

      {/* Capacitor Voice Recorder Examples */}
      <VoiceRecorderCapacitorSimple />
      {/* <VoiceRecorderCapacitorWithCheckpoints /> */}
      <SubmitAssessmentResultsTest />
      <DeviceStorageTest />

      {/* <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "30px 0"
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            animation: "float 6s ease-in-out infinite",
          }}
        />

        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: "800",
            margin: "0",
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            letterSpacing: "-0.02em",
            position: "relative",
            zIndex: 1,
          }}
        >
          🚀 Partner App POC
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "rgba(255, 255, 255, 0.9)",
            margin: "15px 0 0 0",
            fontWeight: "500",
            position: "relative",
            zIndex: 1,
          }}
        >
          Testing multiple functionalities in a modern interface
        </p>

        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            backdropFilter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            backdropFilter: "blur(10px)",
          }}
        />
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}
      </style> */}

      {/* <Quiz />
      <FrenchPhotoExercise />
      <FrenchVoiceExercise /> */}
    </>
  );
}

export default App;
