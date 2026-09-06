import { useState } from 'react';
import type { IRule } from '../../../src/Shared/RuleModels';
import type { IUserProfileStatus } from '../../../src/Shared/UserprofileModels';
import { chromeInstanceIdStore, userProfilesStore } from '../lib/backgroundStores';
import { useStore } from '../lib/stores';
import { Modal } from './Modal';

interface RuleDialogProps {
  title: string;
  initialRule?: IRule;
  onSubmit(patch: Pick<IRule, 'regex' | 'targetUserprofile'>): void;
  onClose(): void;
}

export function RuleDialog({ title, initialRule, onSubmit, onClose }: RuleDialogProps) {
  const profiles = useStore(userProfilesStore);
  const ownInstanceId = useStore(chromeInstanceIdStore);
  const [regex, setRegex] = useState(
    initialRule?.regex instanceof RegExp ? initialRule.regex.source : (initialRule?.regex as string | undefined) ?? '',
  );
  const [target, setTarget] = useState(initialRule?.targetUserprofile ?? '');

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit({ regex, targetUserprofile: target });
        }}
      >
        <label className="field">
          <span>Regex</span>
          <input
            type="text"
            value={regex}
            onChange={e => setRegex(e.target.value)}
            placeholder="Enter regular expression"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Chrome userprofile target</span>
          <select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="">Select a profile…</option>
            {(profiles as IUserProfileStatus[])
              .filter(profile => !profile.deleted)
              .map(profile => (
                <option key={profile.chromeInstanceId} value={profile.chromeInstanceId ?? ''}>
                  {(profile.name || profile.chromeInstanceId)!}
                  {profile.chromeInstanceId === ownInstanceId ? ' (current)' : ''}
                </option>
              ))}
          </select>
        </label>
        <button type="submit" className="btn primary">
          {title === 'Add rule' ? 'Add' : 'Change'}
        </button>
      </form>
    </Modal>
  );
}
