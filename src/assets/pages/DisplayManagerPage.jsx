import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import '../css/Dashboard.css';
import '../css/DisplayManagerPage.css';

import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  DISPLAY_PAGES,
  getActivePlaylist,
  isDisplayOnline,
} from '../utils/dashboardUtils';

import DisplayCard from '../components/DisplayCard';

function DisplayManagerPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const {
    displayAssignments,
    displayStatuses,
    pairingCodes,
    now,
  } = useDashboardData();

  const [generatingCodeFor, setGeneratingCodeFor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const displayItems = useMemo(() => {
    return DISPLAY_PAGES.map((displayName) => {
      const schedule = displayAssignments[displayName];
      const playlists = schedule?.playlists || [];
      const activePlaylist = getActivePlaylist(playlists, now);
      const activePlaylistId = activePlaylist?.id;
      const online = isDisplayOnline(displayStatuses, displayName, now);
      const pairCode = pairingCodes[displayName]?.code;

      return {
        displayName,
        playlists,
        activePlaylist,
        activePlaylistId,
        slideCount: activePlaylist?.slides?.length || 0,
        online,
        pairCode,
      };
    });
  }, [displayAssignments, displayStatuses, pairingCodes, now]);

  const filteredDisplayItems = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return displayItems.filter((display) => {
      const matchesSearch =
        !searchValue ||
        display.displayName.toLowerCase().includes(searchValue) ||
        display.activePlaylist?.playlistName?.toLowerCase().includes(searchValue);

      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'online' && display.online) ||
        (statusFilter === 'offline' && !display.online) ||
        (statusFilter === 'active' && display.activePlaylist) ||
        (statusFilter === 'empty' && !display.activePlaylist);

      return matchesSearch && matchesFilter;
    });
  }, [displayItems, searchTerm, statusFilter]);

  const overview = useMemo(() => {
    const onlineCount = displayItems.filter((display) => display.online).length;
    const activeCount = displayItems.filter((display) => display.activePlaylist).length;
    const scheduledCount = displayItems.reduce(
      (total, display) => total + display.playlists.length,
      0
    );

    return {
      total: displayItems.length,
      online: onlineCount,
      offline: displayItems.length - onlineCount,
      active: activeCount,
      scheduled: scheduledCount,
    };
  }, [displayItems]);

  const addAuditLog = async ({
    action,
    title,
    details,
    displayName = '',
    playlistName = '',
    slideCount = 0,
    scheduleStart = null,
    scheduleEnd = null,
  }) => {
    if (!currentUser) return;

    try {
      await firestore.collection('auditLogs').add({
        action,
        title,
        details,
        displayName,
        playlistName,
        slideCount,
        scheduleStart,
        scheduleEnd,
        userEmail: currentUser.email || '',
        userId: currentUser.uid || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Audit log error:', error);
      alert(`The action was completed, but the log was not saved: ${error.message}`);
    }
  };

  const generatePairingCode = async (displayName) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    try {
      setGeneratingCodeFor(displayName);

      const random = Math.floor(1000 + Math.random() * 9000);
      const pairCode = `${displayName}-${random}`;

      await firestore.collection('displayPairing').doc(pairCode).set({
        displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.email || '',
      });

      alert(`Pairing code created:\n\n${pairCode}`);
    } catch (error) {
      console.error('Pairing code error:', error);
      alert('Failed to generate pairing code.');
    } finally {
      setGeneratingCodeFor('');
    }
  };

  const copyPairingCode = async (displayName) => {
    const code = pairingCodes[displayName]?.code;

    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      alert('Pairing code copied.');
    } catch (error) {
      console.error('Copy code error:', error);
      alert('Failed to copy pairing code.');
    }
  };

  const handleEditDisplay = (displayName, playlistId = null) => {
    const schedule = displayAssignments[displayName];
    const playlists = schedule?.playlists || [];

    const targetPlaylist = playlistId
      ? playlists.find((playlist) => String(playlist.id) === String(playlistId))
      : getActivePlaylist(playlists, now) || playlists[0];

    if (!targetPlaylist?.slides?.length) {
      alert(`${displayName} has no playlist to edit.`);
      return;
    }

    navigate(
      `/user/playlists?display=${encodeURIComponent(displayName)}&playlistId=${encodeURIComponent(targetPlaylist.id || '')}`
    );
  };

  const handleClearDisplay = async (displayName) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    const confirmClear = window.confirm(
      `Clear all scheduled playlists from ${displayName}?`
    );

    if (!confirmClear) return;

    try {
      const displayRef = firestore.collection('displaySchedules').doc(displayName);
      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        alert(`${displayName} has no scheduled playlists.`);
        return;
      }

      const existingPlaylists = displayDoc.data().playlists || [];

      if (existingPlaylists.length === 0) {
        alert(`${displayName} has no scheduled playlists.`);
        return;
      }

      const slideCount = existingPlaylists.reduce(
        (total, playlist) => total + (playlist.slides?.length || 0),
        0
      );

      await displayRef.delete();

      await addAuditLog({
        action: 'CLEAR_DISPLAY_SCHEDULES',
        title: 'Cleared display schedules',
        details: `Cleared ${existingPlaylists.length} scheduled playlist(s) from ${displayName}.`,
        displayName,
        playlistName: 'All scheduled playlists',
        slideCount,
      });

      alert(`${displayName} schedules cleared successfully.`);
    } catch (error) {
      console.error('Clear display error:', error);
      alert(`Failed to clear display schedules: ${error.message}`);
    }
  };

  const handleDeleteScheduledPlaylist = async (displayName, playlistId) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    if (!playlistId) {
      alert('Playlist ID is missing.');
      return;
    }

    const confirmDelete = window.confirm(
      `Delete this scheduled playlist from ${displayName}?`
    );

    if (!confirmDelete) return;

    try {
      const displayRef = firestore.collection('displaySchedules').doc(displayName);
      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        alert(`${displayName} has no scheduled playlists.`);
        return;
      }

      const existingPlaylists = displayDoc.data().playlists || [];

      const deletedPlaylist = existingPlaylists.find(
        (playlist) => String(playlist.id) === String(playlistId)
      );

      if (!deletedPlaylist) {
        alert('Playlist was not found.');
        return;
      }

      const updatedPlaylists = existingPlaylists.filter(
        (playlist) => String(playlist.id) !== String(playlistId)
      );

      if (updatedPlaylists.length === 0) {
        await displayRef.delete();
      } else {
        await displayRef.update({
          playlists: updatedPlaylists,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      await addAuditLog({
        action: 'DELETE_PLAYLIST_SCHEDULE',
        title: 'Deleted scheduled playlist',
        details: `Deleted "${deletedPlaylist.playlistName || `${displayName} Playlist`}" from ${displayName}.`,
        displayName,
        playlistName: deletedPlaylist.playlistName || `${displayName} Playlist`,
        slideCount: deletedPlaylist.slides?.length || 0,
        scheduleStart: deletedPlaylist.scheduleStart || null,
        scheduleEnd: deletedPlaylist.scheduleEnd || null,
      });

      alert('Scheduled playlist deleted successfully.');
    } catch (error) {
      console.error('Delete scheduled playlist error:', error);
      alert(`Failed to delete scheduled playlist: ${error.message}`);
    }
  };

  const openDisplay = (displayName) => {
    window.open(`${window.location.origin}/user/${displayName}`, '_blank');
  };

  return (
    <div className="dashboard-container display-manager-page">
      <section className="display-manager-topbar">
        <div>
          <h1 className="dashboard-title display-manager-title">
            Display Manager
          </h1>

          <p className="display-manager-subtitle">
            Monitor screens, pairing codes, active playlists, and scheduled playback.
          </p>
        </div>

        <div className="display-summary-grid">
          <div className="display-summary-card">
            <span>Total</span>
            <strong>{overview.total}</strong>
          </div>

          <div className="display-summary-card online">
            <span>Online</span>
            <strong>{overview.online}</strong>
          </div>

          <div className="display-summary-card offline">
            <span>Offline</span>
            <strong>{overview.offline}</strong>
          </div>

          <div className="display-summary-card">
            <span>Schedules</span>
            <strong>{overview.scheduled}</strong>
          </div>
        </div>
      </section>

      <section className="display-toolbar">
        <input
          type="text"
          value={searchTerm}
          placeholder="Search display or playlist..."
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="display-filter-buttons">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>

          <button
            className={statusFilter === 'online' ? 'active' : ''}
            onClick={() => setStatusFilter('online')}
          >
            Online
          </button>

          <button
            className={statusFilter === 'offline' ? 'active' : ''}
            onClick={() => setStatusFilter('offline')}
          >
            Offline
          </button>

          <button
            className={statusFilter === 'active' ? 'active' : ''}
            onClick={() => setStatusFilter('active')}
          >
            With Active
          </button>

          <button
            className={statusFilter === 'empty' ? 'active' : ''}
            onClick={() => setStatusFilter('empty')}
          >
            Empty
          </button>
        </div>
      </section>

      <div className="display-manager">
        {filteredDisplayItems.length > 0 ? (
          filteredDisplayItems.map((display) => (
            <DisplayCard
              key={display.displayName}
              displayName={display.displayName}
              slideCount={display.slideCount}
              online={display.online}
              pairCode={display.pairCode}
              playlistName={display.activePlaylist?.playlistName}
              scheduleStart={display.activePlaylist?.scheduleStart}
              scheduleEnd={display.activePlaylist?.scheduleEnd}
              scheduledPlaylists={display.playlists}
              activePlaylistId={display.activePlaylistId}
              generatingCode={generatingCodeFor === display.displayName}
              openDisplay={openDisplay}
              handleEditDisplay={handleEditDisplay}
              generatePairingCode={generatePairingCode}
              copyPairingCode={copyPairingCode}
              handleClearDisplay={handleClearDisplay}
              handleDeleteScheduledPlaylist={handleDeleteScheduledPlaylist}
            />
          ))
        ) : (
          <div className="display-empty-state">
            No displays matched your search or filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default DisplayManagerPage;