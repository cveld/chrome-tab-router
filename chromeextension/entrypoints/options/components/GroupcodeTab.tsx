import { useState } from 'react';
import { groupcodeStore, submitGroupcode } from '../lib/backgroundStores';
import { useStore } from '../lib/stores';
import { openGroupcodeApp } from './WelcomeTab';

export function GroupcodeTab() {
  const groupcode = useStore(groupcodeStore);
  const [entered, setEntered] = useState('');

  const submitClicked = () => {
    const value = entered.trim();
    if (!value) {
      return;
    }
    submitGroupcode(value);
    setEntered('');
  };

  const copyClicked = async () => {
    await navigator.clipboard.writeText(groupcode);
  };

  return (
    <section>
      <h2>Configured groupcode</h2>
      <div className="row">
        {groupcode ? (
          <>
            <span className="groupcode-value">{groupcode}</span>
            <button type="button" className="btn secondary" onClick={() => void copyClicked()}>
              Copy
            </button>
          </>
        ) : (
          <i>No groupcode assigned yet</i>
        )}
      </div>

      <h2>New groupcode</h2>
      <p>
        If you don't have a groupcode generated yet, click the button. This will bring you to the
        groupcode generation app.
      </p>
      <button type="button" className="btn primary" onClick={openGroupcodeApp}>
        Generate
      </button>

      <h2>Existing groupcode</h2>
      <p>If you already have a groupcode, submit it here.</p>
      <textarea rows={5} cols={40} value={entered} onChange={e => setEntered(e.target.value)} />
      <p>
        <button type="button" className="btn secondary" onClick={submitClicked}>
          Submit
        </button>
      </p>
    </section>
  );
}
