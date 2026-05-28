import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import '../css/display.css';

function DisplayPage({ displayName }) {
  const [displayData, setDisplayData] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [playlistActive, setPlaylistActive] = useState(true);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await firestore.collection('displayStatus').doc(displayName).set(
          {
            displayName,
            lastSeen: new Date(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error(`Heartbeat error for ${displayName}:`, error);
      }
    };

    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 5000);

    return () => clearInterval(interval);
  }, [displayName]);

  // Check schedule every 1 second so playlist switches on time.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getActivePlaylist = (playlists = [], currentTime = new Date()) => {
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

    // If schedules overlap, use the playlist with the latest start time.
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

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displaySchedules')
      .doc(displayName)
      .onSnapshot(
        (doc) => {
          if (!doc.exists) {
            setDisplayData(null);
            setSlides([]);
            setPlaylistActive(true);
            setActivePlaylistId(null);
            setCurrentSlideIndex(0);
            return;
          }

          setDisplayData(doc.data());
        },
        (error) => {
          console.error(`Error loading ${displayName}:`, error);
        }
      );

    return () => unsubscribe();
  }, [displayName]);

  useEffect(() => {
    const loadActivePlaylist = async () => {
      if (!displayData) {
        setSlides([]);
        setPlaylistActive(true);
        setActivePlaylistId(null);
        setCurrentSlideIndex(0);
        return;
      }

      const playlists = displayData.playlists || [];

      if (playlists.length === 0) {
        setSlides([]);
        setPlaylistActive(true);
        setActivePlaylistId(null);
        setCurrentSlideIndex(0);
        return;
      }

      const activePlaylist = getActivePlaylist(playlists, now);

      if (!activePlaylist) {
        setSlides([]);
        setPlaylistActive(false);
        setActivePlaylistId(null);
        setCurrentSlideIndex(0);
        return;
      }

      const newPlaylistId = activePlaylist.id;

      // Important:
      // Do not reload slides if the same playlist is still active.
      // This keeps slide duration accurate.
      if (newPlaylistId === activePlaylistId && playlistActive) {
        return;
      }

      try {
        const loadedSlides = await Promise.all(
          activePlaylist.slides.map(async (slide) => {
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
        setPlaylistActive(true);
        setActivePlaylistId(newPlaylistId);
        setCurrentSlideIndex(0);
      } catch (error) {
        console.error(`Error loading slides for ${displayName}:`, error);
        setSlides([]);
        setPlaylistActive(true);
        setActivePlaylistId(null);
        setCurrentSlideIndex(0);
      }
    };

    loadActivePlaylist();
  }, [displayData, now, displayName, activePlaylistId, playlistActive]);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (!playlistActive) return;

    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide) return;

    const duration = Number(currentSlide.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex + 1 >= slides.length ? 0 : prevIndex + 1
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [slides, currentSlideIndex, playlistActive]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="display-page">
      {!playlistActive ? (
        <h1 className="display-empty-text">
          {displayName} - No active playlist scheduled
        </h1>
      ) : !currentSlide ? (
        <h1 className="display-empty-text">
          {displayName} - No media assigned
        </h1>
      ) : (
        <div className="display-wrapper">
          <img
            key={currentSlide.mediaId || currentSlide.fileName}
            src={currentSlide.fileData}
            alt={currentSlide.fileName || displayName}
            className="display-image"
          />
        </div>
      )}
    </div>
  );
}

export default DisplayPage;