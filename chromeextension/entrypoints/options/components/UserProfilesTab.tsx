import { useState } from 'react';
import type { IUserProfileStatus } from '../../../src/Shared/UserprofileModels';
import {
  chromeInstanceIdStore,
  deleteUserProfile,
  updateUserProfile,
  userProfilesStore,
} from '../lib/backgroundStores';
import { formatDateTime } from '../lib/format';
import { useStore } from '../lib/stores';
import { UserProfileDialog } from './UserProfileDialog';

export function UserProfilesTab() {
  const profiles = useStore(userProfilesStore);
  const ownInstanceId = useStore(chromeInstanceIdStore);
  const [editing, setEditing] = useState<IUserProfileStatus | null>(null);

  const activeProfiles = profiles.filter(profile => !profile.deleted);

  return (
    <section>
      <table className="table clickable-rows">
        <thead>
          <tr>
            <th>Name</th>
            <th>Chrome Instance Id</th>
            <th>Connection Id</th>
            <th>Last seen</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {activeProfiles.map(profile => (
            <tr key={profile.chromeInstanceId} onClick={() => setEditing({ ...profile })}>
              <td>
                {profile.name || profile.chromeInstanceId}
                {profile.chromeInstanceId === ownInstanceId ? ' (current)' : ''}
              </td>
              <td>{profile.chromeInstanceId}</td>
              <td>{profile.connectionId}</td>
              <td>{formatDateTime(profile.lastSeen)}</td>
              <td>{formatDateTime(profile.updated)}</td>
            </tr>
          ))}
          {activeProfiles.length === 0 && (
            <tr>
              <td colSpan={5}>
                <i>No user profiles registered yet</i>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <UserProfileDialog
          profile={editing}
          isCurrent={editing.chromeInstanceId === ownInstanceId}
          onClose={() => setEditing(null)}
          onChange={updated => {
            updateUserProfile(updated);
            setEditing(null);
          }}
          onDelete={() => {
            deleteUserProfile(editing);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
