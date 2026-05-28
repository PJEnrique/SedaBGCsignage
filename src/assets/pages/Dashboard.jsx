import React, { useEffect, useState } from 'react';
import '../css/Dashboard.css';
import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [mediaList, setMediaList] = useState([]);
  const [displayAssignments, setDisplayAssignments] = useState({});
  const [displayStatuses, setDisplayStatuses] = useState({});
  const [now, setNow] = useState(Date.now());
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [slideDurations, setSlideDurations] = useState({});
  const [editingDisplay, setEditingDisplay] = useState('');
  const { currentUser } = useAuth();

  const displayPages = ['ABACA1', 'ABACA2', 'ABACA3', 'ABEL', 'JUSI', 'LOBBY'];

  useEffect(() => {
    const unsubscribe = firestore
      .collection('uploads')
      .orderBy('uploadedAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const uploads = snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              url: data.fileURL || data.fileData,
              name: data.fileName,
              uploadedBy: data.userEmail,
              uploadedAt: data.uploadedAt,
              userId: data.userId,
            };
          });

          setMediaList(uploads);
        },
        (error) => {
          console.error('Error fetching uploads:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayAssignments')
      .onSnapshot((snapshot) => {
        const assignments = {};

        snapshot.docs.forEach((doc) => {
          assignments[doc.id] = doc.data();
        });

        setDisplayAssignments(assignments);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayStatus')
      .onSnapshot((snapshot) => {
        const statuses = {};

        snapshot.docs.forEach((doc) => {
          statuses[doc.id] = doc.data();
        });

        setDisplayStatuses(statuses);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const isDisplayOnline = (displayName) => {
    const status = displayStatuses[displayName];

    if (!status || !status.lastSeen) return false;

    const lastSeenDate = status.lastSeen.toDate
      ? status.lastSeen.toDate()
      : new Date(status.lastSeen);

    const diff = now - lastSeenDate.getTime();

    return diff <= 15000;
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/gif') {
        reject(
          new Error(
            'GIF compression is not supported. Please compress GIF manually below 700KB.'
          )
        );
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target.result;
      };

      img.onerror = () => reject(new Error('Failed to load image.'));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.75;
        let compressed = canvas.toDataURL('image/jpeg', quality);

        while (compressed.length > 900000 && quality > 0.35) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        if (compressed.length > 900000) {
          reject(
            new Error(
              `${file.name} is still too large after compression. Please compress it manually.`
            )
          );
          return;
        }

        resolve(compressed);
      };

      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(file);
    });
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
        const updatedDurations = { ...slideDurations };
        delete updatedDurations[mediaId];
        setSlideDurations(updatedDurations);

        return prevSelected.filter((id) => id !== mediaId);
      }

      setSlideDurations((prev) => ({
        ...prev,
        [mediaId]: prev[mediaId] || 10,
      }));

      return [...prevSelected, mediaId];
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

      setSelectedMedia([]);
      setSlideDurations({});
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

      await firestore.collection('displayAssignments').doc(displayName).set({
        displayName,
        slides,
        assignedBy: currentUser.email || '',
        assignedByUid: currentUser.uid || '',
        updatedAt: new Date(),
      });

      alert(`Slideshow saved to ${displayName} successfully.`);
      setEditingDisplay('');
      setSelectedMedia([]);
      setSlideDurations({});
    } catch (error) {
      console.error('Assign error:', error);
      alert(`Failed to assign media: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleEditDisplay = (displayName) => {
    const assignment = displayAssignments[displayName];

    if (!assignment?.slides?.length) {
      alert(`${displayName} has no slideshow to edit.`);
      return;
    }

    const mediaIds = assignment.slides.map((slide) => slide.mediaId);
    const durations = {};

    assignment.slides.forEach((slide) => {
      durations[slide.mediaId] = slide.duration || 10;
    });

    setEditingDisplay(displayName);
    setSelectedMedia(mediaIds);
    setSlideDurations(durations);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleClearDisplay = async (displayName) => {
    const confirmClear = window.confirm(`Clear all slides from ${displayName}?`);

    if (!confirmClear) return;

    try {
      await firestore.collection('displayAssignments').doc(displayName).delete();

      alert(`${displayName} cleared successfully.`);
    } catch (error) {
      console.error('Clear display error:', error);
      alert(`Failed to clear display: ${error.message}`);
    }
  };

  const openDisplay = (displayName) => {
    window.open(`${window.location.origin}/user/${displayName}`, '_blank');
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Signage Dashboard</h1>

      <div className="display-manager">
        {displayPages.map((displayName) => {
          const assignment = displayAssignments[displayName];
          const slideCount = assignment?.slides?.length || 0;
          const online = isDisplayOnline(displayName);

          return (
            <div className="display-card" key={displayName}>
              <div>
                <h3>{displayName}</h3>

                <p className={online ? 'status-online' : 'status-offline'}>
                  {online ? '● Online' : '● Offline'}
                </p>

                <p>{slideCount} slide(s)</p>
              </div>

              <div className="display-card-actions">
                <button onClick={() => openDisplay(displayName)}>
                  Open
                </button>

                <button onClick={() => handleEditDisplay(displayName)}>
                  Edit
                </button>

                <button
                  className="danger-button"
                  onClick={() => handleClearDisplay(displayName)}
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
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
                    : `Assign to ${page}`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {editingDisplay && (
        <div className="editing-banner">
          Editing slideshow for <strong>{editingDisplay}</strong>
        </div>
      )}

      <div className="media-container">
        {mediaList.length === 0 && (
          <p className="empty-text">No media uploaded yet.</p>
        )}

        {mediaList.map((media, index) => (
          <div
            className={`media-card ${
              selectedMedia.includes(media.id) ? 'selected' : ''
            }`}
            key={media.id || index}
            onClick={() => handleCheckboxChange(media.id)}
          >
            <div
              className="media-checkbox"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selectedMedia.includes(media.id)}
                onChange={() => handleCheckboxChange(media.id)}
              />
            </div>

            <img src={media.url} alt={media.name} />

            <p className="media-name" title={media.name}>
              {media.name}
            </p>

            {selectedMedia.includes(media.id) && (
              <div
                className="duration-editor"
                onClick={(e) => e.stopPropagation()}
              >
                <label>Duration</label>

                <input
                  type="number"
                  min="1"
                  value={slideDurations[media.id] || 10}
                  onChange={(e) =>
                    handleDurationChange(media.id, e.target.value)
                  }
                />

                <span>sec</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;