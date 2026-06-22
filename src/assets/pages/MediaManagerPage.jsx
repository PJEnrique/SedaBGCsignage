import React, { useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import '../css/Dashboard.css';
import '../css/MediaManagerPage.css';

import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { compressImage, convertToBase64 } from '../utils/imageCompressor';
import { MEDIA_CATEGORIES } from '../utils/dashboardUtils';

import MediaCard from '../components/MediaCard';

function MediaManagerPage() {
  const { mediaList } = useDashboardData();
  const { currentUser } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('Events');
  const [previewMedia, setPreviewMedia] = useState(null);

  const filteredMedia = useMemo(() => {
    if (selectedCategory === 'All') return mediaList;
    return mediaList.filter((media) => media.category === selectedCategory);
  }, [mediaList, selectedCategory]);

  const addAuditLog = async ({
    action,
    title,
    details,
    fileName = '',
    fileCount = 0,
    category = '',
  }) => {
    if (!currentUser) return;

    try {
      await firestore.collection('auditLogs').add({
        action,
        title,
        details,
        fileName,
        fileCount,
        category,
        userEmail: currentUser.email || '',
        userId: currentUser.uid || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  };

  const handleCheckboxChange = (mediaId) => {
    setSelectedMedia((prevSelected) => {
      const isSelected = prevSelected.includes(mediaId);

      if (isSelected) {
        return prevSelected.filter((id) => id !== mediaId);
      }

      return [...prevSelected, mediaId];
    });
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

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (!currentUser) {
      alert('No user is logged in.');
      return;
    }

    if (files.length === 0) return;

    setUploading(true);

    let uploadedCount = 0;

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
          name: file.name,
          fileName: file.name,
          fileType: file.type,
          type: file.type,
          fileSize: file.size,
          fileData: imageData,
          url: imageData,
          category: uploadCategory,
          uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        uploadedCount += 1;

        await addAuditLog({
          action: 'UPLOAD_MEDIA',
          title: 'Uploaded media',
          details: `Uploaded "${file.name}" to ${uploadCategory}.`,
          fileName: file.name,
          fileCount: 1,
          category: uploadCategory,
        });
      }

      if (uploadedCount > 0) {
        await addAuditLog({
          action: 'UPLOAD_MEDIA_BATCH',
          title: 'Uploaded media batch',
          details: `Uploaded ${uploadedCount} file(s) to ${uploadCategory}.`,
          fileCount: uploadedCount,
          category: uploadCategory,
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

      const selectedMediaItems = mediaList.filter((media) =>
        selectedMedia.includes(media.id)
      );

      for (const mediaId of selectedMedia) {
        await firestore.collection('uploads').doc(mediaId).delete();
      }

      await addAuditLog({
        action: 'DELETE_MEDIA',
        title: 'Deleted selected media',
        details: `Deleted ${selectedMedia.length} selected media file(s).`,
        fileName: selectedMediaItems
          .map((media) => media.name || media.fileName || 'Untitled image')
          .join(', '),
        fileCount: selectedMedia.length,
      });

      setSelectedMedia([]);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete selected media: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <div className="dashboard-container media-manager-page">
      <h1 className="dashboard-title">Media Library</h1>

      <div className="category-row">
        <label>Upload Category:</label>

        <select
          value={uploadCategory}
          onChange={(event) => setUploadCategory(event.target.value)}
        >
          {MEDIA_CATEGORIES.filter((category) => category !== 'All').map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label>Filter:</label>

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
            {deleting ? 'Deleting...' : `Delete Selected (${selectedMedia.length})`}
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
            handlePreview={openPreview}
          />
        ))}
      </div>

      {previewMedia && (
        <div
          className="media-preview-modal"
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
        >
          <div
            className="media-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="media-preview-header">
              <div>
                <h2>Image Preview</h2>
                <p>{previewName}</p>
              </div>

              <button
                type="button"
                className="media-preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="media-preview-image-wrap">
              {previewSource ? (
                <img
                  src={previewSource}
                  alt={previewName}
                />
              ) : (
                <div className="media-preview-placeholder">
                  No preview available
                </div>
              )}
            </div>

            <div className="media-preview-details">
              <span>Category: {previewMedia.category || 'Uncategorized'}</span>
              <span>Type: {previewType}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaManagerPage;