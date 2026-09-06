import { useState } from 'react';
import type { IUserProfileStatus } from '../../Shared/UserprofileModels';
import { Modal } from './Modal';

interface UserProfileDialogProps {
  profile: IUserProfileStatus;
  isCurrent: boolean;
  onChange(updated: IUserProfileStatus): void;
  onDelete?(): void;
  onClose(): void;
}

export function UserProfileDialog({
  profile,
  isCurrent,
  onChange,
  onDelete,
  onClose,
}: UserProfileDialogProps) {
  const [name, setName] = useState(profile.name ?? '');

  return (
    <Modal title="Profile update" onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault();
          onChange({ ...profile, name });
        }}
      >
        <label className="field">
          <span>Chrome userprofile code</span>
          <input type="text" value={profile.chromeInstanceId ?? ''} disabled readOnly />
        </label>
        <label className="field">
          <span>Chrome userprofile name</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter Chrome userprofile name"
            autoFocus
          />
        </label>
        <div className="row spread">
          <button type="submit" className="btn primary">
            Change
          </button>
          {!isCurrent && onDelete && (
            <button type="button" className="btn danger" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
