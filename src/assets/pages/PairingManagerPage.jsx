import React, { useMemo, useState } from 'react';
import '../css/Dashboard.css';
import '../css/PairingManagerPage.css';

import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { DISPLAY_PAGES } from '../utils/dashboardUtils';

function PairingManagerPage() {
  const { currentUser } = useAuth();
  const { pairingCodes } = useDashboardData();

  const [generatingDisplay, setGeneratingDisplay] = useState('');
  const [copiedDisplay, setCopiedDisplay] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const pairingItems = useMemo(() => {
    return DISPLAY_PAGES.map((displayName) => {
      const pairCode = pairingCodes?.[displayName]?.code || '';

      return {
        displayName,
        pairCode,
        hasCode: Boolean(pairCode),
      };
    });
  }, [pairingCodes]);

  const filteredItems = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return pairingItems.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.displayName.toLowerCase().includes(searchValue) ||
        item.pairCode.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'paired' && item.hasCode) ||
        (filter === 'unpaired' && !item.hasCode);

      return matchesSearch && matchesFilter;
    });
  }, [pairingItems, searchTerm, filter]);

  const summary = useMemo(() => {
    const paired = pairingItems.filter((item) => item.hasCode).length;

    return {
      total: pairingItems.length,
      paired,
      unpaired: pairingItems.length - paired,
    };
  }, [pairingItems]);

  const generatePairingCode = async (displayName) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    try {
      setGeneratingDisplay(displayName);

      const random = Math.floor(1000 + Math.random() * 9000);
      const pairCode = `${displayName}-${random}`;

      await firestore.collection('displayPairing').doc(pairCode).set({
        displayName,
        createdAt: new Date(),
        createdBy: currentUser.email || '',
      });

      alert(`Pairing code created:\n\n${pairCode}`);
    } catch (error) {
      console.error('Pairing code error:', error);
      alert('Failed to generate pairing code.');
    } finally {
      setGeneratingDisplay('');
    }
  };

  const copyPairingCode = async (displayName) => {
    const code = pairingCodes?.[displayName]?.code;

    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);

      setCopiedDisplay(displayName);

      setTimeout(() => {
        setCopiedDisplay('');
      }, 1500);
    } catch (error) {
      console.error('Copy pairing code error:', error);
      alert('Failed to copy pairing code.');
    }
  };

  return (
    <div className="dashboard-container pairing-manager-page">
      <section className="pairing-page-header">
        <div>
          <h1 className="dashboard-title pairing-page-title">
            Pairing Manager
          </h1>

          <p className="pairing-page-subtitle">
            Generate and manage display pairing codes for player connection.
          </p>
        </div>

        <div className="pairing-summary-grid">
          <div className="pairing-summary-card">
            <span>Total Displays</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="pairing-summary-card paired">
            <span>With Code</span>
            <strong>{summary.paired}</strong>
          </div>

          <div className="pairing-summary-card unpaired">
            <span>No Code</span>
            <strong>{summary.unpaired}</strong>
          </div>
        </div>
      </section>

      <section className="pairing-toolbar">
        <input
          type="text"
          value={searchTerm}
          placeholder="Search display or pairing code..."
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="pairing-filter-buttons">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            type="button"
            className={filter === 'paired' ? 'active' : ''}
            onClick={() => setFilter('paired')}
          >
            With Code
          </button>

          <button
            type="button"
            className={filter === 'unpaired' ? 'active' : ''}
            onClick={() => setFilter('unpaired')}
          >
            No Code
          </button>
        </div>
      </section>

      <div className="pairing-card-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isGenerating = generatingDisplay === item.displayName;
            const isCopied = copiedDisplay === item.displayName;
            const displayInitial =
              item.displayName?.charAt(0)?.toUpperCase() || 'D';

            return (
              <article
                className={`pairing-card ${
                  item.hasCode ? 'has-code' : 'no-code'
                }`}
                key={item.displayName}
              >
                <header className="pairing-card-header">
                  <div className="pairing-display-identity">
                    <div className="pairing-avatar">
                      {displayInitial}
                    </div>

                    <div>
                      <h3>{item.displayName}</h3>
                      <p>Display pairing access</p>
                    </div>
                  </div>

                  <span
                    className={
                      item.hasCode
                        ? 'pairing-status-ready'
                        : 'pairing-status-empty'
                    }
                  >
                    {item.hasCode ? 'Code Ready' : 'No Code'}
                  </span>
                </header>

                <section className="pairing-code-panel">
                  <span>Current Pairing Code</span>

                  {item.hasCode ? (
                    <strong>{item.pairCode}</strong>
                  ) : (
                    <p>No active pairing code loaded.</p>
                  )}
                </section>

                <footer className="pairing-card-actions">
                  <button
                    type="button"
                    className="pair-button"
                    onClick={() => generatePairingCode(item.displayName)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </button>

                  {item.hasCode && (
                    <button
                      type="button"
                      className="copy-button"
                      onClick={() => copyPairingCode(item.displayName)}
                    >
                      {isCopied ? 'Copied' : 'Copy Code'}
                    </button>
                  )}
                </footer>
              </article>
            );
          })
        ) : (
          <div className="pairing-empty-state">
            No pairing records matched your search or filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default PairingManagerPage;