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
        async (doc) => {
          if (!doc.exists) {
            setSlides([]);
            setCurrentSlideIndex(0);
            return;
          }

          const data = doc.data();

          if (!Array.isArray(data.slides) || data.slides.length === 0) {
            setSlides([]);
            setCurrentSlideIndex(0);
            return;
          }

          try {
            const loadedSlides = await Promise.all(
              data.slides.map(async (slide) => {
                if (!slide.mediaId) return null;

                const mediaDoc = await firestore
                  .collection('uploads')
                  .doc(slide.mediaId)
                  .get();

                if (!mediaDoc.exists) return null;

                const mediaData = mediaDoc.data();

                return {
                  mediaId: slide.mediaId,
                  fileName: mediaData.fileName,
                  fileData: mediaData.fileURL || mediaData.fileData,
                  duration: Number(slide.duration || 10),
                };
              })
            );

            const validSlides = loadedSlides.filter(Boolean);

            setSlides(validSlides);
            setCurrentSlideIndex(0);
          } catch (error) {
            console.error(
              `Error loading slides for ${displayName}:`,
              error
            );

            setSlides([]);
            setCurrentSlideIndex(0);
          }
        },
        (error) => {
          console.error(
            `Error loading ${displayName}:`,
            error
          );
        }
      );

    return () => unsubscribe();
  }, [displayName]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];

    if (!currentSlide) return;

    const duration =
      Number(currentSlide.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex + 1 >= slides.length
          ? 0
          : prevIndex + 1
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
            key={
              currentSlide.mediaId ||
              currentSlide.fileName
            }
            src={currentSlide.fileData}
            alt={
              currentSlide.fileName ||
              displayName
            }
            className="display-image"
          />
        </div>
      )}
    </div>
  );
}

export default DisplayPage;