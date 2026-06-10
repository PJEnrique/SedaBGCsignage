import React, { useEffect, useMemo, useState } from 'react';
import '../css/Dashboard.css';
import '../css/LogsPage.css';

import { firestore } from '../firebase';

const LOGS_ACCESS_CODE = 'X8GZ&Zq6pNdH#!Ya';

function LogsPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(
    sessionStorage.getItem('logsUnlocked') === 'true'
  );

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isUnlocked) {
      setLoadingLogs(false);
      return;
    }

    setLoadingLogs(true);
    setLogsError('');

    const logsRef = firestore
      .collection('auditLogs')
      .orderBy('createdAt', 'desc')
      .limit(150);

    const unsubscribe = logsRef.onSnapshot(
      (snapshot) => {
        const logItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLogs(logItems);
        setLoadingLogs(false);
        setLogsError('');
      },
      (error) => {
        console.error('Logs fetch error:', error);

        setLogs([]);
        setLoadingLogs(false);
        setLogsError(error.message || 'Failed to fetch logs.');
      }
    );

    return () => unsubscribe();
  }, [isUnlocked, refreshKey]);

  const getActionLabel = (action) => {
    if (action === 'UPLOAD_MEDIA') return 'Uploaded Media';
    if (action === 'UPLOAD_MEDIA_BATCH') return 'Uploaded Media Batch';
    if (action === 'ADD_PLAYLIST_SCHEDULE') return 'Added Playlist';
    if (action === 'UPDATE_PLAYLIST_SCHEDULE') return 'Updated Playlist';
    if (action === 'DELETE_PLAYLIST_SCHEDULE') return 'Deleted Playlist';
    if (action === 'CLEAR_DISPLAY_SCHEDULES') return 'Cleared Display Schedules';
    if (action === 'DELETE_MEDIA') return 'Deleted Media';

    return action || 'Log Entry';
  };

  const actionOptions = useMemo(() => {
    const actions = logs
      .map((log) => log.action)
      .filter(Boolean);

    return ['All', ...new Set(actions)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesAction =
        actionFilter === 'All' || log.action === actionFilter;

      const searchableText = [
        log.action,
        getActionLabel(log.action),
        log.title,
        log.details,
        log.userEmail,
        log.displayName,
        log.playlistName,
        log.fileName,
        log.category,
        log.scheduleStart,
        log.scheduleEnd,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      return matchesAction && matchesSearch;
    });
  }, [logs, searchTerm, actionFilter]);

  const handleUnlock = (event) => {
    event.preventDefault();

    if (accessCode !== LOGS_ACCESS_CODE) {
      alert('Incorrect logs password code.');
      return;
    }

    sessionStorage.setItem('logsUnlocked', 'true');
    setIsUnlocked(true);
    setLoadingLogs(true);
  };

  const handleLockLogs = () => {
    sessionStorage.removeItem('logsUnlocked');
    setIsUnlocked(false);
    setAccessCode('');
    setLogs([]);
    setLogsError('');
    setLoadingLogs(false);
  };

  const handleRefreshLogs = () => {
    setRefreshKey((current) => current + 1);
  };

  const formatDateTime = (value) => {
    if (!value) return 'No date';

    const date = value.toDate ? value.toDate() : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatScheduleTime = (value) => {
    if (!value) return 'Not set';

    const date = value.toDate ? value.toDate() : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isUnlocked) {
    return (
      <div className="dashboard-container logs-page">
        <div className="logs-lock-card">
          <div className="logs-lock-icon">🔒</div>

          <h1>Logs Access</h1>

          <p>
            Enter the password code to view upload and scheduled playlist logs.
          </p>

          <form onSubmit={handleUnlock}>
            <input
              type="password"
              value={accessCode}
              placeholder="Enter logs password code"
              onChange={(event) => setAccessCode(event.target.value)}
            />

            <button type="submit">
              Open Logs
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container logs-page">
      <section className="logs-header">
        <div>
          <h1 className="dashboard-title logs-title">
            Activity Logs
          </h1>

          <p className="logs-subtitle">
            View who uploaded media and who added, updated, deleted, or cleared scheduled playlists.
          </p>
        </div>

        <div className="logs-header-actions">
          <button
            type="button"
            className="logs-refresh-button"
            onClick={handleRefreshLogs}
          >
            Refresh
          </button>

          <button
            type="button"
            className="logs-lock-button"
            onClick={handleLockLogs}
          >
            Lock Logs
          </button>
        </div>
      </section>

      <section className="logs-toolbar">
        <input
          type="text"
          value={searchTerm}
          placeholder="Search logs, user, display, playlist, or file..."
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
        >
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action === 'All' ? 'All Actions' : getActionLabel(action)}
            </option>
          ))}
        </select>
      </section>

      <section className="logs-summary-row">
        <div className="logs-summary-card">
          <span>Total Logs</span>
          <strong>{logs.length}</strong>
        </div>

        <div className="logs-summary-card">
          <span>Showing</span>
          <strong>{filteredLogs.length}</strong>
        </div>
      </section>

      <div className="logs-list">
        {loadingLogs && (
          <div className="logs-empty-state">
            Loading logs...
          </div>
        )}

        {!loadingLogs && logsError && (
          <div className="logs-error-state">
            <strong>Logs fetch error</strong>
            <p>{logsError}</p>
          </div>
        )}

        {!loadingLogs && !logsError && filteredLogs.length === 0 && (
          <div className="logs-empty-state">
            No logs found. Try uploading new media, adding a playlist schedule, or deleting a scheduled playlist first.
          </div>
        )}

        {!loadingLogs && !logsError && filteredLogs.map((log) => (
          <article className="log-card" key={log.id}>
            <div className="log-card-main">
              <div>
                <span className="log-action-badge">
                  {getActionLabel(log.action)}
                </span>

                <h3>{log.title || getActionLabel(log.action)}</h3>

                <p>{log.details || 'No details provided.'}</p>
              </div>

              <time>{formatDateTime(log.createdAt)}</time>
            </div>

            <div className="log-meta-grid">
              <div>
                <span>User</span>
                <strong>{log.userEmail || 'Unknown user'}</strong>
              </div>

              {log.displayName && (
                <div>
                  <span>Display</span>
                  <strong>{log.displayName}</strong>
                </div>
              )}

              {log.playlistName && (
                <div>
                  <span>Playlist</span>
                  <strong>{log.playlistName}</strong>
                </div>
              )}

              {log.fileName && (
                <div>
                  <span>File</span>
                  <strong>{log.fileName}</strong>
                </div>
              )}

              {log.category && (
                <div>
                  <span>Category</span>
                  <strong>{log.category}</strong>
                </div>
              )}

              {log.fileCount !== undefined && (
                <div>
                  <span>Files</span>
                  <strong>{log.fileCount}</strong>
                </div>
              )}

              {log.slideCount !== undefined && (
                <div>
                  <span>Slides</span>
                  <strong>{log.slideCount}</strong>
                </div>
              )}

              {log.scheduleStart && (
                <div>
                  <span>Schedule Start</span>
                  <strong>{formatScheduleTime(log.scheduleStart)}</strong>
                </div>
              )}

              {log.scheduleEnd && (
                <div>
                  <span>Schedule End</span>
                  <strong>{formatScheduleTime(log.scheduleEnd)}</strong>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default LogsPage;