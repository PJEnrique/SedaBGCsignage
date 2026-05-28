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

  const [playlistName, setPlaylistName] = useState('');
  const [playlistSchedule, setPlaylistSchedule] = useState({
    start: '',
    end: '',
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('Events');

  const displayPages = ['ABACA1', 'ABACA2', 'ABACA3', 'ABEL', 'JUSI', 'LOBBY'];
  const categories = ['All', 'Events', 'Promotions', 'Meetings', 'Lobby'];

  const filteredMedia =
    selectedCategory === 'All'
      ? mediaList
      : mediaList.filter((media) => media.category === selectedCategory);

  const resetPlaylistBuilder = () => {
    setEditingDisplay('');
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
      const aStart = a.scheduleStart
        ? new Date(a.scheduleStart).getTime()
        : 0;

      const bStart = b.scheduleStart
        ? new Date(b.scheduleStart).getTime()
        : 0;

      return bStart - aStart;
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

  const handleCheckboxChange = (mediaId) => {
    setSelectedMedia((prevSelected) => {
      const isSelected = prevSelected.includes(mediaId);

      if (isSelected) {
        removeFromPlaylist(mediaId);
        return prevSelected;
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

  const removeFromPlaylist = (mediaId) => {
    setSelectedMedia((prev) => prev.filter((id) => id !== mediaId));

    setSlideDurations((prev) => {
      const updated = { ...prev };
      delete updated[mediaId];
      return updated;
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

    try {
      setAssigning(true);

      const slides = selectedMedia.map((mediaId) => ({
        mediaId,
        duration: Number(slideDurations[mediaId] || 10),
      }));

      const newPlaylist = {
        id: Date.now().toString(),
        playlistName: playlistName || `${displayName} Playlist`,
        scheduleStart: playlistSchedule.start || null,
        scheduleEnd: playlistSchedule.end || null,
        slides,
        assignedBy: currentUser.email || '',
        assignedByUid: currentUser.uid || '',
        createdAt: new Date(),
      };

      const displayRef = firestore
        .collection('displaySchedules')
        .doc(displayName);

      const displayDoc = await displayRef.get();

      if (!displayDoc.exists) {
        await displayRef.set({
          displayName,
          playlists: [newPlaylist],
          updatedAt: new Date(),
        });
      } else {
        const data = displayDoc.data();
        const existingPlaylists = data.playlists || [];

        await displayRef.update({
          playlists: [...existingPlaylists, newPlaylist],
          updatedAt: new Date(),
        });
      }

      alert(`Playlist added to ${displayName} successfully.`);
      resetPlaylistBuilder();
    } catch (error) {
      console.error('Assign error:', error);
      alert(`Failed to assign playlist: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleEditDisplay = (displayName) => {
    const schedule = displayAssignments[displayName];
    const playlists = schedule?.playlists || [];

    const activePlaylist = getActivePlaylist(playlists) || playlists[0];

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
    setSelectedMedia(mediaIds);
    setSlideDurations(durations);
    setPlaylistName(activePlaylist.playlistName || `${displayName} Playlist`);
    setPlaylistSchedule({
      start: activePlaylist.scheduleStart || '',
      end: activePlaylist.scheduleEnd || '',
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
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
        <div className="playlist-settings">
          <input
            type="text"
            placeholder="Playlist Name"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />

          <div className="playlist-schedule-row">
            <div>
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

            <div>
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

          <button
            className="cancel-edit-button"
            onClick={handleCancelEditing}
          >
            {editingDisplay ? 'Cancel Editing' : 'Cancel Playlist Setup'}
          </button>
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
          <>
            <button
              className="delete-selected-button"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting
                ? 'Deleting...'
                : `Delete Selected (${selectedMedia.length})`}
            </button>

            <div className="assign-buttons">
              {displayPages.map((page) => (
                <button
                  key={page}
                  className={
                    editingDisplay === page
                      ? 'assign-button editing'
                      : 'assign-button'
                  }
                  onClick={() => handleAssignToDisplay(page)}
                  disabled={assigning}
                >
                  {assigning
                    ? 'Saving...'
                    : editingDisplay === page
                    ? `Save Changes to ${page}`
                    : `Add Playlist to ${page}`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {editingDisplay && (
        <div className="editing-banner">
          <span>
            Editing playlist for <strong>{editingDisplay}</strong>
          </span>

          <button
            className="cancel-edit-button"
            onClick={handleCancelEditing}
          >
            Cancel Editing
          </button>
        </div>
      )}

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