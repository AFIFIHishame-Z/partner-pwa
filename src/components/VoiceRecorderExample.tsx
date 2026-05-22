// import { useEffect, useState } from "react";
// import {
//   VoiceRecorder,
//   RecordingState,
//   PermissionStatus,
//   formatDuration,
//   type RecordingResult,
// } from "@superapp_men/voice-recorder";

// export function VoiceRecorderExample() {
//   const [recorder] = useState(
//     () =>
//       new VoiceRecorder({
//         maxDuration: 60_000, // 1 minute
//         quality: "high",
//         format: "webm",
//       })
//   );

//   const [state, setState] = useState(RecordingState.IDLE);
//   const [permission, setPermission] = useState(PermissionStatus.UNKNOWN);
//   const [duration, setDuration] = useState(0);
//   const [recording, setRecording] = useState<RecordingResult | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const unsubState = recorder.on("stateChange", ({ state }: any) => {
//       setState(state);
//     });

//     const unsubProgress = recorder.on("progress", ({ duration }: any) => {
//       setDuration(duration);
//     });

//     return () => {
//       unsubState();
//       unsubProgress();
//       recorder.destroy();
//     };
//   }, [recorder]);

//   const isRecording = state === RecordingState.RECORDING;

//   const handleStart = async () => {
//     try {
//       setError(null);
//       setRecording(null);

//       if (permission !== PermissionStatus.GRANTED) {
//         const p = await recorder.requestPermission();
//         setPermission(p);
//         if (p !== PermissionStatus.GRANTED) {
//           setError("Microphone permission is required");
//           return;
//         }
//       }

//       await recorder.startRecording();
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Failed to start recording");
//     }
//   };

//   const handleStop = async () => {
//     try {
//       const result = await recorder.stopRecording();
//       setRecording(result);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Failed to stop recording");
//     }
//   };

//   return (
//     <div
//       style={{
//         padding: "20px",
//         marginTop: "20px",
//         borderRadius: "16px",
//         background:
//           "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))",
//         border: "1px solid rgba(59,130,246,0.3)",
//       }}
//     >
//       <h2
//         style={{
//           marginBottom: "12px",
//           fontSize: "1.5rem",
//         }}
//       >
//         Voice Recorder (via SuperApp)
//       </h2>

//       {error && (
//         <div
//           style={{
//             marginBottom: "12px",
//             padding: "8px 12px",
//             borderRadius: "8px",
//             backgroundColor: "rgba(248,113,113,0.1)",
//             border: "1px solid rgba(248,113,113,0.4)",
//             color: "#b91c1c",
//             fontSize: "0.9rem",
//           }}
//         >
//           {error}
//         </div>
//       )}

//       <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
//         <button
//           type="button"
//           onClick={handleStart}
//           disabled={isRecording}
//           style={{
//             padding: "10px 18px",
//             borderRadius: "999px",
//             border: "none",
//             backgroundColor: isRecording ? "#9ca3af" : "#22c55e",
//             color: "white",
//             fontWeight: 600,
//             cursor: isRecording ? "not-allowed" : "pointer",
//           }}
//         >
//           {isRecording ? "Recording..." : "Start recording"}
//         </button>

//         <button
//           type="button"
//           onClick={handleStop}
//           disabled={!isRecording}
//           style={{
//             padding: "10px 18px",
//             borderRadius: "999px",
//             border: "none",
//             backgroundColor: !isRecording ? "#9ca3af" : "#ef4444",
//             color: "white",
//             fontWeight: 600,
//             cursor: !isRecording ? "not-allowed" : "pointer",
//           }}
//         >
//           Stop
//         </button>
//       </div>

//       <div style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
//         State: <strong>{state}</strong>
//       </div>

//       {isRecording && (
//         <div style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
//           Duration: <strong>{formatDuration(duration)}</strong>
//         </div>
//       )}

//       {recording && (
//         <div style={{ marginTop: "8px" }}>
//           <div style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
//             Recorded: <strong>{formatDuration(recording.duration)}</strong>
//           </div>
//           <audio
//             controls
//             src={recorder.resultToURL(recording)}
//             style={{ width: "100%", maxWidth: "400px" }}
//           />
//         </div>
//       )}
//     </div>
//   );
// }




