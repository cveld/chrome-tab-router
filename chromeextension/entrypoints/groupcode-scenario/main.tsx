import { createRoot } from 'react-dom/client';
import { Scenario } from './Scenario';
import '../../src/UI/main.css';
import '../badge-preview/preview.css';
import './scenario.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Scenario />);
