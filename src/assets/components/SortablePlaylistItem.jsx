import React from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePlaylistItem({
  media,
  index,
  slideDurations,
  handleDurationChange,
  removeFromPlaylist,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="playlist-item"
    >
      <div
        className="playlist-drag-handle"
        {...attributes}
        {...listeners}
      >
        ☰
      </div>

      <img
        src={media.url}
        alt={media.name}
        className="playlist-thumb"
      />

      <div className="playlist-info">
        <strong>
          Slide {index + 1}
        </strong>

        <span>{media.name}</span>

        <div className="playlist-duration-editor">
          <label>Duration</label>

          <input
            type="number"
            min="1"
            value={slideDurations[media.id] || 10}
            onChange={(e) =>
              handleDurationChange(
                media.id,
                e.target.value
              )
            }
          />

          <span>sec</span>
        </div>
      </div>

      <button
        className="playlist-remove"
        onClick={() =>
          removeFromPlaylist(media.id)
        }
      >
        Remove
      </button>
    </div>
  );
}

export default SortablePlaylistItem;