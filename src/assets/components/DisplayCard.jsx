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

    // If this playlist is not active anymore,
    // it was replaced by a newer active playlist.
    return 'expired';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'schedule-active';
    if (status === 'waiting') return 'schedule-waiting';
    return 'schedule-expired';
  };

  const getStatusLabel = (status, isMainActive = false) => {
    if (status === 'active') {
      return isMainActive ? '● Active Now' : '● Active';
    }

    if (status === 'waiting') {
      return '● Waiting';
    }

    return '● Expired';
  };

  const activePlaylistStatus = getPlaylistStatus({
    id: activePlaylistId,
    scheduleStart,
    scheduleEnd,
  });

  return (
    <div className="display-card">
      <div>
        <h3>{displayName}</h3>

        <p className={online ? 'status-online' : 'status-offline'}>
          {online ? '● Online' : '● Offline'}
        </p>

        <p>{slideCount} active slide(s)</p>

        {playlistName && (
          <p className="playlist-name">
            Active Playlist:
            <strong> {playlistName}</strong>
          </p>
        )}

        {(scheduleStart || scheduleEnd) && (
          <div className="playlist-schedule">
            <p>Active Schedule:</p>

            <small>
              Start:{' '}
              {scheduleStart
                ? new Date(scheduleStart).toLocaleString()
                : 'No start'}
            </small>

            <small>
              End:{' '}
              {scheduleEnd
                ? new Date(scheduleEnd).toLocaleString()
                : 'No end'}
            </small>

            <p className={getStatusClass(activePlaylistStatus)}>
              {getStatusLabel(activePlaylistStatus, true)}
            </p>
          </div>
        )}

        {scheduledPlaylists.length > 0 && (
          <div className="scheduled-playlists">
            <p>
              Scheduled Playlists:
              <strong> {scheduledPlaylists.length}</strong>
            </p>

            {scheduledPlaylists.map((playlist, index) => {
              const playlistStatus = getPlaylistStatus(playlist);

              return (
                <div
                  className="scheduled-playlist-item"
                  key={playlist.id || index}
                >
                  <div className="scheduled-playlist-header">
                    <strong>
                      {index + 1}. {playlist.playlistName}
                    </strong>

                    <span className={getStatusClass(playlistStatus)}>
                      {getStatusLabel(playlistStatus)}
                    </span>
                  </div>

                  <div className="scheduled-playlist-time">
                    <small>
                      Start:{' '}
                      {playlist.scheduleStart
                        ? new Date(playlist.scheduleStart).toLocaleString()
                        : 'No start'}
                    </small>

                    <small>
                      End:{' '}
                      {playlist.scheduleEnd
                        ? new Date(playlist.scheduleEnd).toLocaleString()
                        : 'No end'}
                    </small>
                  </div>

                  <small>
                    Slides: {playlist.slides?.length || 0}
                  </small>

                  <div className="scheduled-playlist-actions">
                    <button
                      className="edit-playlist-button"
                      onClick={() =>
                        handleEditDisplay(displayName, playlist.id)
                      }
                    >
                      Edit This Playlist
                    </button>

                    <button
                      className="delete-playlist-button"
                      onClick={() =>
                        handleDeleteScheduledPlaylist(displayName, playlist.id)
                      }
                    >
                      Delete Playlist
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pairCode && (
          <p className="pair-code-text">
            Pair Code: <strong>{pairCode}</strong>
          </p>
        )}
      </div>

      <div className="display-card-actions">
        <button onClick={() => openDisplay(displayName)}>
          Open
        </button>

        <button onClick={() => handleEditDisplay(displayName)}>
          Edit Active
        </button>

        <button
          className="pair-button"
          onClick={() => generatePairingCode(displayName)}
          disabled={generatingCode}
        >
          {generatingCode
            ? 'Generating...'
            : 'Generate Pair Code'}
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
      </div>
    </div>
  );
}

export default DisplayCard;