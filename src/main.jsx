import './lib/arcgis/calciteConfig';
import { createRoot } from 'react-dom/client';
import '@arcgis/core/assets/esri/themes/light/main.css';
import App from './App';
import './styles/app.css';

createRoot(document.getElementById('root')).render(<App />);
