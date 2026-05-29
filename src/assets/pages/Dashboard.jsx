import React, { useState } from 'react';
import '../css/Dashboard.css';
import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';

import { arrayMove } from '@dnd-kit/sortable';

import { useDashboardData } from '../hooks/useDashboardData';
import { compressImage, convertToBase64 } from '../utils/imageCompressor';

import DisplayCard from '../components/DisplayCard';
import MediaCard from '../components/MediaCard';
import PlaylistPanel from '../components/PlaylistPanel';

function Dashboard() {
  const {
    mediaList,
    displayAssignments,
    displayStatuses,
    pairingCodes,
    now,
  } = useDashboardData();

  const { currentUser } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState([]);
  const [slideDurations, setSlideDurations] = useState({});
  const [editingDisplay, setEditingDisplay] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState('');

  const [playlistName, setPlaylistName] = useState('');
  const [playlistSchedule, setPlaylistSchedule] = useState({
    start: '',
    end: '',
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('Events');

  const displayPages = ['ABACA1', 'ABACA2', 'ABACA3', 'ABEL', 'JUSI', 'LOBBY'];
  const categories = [
    'All',
    'Events',
    'Promotions',
    'Meetings',
    'Lobby',
    'Local Folder',
  ];

  const filteredMedia =
    selectedCategory === 'All'
      ? mediaList
      : mediaList.filter((media) => media.category === selectedCategory);

  const totalPlaylistDuration = selectedMedia.reduce(
    (total, mediaId) => total + Number(slideDurations[mediaId] || 10),
    0
  );

  const resetPlaylistBuilder = () => {
    setEditingDisplay('');
    setEditingPlaylistId('');
    setSelectedMedia([]);
    setSlideDurations({});
    setPlaylistName('');
    setPlaylistSchedule({
      start: '',
      end: '',
    });
  };

  const handleCancelEditing = () => {
    const confirmCancel = window.confirm(
      'Cancel current playlist setup/editing? Unsaved changes will be removed.'
    );

    if (!confirmCancel) return;

    resetPlaylistBuilder();
  };

  const isDisplayOnline = (displayName) => {
    const status = displayStatuses[displayName];

    if (!status || !status.lastSeen) return false;

    const lastSeenDate = status.lastSeen.toDate
      ? status.lastSeen.toDate()
      : new Date(status.lastSeen);

    const diff = now - lastSeenDate.getTime();

    return diff <= 15000;
  };

  const getDateTime = (value) => {
    if (!value) return 0;

    if (value.toDate) {
      return value.toDate().getTime();
    }

    const date = new Date(value);
    const time = date.getTime();

    return Number.isNaN(time) ? 0 : time;
  };

  const getPlaylistPriorityTime = (playlist) => {
    const scheduleStartTime = getDateTime(playlist.scheduleStart);

    if (scheduleStartTime) {
      return scheduleStartTime;
    }

    const updatedAtTime = getDateTime(playlist.updatedAt);

    if (updatedAtTime) {
      return updatedAtTime;
    }

    const createdAtTime = getDateTime(playlist.createdAt);

    if (createdAtTime) {
      return createdAtTime;
    }

    const idTime = Number(playlist.id);

    return Number.isNaN(idTime) ? 0 : idTime;
  };

  const getActivePlaylist = (playlists = []) => {
    const currentTime = new Date();

    const activePlaylists = playlists.filter((playlist) => {
      const start = playlist.scheduleStart
        ? new Date(playlist.scheduleStart)
        : null;

      const end = playlist.scheduleEnd
        ? new Date(playlist.scheduleEnd)
        : null;

      if (start && currentTime < start) return false;
      if (end && currentTime > end) return false;

      return true;
    });

    if (activePlaylists.length === 0) return null;

    return activePlaylists.sort((a, b) => {
      const bPriority = getPlaylistPriorityTime(b);
      const aPriority = getPlaylistPriorityTime(a);

      return bPriority - aPriority;
    })[0];
  };

  const generatePairingCode = async (displayName) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    try {
      setGeneratingCode(true);

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
      setGeneratingCode(false);
    }
  };

  const copyPairingCode = (displayName) => {
    const code = pairingCodes[displayName]?.code;

    if (!code) return;

    navigator.clipboard.writeText(code);
    alert('Pairing code copied.');
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not a valid image or GIF file.`);
          continue;
        }

        let imageData;

        if (file.type === 'image/gif') {
          const base64Data = await convertToBase64(file);

          if (base64Data.length > 900000) {
            alert(`${file.name} is too large. Please compress the GIF below 700KB.`);
            continue;
          }

          imageData = base64Data;
        } else {
          imageData = await compressImage(file);
        }

        await firestore.collection('uploads').add({
          userEmail: currentUser.email || '',
          userId: currentUser.uid || '',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: imageData,
          category: uploadCategory,
          uploadedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload media: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeFromPlaylist = (mediaId) => {
    setSelectedMedia((prev) => prev.filter((id) => id !== mediaId));

    setSlideDurations((prev) => {
      const updated = { ...prev };
      delete updated[mediaId];
      return updated;
    });
  };

  const handleCheckboxChange = (mediaId) => {
    setSelectedMedia((prevSelected) => {
      const isSelected = prevSelected.includes(mediaId);

      if (isSelected) {
        setSlideDurations((prev) => {
          const updated = { ...prev };
          delete updated[mediaId];
          return updated;
        });

        return prevSelected.filter((id) => id !== mediaId);
      }

      setSlideDurations((prev) => ({
        ...prev,
        [mediaId]: prev[mediaId] || 10,
      }));

      return [...prevSelected, mediaId];
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelectedMedia((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleDurationChange = (mediaId, value) => {
    setSlideDurations((prev) => ({
      ...prev,
      [mediaId]: value,
    }));
  };

  const handleDeleteSelected = async () => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    if (selectedMedia.length === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedMedia.length} selected file(s)?`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      for (const mediaId of selectedMedia) {
        await firestore.collection('uploads').doc(mediaId).delete();
      }

      resetPlaylistBuilder();
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete selected media: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignToDisplay = async (displayName) => {
    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    if (selectedMedia.length === 0) {
      alert('Please select at least one photo.');
      return;
    }

    if (editingDisplay && displayName !== editingDisplay) {
      alert(
        `You are currently editing a playlist for ${editingDisplay}. Please save it to ${editingDisplay} or cancel editing first.`
      );
      return;
    }

    try {
      setAssigning(true);

      const slides = selectedMedia.map((mediaId) => ({
        mediaId,
        duration: Number(slideDurations[mediaId] || 10),
      }));

      const displayRef = firestore
        .collection('displaySchedules')
        .doc(displayName);

      const displayDoc = await displayRef.get();

      const existingPlaylists = displayDoc.exists
        ? displayDoc.data().playlists || []
        : [];

      if (editingDisplay && editingPlaylistId) {
        const playlistIndex = existingPlaylists.findIndex(
          (playlist) => playlist.id === editingPlaylistId
        );

        if (playlistIndex === -1) {
          alert(
            'The playlist you are editing was not found. Please refresh and try again.'
          );
          return;
        }

        const existingPlaylist = existingPlaylists[playlistIndex];

        const updatedPlaylist = {
          ...existingPlaylist,
          playlistName: playlistName || `${displayName} Playlist`,
          scheduleStart: playlistSchedule.start || null,
          scheduleEnd: playlistSchedule.end || null,
          slides,
          updatedBy: currentUser.email || '',
          updatedByUid: currentUser.uid || '',
          updatedAt: new Date(),
        };

        const updatedPlaylists = [...existingPlaylists];
        updatedPlaylists[playlistIndex] = updatedPlaylist;

        await displayRef.update({
          playlists: updatedPlaylists,
          updatedAt: new Date(),
        });

        alert(`Playlist updated on ${displayName} successfully.`);
        resetPlaylistBuilder();
        return;
      }

      const newPlaylist = {
        id: Date.now().toString(),
        playlistName: playlistName || `${displayName} Playlist`,
        scheduleStart: playlistSchedule.start || null,
        scheduleEnd: playlistSchedule.end || null,
        slides,
        assignedBy: currentUser.email || '',
        assignedByUid: currentUser.uid || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!displayDoc.exists) {
        await displayRef.set({
          displayName,
          playlists: [newPlaylist],
          updatedAt: new Date(),
        });
      } else {
        await displayRef.update({
          playlists: [...existingPlaylists, newPlaylist],
          updatedAt: new Date(),
        });
      }

      alert(`Playlist added to ${displayName} successfully.`);
      resetPlaylistBuilder();
    } catch (error) {
      console.error('Assign error:', error);
      alert(`Failed to save playlist: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleEditDisplay = (displayName, playlistId = null) => {
    const schedule = displayAssignments[displayName];
    const playlists = schedule?.playlists || [];

    const activePlaylist = playlistId
      ? playlists.find((playlist) => playlist.id === playlistId)
      : getActivePlaylist(playlists) || playlists[0];

    if (!activePlaylist?.slides?.length) {
      alert(`${displayName} has no playlist to edit.`);
      return;
    }

    const mediaIds = activePlaylist.slides.map((slide) => slide.mediaId);
    const durations = {};

    activePlaylist.slides.forEach((slide) => {
      durations[slide.mediaId] = slide.duration || 10;
    });

    setEditingDisplay(displayName);
    setEditingPlaylistId(activePlaylist.id || '');
    setSelectedMedia(mediaIds);
    setSlideDurations(durations);
    setPlaylistName(activePlaylist.playlistName || `${displayName} Playlist`);
    setPlaylistSchedule({
      start: activePlaylist.scheduleStart || '',
      end: activePlaylist.scheduleEnd || '',
    });

    setTimeout(() => {
      const editor = document.querySelector('.playlist-settings');
      if (editor) {
        editor.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  const handleClearDisplay = async (displayName) => {
    const confirmClear = window.confirm(
      `Clear all scheduled playlists from ${displayName}?`
    );

    if (!confirmClear) return;

    try {
      await firestore.collection('displaySchedules').doc(displayName).delete();
      alert(`${displayName} schedules cleared successfully.`);
    } catch (error) {
      console.error('Clear display error:', error);
      alert(`Failed to clear display schedules: ${error.message}`);
    }
  };

  const handleDeleteScheduledPlaylist = async (displayName, playlistId) => {
    if (!playlistId) {
      alert('Playlist ID is missing.');
      return;
    }

    const confirmDelete = window.confirm(
      `Delete this scheduled playlist from ${displayName}?`
    );

    if (!confirmDelete) return;

    try {
      const displayRef = firestore
        .collection('displaySchedules')
        .doc(displayName);

      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        alert(`${displayName} has no scheduled playlists.`);
        return;
      }

      const existingPlaylists = displayDoc.data().playlists || [];

      const updatedPlaylists = existingPlaylists.filter(
        (playlist) => playlist.id !== playlistId
      );

      if (updatedPlaylists.length === existingPlaylists.length) {
        alert('Playlist was not found.');
        return;
      }

      if (updatedPlaylists.length === 0) {
        await displayRef.delete();
      } else {
        await displayRef.update({
          playlists: updatedPlaylists,
          updatedAt: new Date(),
        });
      }

      if (editingDisplay === displayName && editingPlaylistId === playlistId) {
        resetPlaylistBuilder();
      }

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
    <div className="dashboard-container">
      <h1 className="dashboard-title">Signage Dashboard</h1>

      <div className="display-manager">
        {displayPages.map((displayName) => {
          const schedule = displayAssignments[displayName];
          const playlists = schedule?.playlists || [];
          const activePlaylist = getActivePlaylist(playlists);
          const activePlaylistId = activePlaylist?.id;

          const slideCount = activePlaylist?.slides?.length || 0;
          const online = isDisplayOnline(displayName);
          const pairCode = pairingCodes[displayName]?.code;

          return (
            <DisplayCard
              key={displayName}
              displayName={displayName}
              slideCount={slideCount}
              online={online}
              pairCode={pairCode}
              playlistName={activePlaylist?.playlistName}
              scheduleStart={activePlaylist?.scheduleStart}
              scheduleEnd={activePlaylist?.scheduleEnd}
              scheduledPlaylists={playlists}
              activePlaylistId={activePlaylistId}
              generatingCode={generatingCode}
              openDisplay={openDisplay}
              handleEditDisplay={handleEditDisplay}
              generatePairingCode={generatePairingCode}
              copyPairingCode={copyPairingCode}
              handleClearDisplay={handleClearDisplay}
              handleDeleteScheduledPlaylist={handleDeleteScheduledPlaylist}
            />
          );
        })}
      </div>

      <div className="category-row">
        <label>Upload Category:</label>

        <select
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value)}
        >
          {categories
            .filter((category) => category !== 'All')
            .map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
        </select>

        <label>Filter:</label>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {selectedMedia.length > 0 && (
        <div
          className={
            editingDisplay
              ? 'playlist-settings playlist-settings-edit-mode'
              : 'playlist-settings'
          }
        >
          <div className="playlist-settings-header">
            <div>
              <span
                className={
                  editingDisplay
                    ? 'playlist-mode-badge edit'
                    : 'playlist-mode-badge create'
                }
              >
                {editingDisplay ? 'EDIT MODE' : 'CREATE MODE'}
              </span>

              <h2>
                {editingDisplay
                  ? 'Edit Scheduled Playlist'
                  : 'Create New Playlist'}
              </h2>

              <p>
                {editingDisplay
                  ? 'Changes will update the selected scheduled playlist only.'
                  : 'Select media, arrange the playlist, set schedule, then assign it to a display.'}
              </p>
            </div>

            {editingDisplay && (
              <div className="editing-target-card">
                <span>Target Display</span>
                <strong>{editingDisplay}</strong>
              </div>
            )}
          </div>

          {editingDisplay && (
            <div className="edit-notice">
              You are editing:
              <strong> {playlistName || `${editingDisplay} Playlist`}</strong>
            </div>
          )}

          <div className="playlist-form-grid">
            <div className="playlist-form-group playlist-form-full">
              <label>Playlist Name</label>
              <input
                type="text"
                placeholder="Enter playlist name"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
            </div>

            <div className="playlist-form-group">
              <label>Playlist Start</label>
              <input
                type="datetime-local"
                value={playlistSchedule.start}
                onChange={(e) =>
                  setPlaylistSchedule((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
              />
            </div>

            <div className="playlist-form-group">
              <label>Playlist End</label>
              <input
                type="datetime-local"
                value={playlistSchedule.end}
                onChange={(e) =>
                  setPlaylistSchedule((prev) => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="playlist-summary-row">
            <div className="playlist-summary-card">
              <span>Selected Slides</span>
              <strong>{selectedMedia.length}</strong>
            </div>

            <div className="playlist-summary-card">
              <span>Total Duration</span>
              <strong>{totalPlaylistDuration} sec</strong>
            </div>

            {editingDisplay && (
              <div className="playlist-summary-card">
                <span>Update Type</span>
                <strong>Replace Current</strong>
              </div>
            )}
          </div>

          <div className="playlist-settings-actions">
            {editingDisplay ? (
              <button
                className="save-edit-button"
                onClick={() => handleAssignToDisplay(editingDisplay)}
                disabled={assigning}
              >
                {assigning ? 'Saving Changes...' : 'Save Playlist Changes'}
              </button>
            ) : (
              <div className="assign-buttons">
                {displayPages.map((page) => (
                  <button
                    key={page}
                    className="assign-button"
                    onClick={() => handleAssignToDisplay(page)}
                    disabled={assigning}
                  >
                    {assigning ? 'Saving...' : `Add Playlist to ${page}`}
                  </button>
                ))}
              </div>
            )}

            <button
              className="cancel-edit-button"
              onClick={handleCancelEditing}
            >
              {editingDisplay ? 'Cancel Editing' : 'Cancel Playlist Setup'}
            </button>
          </div>
        </div>
      )}

      <PlaylistPanel
        selectedMedia={selectedMedia}
        mediaList={mediaList}
        slideDurations={slideDurations}
        handleDurationChange={handleDurationChange}
        handleDragEnd={handleDragEnd}
        removeFromPlaylist={removeFromPlaylist}
      />

      <div className="action-buttons">
        <label className="upload-label">
          {uploading ? 'Uploading...' : 'Upload Images / GIF'}

          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif"
            onChange={handleUpload}
            hidden
          />
        </label>

        {selectedMedia.length > 0 && (
          <button
            className="delete-selected-button"
            onClick={handleDeleteSelected}
            disabled={deleting}
          >
            {deleting
              ? 'Deleting...'
              : `Delete Selected (${selectedMedia.length})`}
          </button>
        )}
      </div>

      <div className="media-container">
        {filteredMedia.length === 0 && (
          <p className="empty-text">No media found.</p>
        )}

        {filteredMedia.map((media, index) => (
          <MediaCard
            key={media.id || index}
            media={media}
            index={index}
            selectedMedia={selectedMedia}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;