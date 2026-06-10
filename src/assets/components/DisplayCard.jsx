import React from 'react';

function DisplayCard({
  displayName,
  slideCount,
  online,
  pairCode,
  playlistName,
  scheduleStart,
  scheduleEnd,
  scheduledPlaylists = [],
  activePlaylistId,
  generatingCode,
  openDisplay,
  handleEditDisplay,
  generatePairingCode,
  copyPairingCode,
  handleClearDisplay,
  handleDeleteScheduledPlaylist,
}) {
  const formatDateTime = (value) => {
    if (!value) return 'No schedule';

    const date = new Date(value);

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

  const getPlaylistStatus = (playlist) => {
    const now = new Date();

    const start = playlist.scheduleStart
      ? new Date(playlist.scheduleStart)
      : null;

    const end = playlist.scheduleEnd
      ? new Date(playlist.scheduleEnd)
      : null;

    if (playlist.id === activePlaylistId) {
      return 'active';
    }

    if (start && now < start) {
      return 'waiting';
    }

    if (end && now > end) {
      return 'expired';
    }

    return 'expired';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'schedule-active';
    if (status === 'waiting') return 'schedule-waiting';
    return 'schedule-expired';
  };

  const getStatusLabel = (status, isMainActive = false) => {
    if (status === 'active') {
      return isMainActive ? 'Active Now' : 'Active';
    }

    if (status === 'waiting') {
      return 'Waiting';
    }

    return 'Expired';
  };

  const activePlaylistStatus = activePlaylistId
    ? getPlaylistStatus({
        id: activePlaylistId,
        scheduleStart,
        scheduleEnd,
      })
    : null;

  const displayInitial = displayName?.charAt(0)?.toUpperCase() || 'D';

  return (
    <article className={`display-card ${online ? 'is-online' : 'is-offline'}`}>
      <header className="display-card-header">
        <div className="display-identity">
          <div className="display-avatar">{displayInitial}</div>

          <div>
            <h3>{displayName}</h3>
            <p>Digital signage display</p>
          </div>
        </div>

        <span className={online ? 'status-online' : 'status-offline'}>
          {online ? 'Online' : 'Offline'}
        </span>
      </header>

      <section className="display-quick-stats">
        <div>
          <span>Active Slides</span>
          <strong>{slideCount}</strong>
        </div>

        <div>
          <span>Scheduled Playlists</span>
          <strong>{scheduledPlaylists.length}</strong>
        </div>
      </section>

      <section className="current-playback-box">
        <div className="section-title-row">
          <span>Current Playback</span>

          {activePlaylistStatus && (
            <small className={getStatusClass(activePlaylistStatus)}>
              {getStatusLabel(activePlaylistStatus, true)}
            </small>
          )}
        </div>

        {playlistName ? (
          <>
            <h4>{playlistName}</h4>

            <div className="schedule-time-grid">
              <div>
                <span>Start</span>
                <small>{formatDateTime(scheduleStart)}</small>
              </div>

              <div>
                <span>End</span>
                <small>{formatDateTime(scheduleEnd)}</small>
              </div>
            </div>
          </>
        ) : (
          <p className="display-muted-message">
            No active playlist assigned.
          </p>
        )}
      </section>

      <section className="scheduled-playlists-box">
        <div className="scheduled-playlists-title">
          <span>Scheduled Playlists</span>
          <strong>{scheduledPlaylists.length}</strong>
        </div>

        {scheduledPlaylists.length > 0 ? (
          <div className="scheduled-playlists">
            {scheduledPlaylists.map((playlist, index) => {
              const playlistStatus = getPlaylistStatus(playlist);

              return (
                <div
                  className="scheduled-playlist-item"
                  key={playlist.id || index}
                >
                  <div className="scheduled-playlist-header">
                    <div>
                      <strong>
                        {index + 1}. {playlist.playlistName || 'Untitled Playlist'}
                      </strong>

                      <small>
                        {playlist.slides?.length || 0} slide(s)
                      </small>
                    </div>

                    <span className={getStatusClass(playlistStatus)}>
                      {getStatusLabel(playlistStatus)}
                    </span>
                  </div>

                  <div className="scheduled-playlist-time">
                    <small>Start: {formatDateTime(playlist.scheduleStart)}</small>
                    <small>End: {formatDateTime(playlist.scheduleEnd)}</small>
                  </div>

                  <div className="scheduled-playlist-actions">
                    <button
                      className="edit-playlist-button"
                      onClick={() =>
                        handleEditDisplay(displayName, playlist.id)
                      }
                    >
                      Edit Playlist
                    </button>

                    <button
                      className="delete-playlist-button"
                      onClick={() =>
                        handleDeleteScheduledPlaylist(displayName, playlist.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="display-muted-message">
            No scheduled playlists.
          </p>
        )}
      </section>

      {pairCode && (
        <section className="pair-code-box">
          <span>Pair Code</span>
          <strong>{pairCode}</strong>
        </section>
      )}

      <footer className="display-card-actions">
        <button
          className="display-open-button"
          onClick={() => openDisplay(displayName)}
        >
          Open Display
        </button>

        <button
          className="display-edit-button"
          onClick={() => handleEditDisplay(displayName)}
        >
          Edit Active
        </button>

        <button
          className="pair-button"
          onClick={() => generatePairingCode(displayName)}
          disabled={generatingCode}
        >
          {generatingCode ? 'Generating...' : 'Pair Code'}
        </button>

        {pairCode && (
          <button
            className="copy-button"
            onClick={() => copyPairingCode(displayName)}
          >
            Copy Code
          </button>
        )}

        <button
          className="danger-button"
          onClick={() => handleClearDisplay(displayName)}
        >
          Clear All
        </button>
      </footer>
    </article>
  );
}

export default DisplayCard;