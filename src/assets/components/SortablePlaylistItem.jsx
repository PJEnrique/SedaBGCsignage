import React, { useRef } from 'react';
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
  handlePreview,
}) {
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

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

  const imageSource =
    media.url ||
    media.fileData ||
    media.imageData ||
    '';

  const imageName =
    media.name ||
    media.fileName ||
    `Slide ${index + 1}`;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePressStart = (event) => {
    if (
      event.target.closest('.playlist-drag-handle') ||
      event.target.closest('.playlist-remove') ||
      event.target.closest('.playlist-duration-editor')
    ) {
      return;
    }

    longPressTriggeredRef.current = false;
    clearLongPressTimer();

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;

      if (handlePreview) {
        handlePreview(media);
      }
    }, 650);
  };

  const handlePressEnd = () => {
    clearLongPressTimer();
  };

  const handleItemClick = (event) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();

      setTimeout(() => {
        longPressTriggeredRef.current = false;
      }, 0);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="playlist-item"
      onClick={handleItemClick}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="playlist-drag-handle"
        {...attributes}
        {...listeners}
      >
        ☰
      </div>

      {imageSource ? (
        <img
          src={imageSource}
          alt={imageName}
          className="playlist-thumb"
          title="Long press to preview"
        />
      ) : (
        <div className="playlist-thumb playlist-thumb-empty">
          No Preview
        </div>
      )}

      <div className="playlist-info">
        <strong>
          Slide {index + 1}
        </strong>

        <span>{imageName}</span>

        <div className="playlist-duration-editor">
          <label>Duration</label>

          <input
            type="number"
            min="1"
            value={slideDurations[media.id] || 10}
            onChange={(event) =>
              handleDurationChange(
                media.id,
                event.target.value
              )
            }
          />

          <span>sec</span>
        </div>
      </div>

      <button
        type="button"
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