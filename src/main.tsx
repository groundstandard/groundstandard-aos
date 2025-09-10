import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/cache-manager.ts'
import './lib/config' // Initialize configuration validation

createRoot(document.getElementById("root")!).render(<App />);
