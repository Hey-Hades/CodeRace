import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SocketProvider } from './context/SocketContext.jsx' // <-- Import the provider

createRoot(document.getElementById('root')).render(
  // Wrapped App inside SocketProvider (and removed StrictMode)
  <SocketProvider>
    <App />
  </SocketProvider>
)