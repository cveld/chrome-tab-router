// Hub for dev-only tools, opened from the "Development" item in the extension
// icon's context menu. Excluded from production builds (see wxt.config.ts).
import { getBuildInfo } from '../../src/Shared/buildInfo';

interface IDevTool {
  title: string;
  description: string;
  /** Extension page path; dev-only pages must also be listed in DEV_ENTRYPOINTS. */
  page: string;
}

// Add new development tools here.
const DEV_TOOLS: IDevTool[] = [
  {
    title: 'Badge status simulator',
    description:
      'Every state of the red "!" icon badge and the options page banner that explains it, with presets and live inputs.',
    page: '/badge-preview.html',
  },
  {
    title: 'Groupcode setup scenario',
    description:
      'Step through a fresh install: paste a group code, watch it connect, and see the badge and banner for success or failure.',
    page: '/groupcode-scenario.html',
  },
  {
    title: 'Options page',
    description: 'The real options page of this build.',
    page: '/options.html',
  },
];

export function DevPage() {
  const info = getBuildInfo();
  const rows: [string, string][] = [
    ['Extension id', chrome.runtime.id],
    ['Version', info.version],
    ['Mode', info.mode],
    ['Built', info.builtAt],
    ['Commit', info.commit],
    ['API endpoint', `${info.apiBaseUrl}/api`],
  ];

  return (
    <main className="content narrow">
      <h1>Development</h1>
      <p className="dev-muted">Dev-only tools. This page is not part of production builds.</p>

      <h2>Tools</h2>
      <ul className="dev-tools">
        {DEV_TOOLS.map(tool => (
          <li key={tool.page}>
            <a href={chrome.runtime.getURL(tool.page)}>{tool.title}</a>
            <div className="dev-muted">{tool.description}</div>
          </li>
        ))}
      </ul>

      <h2>Build</h2>
      <table className="dev-info">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>
                <code>{value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
