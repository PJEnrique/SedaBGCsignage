import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import '../css/display.css';

const HEARTBEAT_INTERVAL_MS = 60000;
const SCHEDULE_CHECK_INTERVAL_MS = 10000;

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

  return activePlaylists.sort((a, b) => {
    const bPriority = getPlaylistPriorityTime(b);
    const aPriority = getPlaylistPriorityTime(a);

    return bPriority - aPriority;
  })[0];
};

const serializeDate = (value) => {
  if (!value) return '';

  if (value.toDate) {
    return value.toDate().toISOString();
  }

  const date = new Date(value);
  const time = date.getTime();

  return Number.isNaN(time) ? '' : date.toISOString();
};

const getPlaylistSignature = (playlist) => {
  if (!playlist) return '';

  return JSON.stringify({
    id: playlist.id || '',
    playlistName: playlist.playlistName || '',
    scheduleStart: playlist.scheduleStart || '',
    scheduleEnd: playlist.scheduleEnd || '',
    createdAt: serializeDate(playlist.createdAt),
    updatedAt: serializeDate(playlist.updatedAt),
    slides: (playlist.slides || []).map((slide) => ({
      mediaId: slide.mediaId || '',
      duration: Number(slide.duration || 10),
    })),
  });
};

function DisplayPage({ displayName }) {
  const [displayData, setDisplayData] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [playlistActive, setPlaylistActive] = useState(true);
  const [activePlaylistSignature, setActivePlaylistSignature] = useState('');
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

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [displayName]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, SCHEDULE_CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

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
            setActivePlaylistSignature('');
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
    let cancelled = false;

    const resetDisplay = () => {
      setSlides([]);
      setPlaylistActive(true);
      setActivePlaylistSignature('');
      setCurrentSlideIndex(0);
    };

    const loadActivePlaylist = async () => {
      if (!displayData) {
        resetDisplay();
        return;
      }

      const playlists = displayData.playlists || [];

      if (playlists.length === 0) {
        resetDisplay();
        return;
      }

      const activePlaylist = getActivePlaylist(playlists, now);

      if (!activePlaylist) {
        setSlides([]);
        setPlaylistActive(false);
        setActivePlaylistSignature('');
        setCurrentSlideIndex(0);
        return;
      }

      const newPlaylistSignature = getPlaylistSignature(activePlaylist);

      if (newPlaylistSignature === activePlaylistSignature && playlistActive) {
        return;
      }

      try {
        const loadedSlides = await Promise.all(
          (activePlaylist.slides || []).map(async (slide) => {
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

        if (cancelled) return;

        const validSlides = loadedSlides.filter(Boolean);

        setSlides(validSlides);
        setPlaylistActive(true);
        setActivePlaylistSignature(newPlaylistSignature);
        setCurrentSlideIndex(0);
      } catch (error) {
        if (cancelled) return;

        console.error(`Error loading slides for ${displayName}:`, error);

        setSlides([]);
        setPlaylistActive(true);
        setActivePlaylistSignature('');
        setCurrentSlideIndex(0);
      }
    };

    loadActivePlaylist();

    return () => {
      cancelled = true;
    };
  }, [
    displayData,
    now,
    displayName,
    activePlaylistSignature,
    playlistActive,
  ]);

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
            key={`${currentSlide.mediaId}-${activePlaylistSignature}`}
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