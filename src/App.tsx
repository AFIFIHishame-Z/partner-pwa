import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import InstallPrompt from "./components/InstallPrompt";
import CameraCapture from "./components/CameraCapture";

function App() {
  return (
    <>
      <InstallPrompt />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <h1>Partner App - PWA Ready!</h1>
        <p>This app can now be installed on your device and works offline.</p>
      </div>

      {/* Camera Test Component for Iframe Communication */}
      <div style={{ marginTop: "40px" }}>
        <CameraCapture />
      </div>
    </>
  );
}

export default App;
