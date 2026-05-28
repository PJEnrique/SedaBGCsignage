import { useEffect, useState } from 'react';
import { firestore } from '../firebase';

export const useDashboardData = () => {
  const [mediaList, setMediaList] = useState([]);
  const [displayAssignments, setDisplayAssignments] = useState({});
  const [displayStatuses, setDisplayStatuses] = useState({});
  const [pairingCodes, setPairingCodes] = useState({});
  const [now, setNow] = useState(Date.now());

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
              category: data.category || 'Events',
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
      .collection('displaySchedules')
      .onSnapshot(
        (snapshot) => {
          const schedules = {};

          snapshot.docs.forEach((doc) => {
            const data = doc.data();

            schedules[doc.id] = {
              displayName: data.displayName || doc.id,
              playlists: Array.isArray(data.playlists)
                ? data.playlists
                : [],
              updatedAt: data.updatedAt || null,
            };
          });

          setDisplayAssignments(schedules);
        },
        (error) => {
          console.error('Error fetching display schedules:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayStatus')
      .onSnapshot(
        (snapshot) => {
          const statuses = {};

          snapshot.docs.forEach((doc) => {
            statuses[doc.id] = doc.data();
          });

          setDisplayStatuses(statuses);
        },
        (error) => {
          console.error('Error fetching display statuses:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('displayPairing')
      .onSnapshot(
        (snapshot) => {
          const codes = {};

          snapshot.docs.forEach((doc) => {
            const data = doc.data();

            if (data.displayName) {
              codes[data.displayName] = {
                code: doc.id,
                ...data,
              };
            }
          });

          setPairingCodes(codes);
        },
        (error) => {
          console.error('Error fetching pairing codes:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return {
    mediaList,
    displayAssignments,
    displayStatuses,
    pairingCodes,
    now,
  };
};