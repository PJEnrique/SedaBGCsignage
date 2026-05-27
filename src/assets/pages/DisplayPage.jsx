import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import '../css/display.css';

function DisplayPage({ displayName }) {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayAssignments')
      .doc(displayName)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();

            if (Array.isArray(data.slides) && data.slides.length > 0) {
              setSlides(data.slides);
              setCurrentSlideIndex(0);
            } else if (data.assignedMedia) {
              setSlides([
                {
                  ...data.assignedMedia,
                  duration: 10,
                },
              ]);
              setCurrentSlideIndex(0);
            } else {
              setSlides([]);
            }
          } else {
            setSlides([]);
          }
        },
        (error) => {
          console.error(`Error loading ${displayName}:`, error);
        }
      );

    return () => unsubscribe();
  }, [displayName]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];
    const duration = Number(currentSlide.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex + 1 >= slides.length ? 0 : prevIndex + 1
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [slides, currentSlideIndex]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="display-page">
      {!currentSlide ? (
        <h1 className="display-empty-text">
          {displayName} - No media assigned
        </h1>
      ) : (
        <div className="display-wrapper">
          <img
            src={currentSlide.fileData}
            alt={currentSlide.fileName}
            className="display-image"
          />
        </div>
      )}
    </div>
  );
}

export default DisplayPage;