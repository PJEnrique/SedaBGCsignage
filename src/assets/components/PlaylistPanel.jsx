import React from 'react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import SortablePlaylistItem from './SortablePlaylistItem';

function PlaylistPanel({
  selectedMedia,
  mediaList,
  slideDurations,
  handleDurationChange,
  handleDragEnd,
  removeFromPlaylist,
  handlePreview,
}) {
  const playlistItems = selectedMedia
    .map((mediaId) =>
      mediaList.find((media) => media.id === mediaId)
    )
    .filter(Boolean);

  if (playlistItems.length === 0) {
    return null;
  }

  return (
    <div className="playlist-panel">
      <h2>Playlist Order</h2>

      <p>
        Drag slides to change the display order. Long press a slide to preview.
      </p>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedMedia}
          strategy={verticalListSortingStrategy}
        >
          {playlistItems.map((media, index) => (
            <SortablePlaylistItem
              key={media.id}
              media={media}
              index={index}
              slideDurations={slideDurations}
              handleDurationChange={handleDurationChange}
              removeFromPlaylist={removeFromPlaylist}
              handlePreview={handlePreview}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default PlaylistPanel;