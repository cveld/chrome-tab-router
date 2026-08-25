import { createRoot } from 'react-dom/client';
import { App } from './App';
// Importing the stores registers their content-script bridge handlers.
import './stores/groupcodeStore';
import './stores/chromeInstanceIdStore';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
