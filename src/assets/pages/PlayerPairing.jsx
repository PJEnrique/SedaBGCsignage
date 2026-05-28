import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../firebase';
import '../css/playerpairing.css';

function PlayerPairing() {
  const [pairCode, setPairCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handlePair = async () => {
    const cleanCode = pairCode.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter a pairing code.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const doc = await firestore
        .collection('displayPairing')
        .doc(cleanCode)
        .get();

      if (!doc.exists) {
        setError('Invalid pairing code.');
        return;
      }

      const data = doc.data();

      if (!data.displayName) {
        setError('Display not configured.');
        return;
      }

      navigate(`/user/${data.displayName}`);
    } catch (error) {
      console.error('Pairing error:', error);
      setError('Failed to pair display.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pairing-container">
      <div className="pairing-card">
        <h1>Display Pairing</h1>

        <p>Enter the pairing code for this display.</p>

        <input
          type="text"
          placeholder="Example: LOBBY2026"
          value={pairCode}
          onChange={(e) => setPairCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePair();
            }
          }}
        />

        <button onClick={handlePair} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Display'}
        </button>

        {error && <p className="pairing-error">{error}</p>}
      </div>
    </div>
  );
}

export default PlayerPairing;