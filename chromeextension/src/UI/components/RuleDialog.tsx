import { useEffect, useRef, useState } from 'react';
import type { IRule } from '../../Shared/RuleModels';
import type { IUserProfileStatus } from '../../Shared/UserprofileModels';
import { chromeInstanceIdStore, updateUserProfile, userProfilesStore } from '../backgroundStores';
import { useStore } from '../stores';
import { Modal } from './Modal';
import { UserProfileDialog } from './UserProfileDialog';

interface RuleDialogProps {
  title: string;
  submitLabel?: string;
  initialRule?: IRule;
  onSubmit(patch: Pick<IRule, 'regex' | 'targetUserprofile'>): void;
  onClose(): void;
}

export function RuleDialog({ title, submitLabel, initialRule, onSubmit, onClose }: RuleDialogProps) {
  const profiles = useStore(userProfilesStore);
  const ownInstanceId = useStore(chromeInstanceIdStore);
  const [regex, setRegex] = useState(
    initialRule?.regex instanceof RegExp ? initialRule.regex.source : (initialRule?.regex as string | undefined) ?? '',
  );
  const [target, setTarget] = useState(initialRule?.targetUserprofile ?? '');
  const [renaming, setRenaming] = useState<IUserProfileStatus | null>(null);

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
          <ProfilePicker
            profiles={(profiles as IUserProfileStatus[]).filter(profile => !profile.deleted)}
            ownInstanceId={ownInstanceId}
            value={target}
            onChange={setTarget}
            onRename={setRenaming}
          />
        </label>
        <button type="submit" className="btn primary">
          {submitLabel ?? (title === 'Add rule' ? 'Add' : 'Change')}
        </button>
      </form>

      {renaming && (
        <UserProfileDialog
          profile={renaming}
          isCurrent={renaming.chromeInstanceId === ownInstanceId}
          onClose={() => setRenaming(null)}
          onChange={updated => {
            updateUserProfile(updated);
            setRenaming(null);
          }}
        />
      )}
    </Modal>
  );
}

interface ProfilePickerProps {
  profiles: IUserProfileStatus[];
  ownInstanceId: string | undefined;
  value: string;
  onChange(value: string): void;
  onRename(profile: IUserProfileStatus): void;
}

function ProfilePicker({ profiles, ownInstanceId, value, onChange, onRename }: ProfilePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = profiles.find(profile => profile.chromeInstanceId === value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close only the menu, not the surrounding modal (which also closes on Escape).
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="profile-picker" ref={containerRef}>
      <button
        type="button"
        className="profile-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(previous => !previous)}
      >
        <span>
          {selected ? (selected.name || selected.chromeInstanceId)! : 'Select a profile…'}
          {selected?.chromeInstanceId === ownInstanceId ? ' (current)' : ''}
        </span>
        <span className="profile-picker-caret">▾</span>
      </button>
      {open && (
        <ul className="profile-picker-menu" role="listbox">
          <li className="profile-picker-option" role="option" aria-selected={value === ''}>
            <button
              type="button"
              className="profile-picker-option-label"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Select a profile…
            </button>
          </li>
          {profiles.map(profile => (
            <li
              key={profile.chromeInstanceId}
              className="profile-picker-option"
              role="option"
              aria-selected={profile.chromeInstanceId === value}
            >
              <button
                type="button"
                className="profile-picker-option-label"
                onClick={() => {
                  onChange(profile.chromeInstanceId ?? '');
                  setOpen(false);
                }}
              >
                {(profile.name || profile.chromeInstanceId)!}
                {profile.chromeInstanceId === ownInstanceId ? ' (current)' : ''}
              </button>
              <button
                type="button"
                className="icon-button rename"
                aria-label={`Rename ${profile.name || profile.chromeInstanceId}`}
                title="Rename profile"
                onClick={() => {
                  onRename(profile);
                  setOpen(false);
                }}
              >
                ✎
              </button>
            </li>
          ))}
          {profiles.length === 0 && (
            <li className="profile-picker-empty">
              <i>No user profiles registered yet</i>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
