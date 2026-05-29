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

    if (end && now > end) {
      return 'expired';
    }

    if (start && now < start) {
      return 'waiting';
    }

    if (!end && start && now > start) {
      return 'expired';
    }

    return 'expired';
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

        {scheduleStart && scheduleEnd && (
          <div className="playlist-schedule">
            <p>Active Schedule:</p>

            <small>{new Date(scheduleStart).toLocaleString()}</small>
            <small>to</small>
            <small>{new Date(scheduleEnd).toLocaleString()}</small>

            <p
              className={
                activePlaylistStatus === 'active'
                  ? 'schedule-active'
                  : activePlaylistStatus === 'waiting'
                  ? 'schedule-waiting'
                  : 'schedule-expired'
              }
            >
              {activePlaylistStatus === 'active'
                ? '● Active Now'
                : activePlaylistStatus === 'waiting'
                ? '● Waiting'
                : '● Expired'}
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

                    <span
                      className={
                        playlistStatus === 'active'
                          ? 'schedule-active'
                          : playlistStatus === 'waiting'
                          ? 'schedule-waiting'
                          : 'schedule-expired'
                      }
                    >
                      {playlistStatus === 'active'
                        ? '● Active'
                        : playlistStatus === 'waiting'
                        ? '● Waiting'
                        : '● Expired'}
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

                  <button
                    className="edit-playlist-button"
                    onClick={() =>
                      handleEditDisplay(displayName, playlist.id)
                    }
                  >
                    Edit This Playlist
                  </button>
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
          Clear
        </button>
      </div>
    </div>
  );
}

export default DisplayCard;