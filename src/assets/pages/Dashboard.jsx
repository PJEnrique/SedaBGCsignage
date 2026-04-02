import React, { useEffect, useState } from 'react';
import '../css/Dashboard.css';
import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [mediaList, setMediaList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const { currentUser } = useAuth();

  const displayPages = ['ABACA1', 'ABACA2', 'ABACA3', 'ABEL', 'JUSI'];

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
              url: data.fileData,
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

        if (file.size > 400 * 1024) {
          alert(`${file.name} is too large. Max size is 400KB.`);
          continue;
        }

        const base64Data = await convertToBase64(file);

        if (!base64Data) {
          alert(`Failed to read ${file.name}.`);
          continue;
        }

        if (base64Data.length > 800000) {
          alert(`${file.name} is too large for Firestore.`);
          continue;
        }

        const mediaData = {
          userEmail: currentUser.email || '',
          userId: currentUser.uid || '',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64Data,
          uploadedAt: new Date(),
        };

        await firestore.collection('uploads').add(mediaData);
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
    setSelectedMedia((prevSelected) =>
      prevSelected.includes(mediaId)
        ? prevSelected.filter((id) => id !== mediaId)
        : [...prevSelected, mediaId]
    );
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
      alert('Please select one photo.');
      return;
    }

    if (selectedMedia.length > 1) {
      alert('Only one photo can be assigned per display page.');
      return;
    }

    try {
      setAssigning(true);

      const selectedItem = mediaList.find((media) =>
        media.id === selectedMedia[0]
      );

      if (!selectedItem) {
        alert('Selected photo not found.');
        return;
      }

      await firestore.collection('displayAssignments').doc(displayName).set({
        displayName,
        assignedMedia: {
          mediaId: selectedItem.id,
          fileName: selectedItem.name,
          fileData: selectedItem.url,
          uploadedBy: selectedItem.uploadedBy || '',
          assignedAt: new Date(),
        },
        assignedBy: currentUser.email || '',
        assignedByUid: currentUser.uid || '',
        updatedAt: new Date(),
      });

      alert(`Assigned to ${displayName} successfully.`);
      setSelectedMedia([]);
    } catch (error) {
      console.error('Assign error:', error);
      alert(`Failed to assign media: ${error.message}`);
    } finally {
      setAssigning(false);
    }
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
      <h1 className="dashboard-title">Media Dashboard</h1>

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
              {deleting ? 'Deleting...' : `Delete Selected (${selectedMedia.length})`}
            </button>

            <div className="assign-buttons">
              {displayPages.map((page) => (
                <button
                  key={page}
                  className="assign-button"
                  onClick={() => handleAssignToDisplay(page)}
                  disabled={assigning}
                >
                  {assigning ? 'Assigning...' : `Assign to ${page}`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="media-container">
        {mediaList.length === 0 && (
          <p className="empty-text">No media uploaded yet.</p>
        )}

        {mediaList.map((media, index) => (
          <div
            className={`media-card ${selectedMedia.includes(media.id) ? 'selected' : ''}`}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;