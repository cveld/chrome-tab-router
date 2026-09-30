import { createRoot } from 'react-dom/client';
import { Simulator } from './Simulator';
import '../../src/UI/main.css';
import './preview.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Simulator />);
