import { createRoot } from 'react-dom/client';
import { RouterPage } from './RouterPage';
import '../../src/UI/main.css';

const root = createRoot(document.getElementById('root')!);
root.render(<RouterPage />);
