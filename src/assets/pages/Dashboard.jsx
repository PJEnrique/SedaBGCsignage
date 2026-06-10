import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Dashboard.css';
import '../css/DashboardOverview.css';

import { useDashboardData } from '../hooks/useDashboardData';
import {
  DISPLAY_PAGES,
  getActivePlaylist,
  isDisplayOnline,
} from '../utils/dashboardUtils';

function Dashboard() {
  const {
    mediaList,
    displayAssignments,
    displayStatuses,
    pairingCodes,
    now,
    loadingMedia,
    loadingSchedules,
    loadingStatuses,
    loadingPairingCodes,
  } = useDashboardData();

  const onlineDisplays = DISPLAY_PAGES.filter((displayName) =>
    isDisplayOnline(displayStatuses, displayName, now)
  ).length;

  const totalScheduledPlaylists = DISPLAY_PAGES.reduce((total, displayName) => {
    const playlists = displayAssignments[displayName]?.playlists || [];
    return total + playlists.length;
  }, 0);

  const activePlaylists = DISPLAY_PAGES.filter((displayName) => {
    const playlists = displayAssignments[displayName]?.playlists || [];
    return Boolean(getActivePlaylist(playlists, now));
  }).length;

  const pairingCodeCount = Object.keys(pairingCodes || {}).length;

  const offlineDisplays = DISPLAY_PAGES.length - onlineDisplays;

  return (
    <div className="dashboard-container dashboard-overview-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Control Center</span>
          <h1 className="dashboard-title dashboard-title-clean">
            Signage Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Manage media, playlists, display assignments, and player pairing from one place.
          </p>
        </div>

        <div className="dashboard-hero-status">
          <span className="dashboard-status-dot"></span>
          <div>
            <strong>{onlineDisplays}</strong>
            <small>Online Displays</small>
          </div>
        </div>
      </section>

      <section className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <span>Total Displays</span>
          <strong>{DISPLAY_PAGES.length}</strong>
          <small>{offlineDisplays} offline</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Media Files</span>
          <strong>{loadingMedia ? '...' : mediaList.length}</strong>
          <small>{loadingMedia ? 'Loading media' : 'Ready to use'}</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Scheduled Playlists</span>
          <strong>{loadingSchedules ? '...' : totalScheduledPlaylists}</strong>
          <small>{loadingSchedules ? 'Loading schedules' : `${activePlaylists} active`}</small>
        </div>

        <div className="dashboard-stat-card">
          <span>Pairing Codes</span>
          <strong>{loadingPairingCodes ? '...' : pairingCodeCount}</strong>
          <small>{loadingPairingCodes ? 'Loading codes' : 'Available codes'}</small>
        </div>
      </section>

      <section className="dashboard-module-grid">
        <article className="dashboard-module-card dashboard-module-media">
          <div className="dashboard-module-top">
            <div className="dashboard-module-icon">M</div>
            <span className="dashboard-module-label">Library</span>
          </div>

          <h3>Media Library</h3>

          <p className="dashboard-module-count">
            {loadingMedia
              ? 'Loading media...'
              : `${mediaList.length} loaded media file(s)`}
          </p>

          <p className="dashboard-module-description">
            Upload images and GIFs, organize media categories, and prepare files for signage playlists.
          </p>

          <Link className="dashboard-module-button media" to="/user/media">
            Open Media
          </Link>
        </article>

        <article className="dashboard-module-card dashboard-module-playlist">
          <div className="dashboard-module-top">
            <div className="dashboard-module-icon">P</div>
            <span className="dashboard-module-label">Scheduling</span>
          </div>

          <h3>Playlist Manager</h3>

          <p className="dashboard-module-count">
            {loadingSchedules
              ? 'Loading playlists...'
              : `${totalScheduledPlaylists} scheduled playlist(s)`}
          </p>

          <p className="dashboard-module-description">
            Create playlists, arrange slide order, set duration, schedule dates, and assign to displays.
          </p>

          <Link className="dashboard-module-button playlist" to="/user/playlists">
            Open Playlists
          </Link>
        </article>

        <article className="dashboard-module-card dashboard-module-display">
          <div className="dashboard-module-top">
            <div className="dashboard-module-icon">D</div>
            <span className="dashboard-module-label">Monitoring</span>
          </div>

          <h3>Display Manager</h3>

          <p className="dashboard-module-count">
            {loadingStatuses
              ? 'Checking display status...'
              : `${onlineDisplays} of ${DISPLAY_PAGES.length} display(s) online`}
          </p>

          <p className="dashboard-module-description">
            Monitor display status, view assigned playlists, edit schedules, and remove outdated playlists.
          </p>

          <Link className="dashboard-module-button display" to="/user/displays">
            Open Displays
          </Link>
        </article>

        <article className="dashboard-module-card dashboard-module-pairing">
          <div className="dashboard-module-top">
            <div className="dashboard-module-icon">C</div>
            <span className="dashboard-module-label">Connection</span>
          </div>

          <h3>Player Pairing</h3>

          <p className="dashboard-module-count">
            {loadingPairingCodes
              ? 'Loading pairing codes...'
              : `${pairingCodeCount} available pairing code(s)`}
          </p>

          <p className="dashboard-module-description">
            Generate and copy pairing codes for connecting display players to the signage system.
          </p>

          <Link className="dashboard-module-button pairing" to="/user/pairing">
            Open Pairing
          </Link>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;