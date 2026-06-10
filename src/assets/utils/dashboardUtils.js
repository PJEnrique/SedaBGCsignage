export const DISPLAY_PAGES = ['ABACA1', 'ABACA2', 'ABACA3', 'ABEL', 'JUSI', 'LOBBY'];

export const MEDIA_CATEGORIES = [
  'All',
  'Events',
  'Promotions',
  'Meetings',
  'Lobby',
  'Local Folder',
];

export const DISPLAY_ONLINE_THRESHOLD_MS = 120000;

export const getDateTime = (value) => {
  if (!value) return 0;

  if (value.toDate) {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  const time = date.getTime();

  return Number.isNaN(time) ? 0 : time;
};

export const getPlaylistPriorityTime = (playlist) => {
  if (!playlist) return 0;

  const scheduleStartTime = getDateTime(playlist.scheduleStart);

  if (scheduleStartTime) return scheduleStartTime;

  const updatedAtTime = getDateTime(playlist.updatedAt);

  if (updatedAtTime) return updatedAtTime;

  const createdAtTime = getDateTime(playlist.createdAt);

  if (createdAtTime) return createdAtTime;

  const idTime = Number(playlist.id);

  return Number.isNaN(idTime) ? 0 : idTime;
};

export const getActivePlaylist = (playlists = []) => {
  const currentTime = new Date();

  const activePlaylists = playlists.filter((playlist) => {
    const start = playlist.scheduleStart ? new Date(playlist.scheduleStart) : null;
    const end = playlist.scheduleEnd ? new Date(playlist.scheduleEnd) : null;

    if (start && currentTime < start) return false;
    if (end && currentTime > end) return false;

    return true;
  });

  if (activePlaylists.length === 0) return null;

  return [...activePlaylists].sort((a, b) => {
    const bPriority = getPlaylistPriorityTime(b);
    const aPriority = getPlaylistPriorityTime(a);

    return bPriority - aPriority;
  })[0];
};

export const isDisplayOnline = (displayStatuses, displayName, now) => {
  const status = displayStatuses[displayName];

  if (!status || !status.lastSeen) return false;

  const lastSeenDate = status.lastSeen.toDate
    ? status.lastSeen.toDate()
    : new Date(status.lastSeen);

  const diff = now - lastSeenDate.getTime();

  return diff <= DISPLAY_ONLINE_THRESHOLD_MS;
};
