import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import '../css/display.css';

function DisplayPage({ displayName }) {
  const [assignedMedia, setAssignedMedia] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayAssignments')
      .doc(displayName)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setAssignedMedia(data.assignedMedia || null);
          } else {
            setAssignedMedia(null);
          }
        },
        (error) => {
          console.error(`Error loading ${displayName}:`, error);
        }
      );

    return () => unsubscribe();
  }, [displayName]);

  return (
    <div className="display-page">
      {!assignedMedia ? (
        <h1 className="display-empty-text">
          {displayName} - No media assigned
        </h1>
      ) : (
        <div className="display-wrapper">
          <img
            src={assignedMedia.fileData}
            alt={assignedMedia.fileName}
            className="display-image"
          />
        </div>
      )}
    </div>
  );
}

export default DisplayPage;