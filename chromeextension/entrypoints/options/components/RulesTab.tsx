import { useState } from 'react';
import type { IRule } from '../../../src/Shared/RuleModels';
import {
  addRule,
  changeRule,
  chromeInstanceIdStore,
  deleteRule,
  rulesStore,
  userProfilesStore,
} from '../../../src/UI/backgroundStores';
import { useStore } from '../../../src/UI/stores';
import { RuleDialog } from '../../../src/UI/components/RuleDialog';

type EditingState = { mode: 'add' } | { mode: 'change'; original: IRule };

export function RulesTab() {
  const rules = useStore(rulesStore);
  const profiles = useStore(userProfilesStore);
  const ownInstanceId = useStore(chromeInstanceIdStore);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const visibleRules = rules.filter(rule => !rule.deleted);
  const profileByInstance = new Map(
    profiles.filter(p => p.chromeInstanceId).map(p => [p.chromeInstanceId!, p]),
  );

  return (
    <section>
      <p>
        <button type="button" className="btn primary" onClick={() => setEditing({ mode: 'add' })}>
          New rule
        </button>
      </p>
      <table className="table clickable-rows">
        <thead>
          <tr>
            <th>Regex</th>
            <th>Userprofile</th>
            <th className="actions-column" />
          </tr>
        </thead>
        <tbody>
          {visibleRules.map((rule, index) => {
            const profile = profileByInstance.get(rule.targetUserprofile ?? '');
            return (
              <tr key={rule.id ?? index} onClick={() => setEditing({ mode: 'change', original: rule })}>
                <td>{String(rule.regex)}</td>
                <td>
                  {profile ? (
                    <>
                      {profile.name || profile.chromeInstanceId}
                      {profile.chromeInstanceId === ownInstanceId ? ' (current)' : ''}
                    </>
                  ) : (
                    rule.targetUserprofile
                  )}
                </td>
                <td className="actions-column">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete rule"
                    title="Delete rule"
                    onClick={e => {
                      e.stopPropagation();
                      deleteRule(rule);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3V2h11v1h-11Z" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
          {visibleRules.length === 0 && (
            <tr>
              <td colSpan={3}>
                <i>No rules yet</i>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <RuleDialog
          title={editing.mode === 'add' ? 'Add rule' : 'Change rule'}
          initialRule={editing.mode === 'change' ? editing.original : undefined}
          onClose={() => setEditing(null)}
          onSubmit={patch => {
            if (editing.mode === 'add') {
              addRule(patch);
            } else {
              changeRule(editing.original, patch);
            }
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
