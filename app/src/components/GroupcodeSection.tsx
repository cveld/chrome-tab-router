import { useState } from 'react';
import {
  generateGroupcode,
  groupcodeStore,
  setGroupcode,
} from '../stores/groupcodeStore';
import { useStore } from '../lib/stores';

/** Generate or reuse the shared group code and hand it to the extension. */
export function GroupcodeSection() {
  const groupcode = useStore(groupcodeStore);
  const [enteredGroupcode, setEnteredGroupcode] = useState('');
  const [groupcodeError, setGroupcodeError] = useState('');

  const generateClicked = async () => {
    setGroupcodeError('');
    try {
      await generateGroupcode();
    } catch (e: unknown) {
      setGroupcodeError(e instanceof Error ? e.message : String(e));
    }
  };

  const submitClicked = () => {
    if (!enteredGroupcode.trim()) {
      return;
    }
    setGroupcode({ encoded: enteredGroupcode });
    setEnteredGroupcode('');
  };

  const copyClicked = async () => {
    if (groupcode.encoded) {
      await navigator.clipboard.writeText(groupcode.encoded);
    }
  };

  return (
    <section className="card">
      <h2>Groupcode</h2>
      <p>The groupcode defines the set of Chrome user profiles that work together.</p>
      <p>You have two options:</p>
      <ol>
        <li>Generate a new groupcode</li>
        <li>Reuse a generated groupcode</li>
      </ol>
      <p>Currently active groupcode:</p>
      <div className="row">
        {groupcode.encoded ? (
          <>
            <span className="groupcode-value">{groupcode.encoded}</span>
            <button type="button" className="btn secondary" onClick={() => void copyClicked()}>
              Copy
            </button>
          </>
        ) : (
          <i>No groupcode assigned yet</i>
        )}
      </div>

      <h3>Generate</h3>
      <p>
        <button type="button" className="btn primary" onClick={() => void generateClicked()}>
          Generate
        </button>
      </p>
      {groupcodeError && <p className="error-text">{groupcodeError}</p>}

      <h3>Reuse existing code</h3>
      <textarea
        rows={5}
        cols={40}
        value={enteredGroupcode}
        onChange={e => setEnteredGroupcode(e.target.value)}
      />
      <p>
        <button type="button" className="btn secondary" onClick={submitClicked}>
          Submit
        </button>
      </p>
    </section>
  );
}
