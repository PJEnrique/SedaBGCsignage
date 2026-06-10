import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
import '../css/Dashboard.css';
import '../css/PlaylistManagerPage.css';

import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  DISPLAY_PAGES,
  MEDIA_CATEGORIES,
  getActivePlaylist,
} from '../utils/dashboardUtils';

import MediaCard from '../components/MediaCard';
import PlaylistPanel from '../components/PlaylistPanel';

function PlaylistManagerPage() {
  const [searchParams] = useSearchParams();

  const { mediaList, displayAssignments } = useDashboardData();
  const { currentUser } = useAuth();

  const [assigning, setAssigning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [slideDurations, setSlideDurations] = useState({});
  const [editingDisplay, setEditingDisplay] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState('');
  const [loadedEditKey, setLoadedEditKey] = useState('');

  const [playlistName, setPlaylistName] = useState('');
  const [playlistSchedule, setPlaylistSchedule] = useState({
    start: '',
    end: '',
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewMedia, setPreviewMedia] = useState(null);

  const filteredMedia = useMemo(() => {
    if (selectedCategory === 'All') return mediaList;
    return mediaList.filter((media) => media.category === selectedCategory);
  }, [mediaList, selectedCategory]);

  const totalPlaylistDuration = selectedMedia.reduce(
    (total, mediaId) => total + Number(slideDurations[mediaId] || 10),
    0
  );

  const previewSource =
    previewMedia?.url ||
    previewMedia?.fileData ||
    previewMedia?.imageData ||
    previewMedia?.src ||
    '';

  const previewName =
    previewMedia?.name ||
    previewMedia?.fileName ||
    previewMedia?.originalName ||
    previewMedia?.title ||
    'Untitled image';

  const previewType =
    previewMedia?.fileType ||
    previewMedia?.type ||
    'Image';

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
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  };

  const openPreview = (media) => {
    setPreviewMedia(media);
  };

  const closePreview = () => {
    setPreviewMedia(null);
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closePreview();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

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

  useEffect(() => {
    const displayName = searchParams.get('display');
    const playlistId = searchParams.get('playlistId');

    if (!displayName) return;
    if (!DISPLAY_PAGES.includes(displayName)) return;

    const editKey = `${displayName}-${playlistId || 'active'}`;
    if (loadedEditKey === editKey) return;

    const schedule = displayAssignments[displayName];
    const playlists = schedule?.playlists || [];

    if (playlists.length === 0) return;

    const selectedPlaylist = playlistId
      ? playlists.find((playlist) => playlist.id === playlistId)
      : getActivePlaylist(playlists) || playlists[0];

    if (!selectedPlaylist?.slides?.length) return;

    const mediaIds = selectedPlaylist.slides.map((slide) => slide.mediaId);
    const durations = {};

    selectedPlaylist.slides.forEach((slide) => {
      durations[slide.mediaId] = slide.duration || 10;
    });

    setEditingDisplay(displayName);
    setEditingPlaylistId(selectedPlaylist.id || '');
    setSelectedMedia(mediaIds);
    setSlideDurations(durations);
    setPlaylistName(selectedPlaylist.playlistName || `${displayName} Playlist`);
    setPlaylistSchedule({
      start: selectedPlaylist.scheduleStart || '',
      end: selectedPlaylist.scheduleEnd || '',
    });
    setLoadedEditKey(editKey);
  }, [displayAssignments, loadedEditKey, searchParams]);

  const handleCancelEditing = () => {
    const confirmCancel = window.confirm(
      'Cancel current playlist setup/editing? Unsaved changes will be removed.'
    );

    if (!confirmCancel) return;

    resetPlaylistBuilder();
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

      const displayRef = firestore.collection('displaySchedules').doc(displayName);
      const displayDoc = await displayRef.get();

      const existingPlaylists = displayDoc.exists
        ? displayDoc.data().playlists || []
        : [];

      if (editingDisplay && editingPlaylistId) {
        const playlistIndex = existingPlaylists.findIndex(
          (playlist) => playlist.id === editingPlaylistId
        );

        if (playlistIndex === -1) {
          alert('The playlist you are editing was not found. Please refresh and try again.');
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

        await addAuditLog({
          action: 'UPDATE_PLAYLIST_SCHEDULE',
          title: 'Updated scheduled playlist',
          details: `Updated "${updatedPlaylist.playlistName}" on ${displayName}.`,
          displayName,
          playlistName: updatedPlaylist.playlistName,
          slideCount: slides.length,
          scheduleStart: updatedPlaylist.scheduleStart,
          scheduleEnd: updatedPlaylist.scheduleEnd,
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

      await addAuditLog({
        action: 'ADD_PLAYLIST_SCHEDULE',
        title: 'Added scheduled playlist',
        details: `Added "${newPlaylist.playlistName}" to ${displayName}.`,
        displayName,
        playlistName: newPlaylist.playlistName,
        slideCount: slides.length,
        scheduleStart: newPlaylist.scheduleStart,
        scheduleEnd: newPlaylist.scheduleEnd,
      });

      alert(`Playlist added to ${displayName} successfully.`);
      resetPlaylistBuilder();
    } catch (error) {
      console.error('Assign error:', error);
      alert(`Failed to save playlist: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="dashboard-container playlist-manager-page">
      <h1 className="dashboard-title">Playlist Manager</h1>

      <div className="category-row">
        <label>Filter Media:</label>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          {MEDIA_CATEGORIES.map((category) => (
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
                {editingDisplay ? 'Edit Scheduled Playlist' : 'Create New Playlist'}
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
                onChange={(event) => setPlaylistName(event.target.value)}
              />
            </div>

            <div className="playlist-form-group">
              <label>Playlist Start</label>
              <input
                type="datetime-local"
                value={playlistSchedule.start}
                onChange={(event) =>
                  setPlaylistSchedule((prev) => ({
                    ...prev,
                    start: event.target.value,
                  }))
                }
              />
            </div>

            <div className="playlist-form-group">
              <label>Playlist End</label>
              <input
                type="datetime-local"
                value={playlistSchedule.end}
                onChange={(event) =>
                  setPlaylistSchedule((prev) => ({
                    ...prev,
                    end: event.target.value,
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
                {DISPLAY_PAGES.map((page) => (
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

            <button className="cancel-edit-button" onClick={handleCancelEditing}>
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
            handlePreview={openPreview}
          />
        ))}
      </div>

      {previewMedia && (
        <div
          className="playlist-preview-modal"
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
        >
          <div
            className="playlist-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="playlist-preview-header">
              <div>
                <h2>Image Preview</h2>
                <p>{previewName}</p>
              </div>

              <button
                type="button"
                className="playlist-preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="playlist-preview-image-wrap">
              {previewSource ? (
                <img src={previewSource} alt={previewName} />
              ) : (
                <div className="playlist-preview-placeholder">
                  No preview available
                </div>
              )}
            </div>

            <div className="playlist-preview-details">
              <span>Category: {previewMedia.category || 'Uncategorized'}</span>
              <span>Type: {previewType}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistManagerPage;