import { createRoot } from 'react-dom/client';
import { DevPage } from './DevPage';
import '../../src/UI/main.css';
import './dev.css';
import { logBuildInfo } from '../../src/Shared/buildInfo';

logBuildInfo('dev page');

const root = createRoot(document.getElementById('root')!);
root.render(<DevPage />);
