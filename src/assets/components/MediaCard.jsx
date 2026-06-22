import React, { useRef } from 'react';

function MediaCard({
  media,
  index,
  selectedMedia,
  handleCheckboxChange,
  handlePreview,
}) {
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const isSelected = selectedMedia.includes(media.id);
  const slideNumber = selectedMedia.indexOf(media.id) + 1;

  const imageSource =
    media.url ||
    media.fileData ||
    media.imageData ||
    '';

  const imageName =
    media.name ||
    media.fileName ||
    `Media ${index + 1}`;

  const imageCategory =
    media.category ||
    'Uncategorized';

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePressStart = (event) => {
    if (event.target.closest('.media-checkbox')) {
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

  const handleSelect = (event) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();

      setTimeout(() => {
        longPressTriggeredRef.current = false;
      }, 0);

      return;
    }

    handleCheckboxChange(media.id);
  };

  const handleCheckboxClick = (event) => {
    event.stopPropagation();
  };

  const handleCheckboxChangeLocal = (event) => {
    event.stopPropagation();
    handleCheckboxChange(media.id);
  };

  return (
    <div
      className={`media-card ${isSelected ? 'selected' : ''}`}
      key={media.id || index}
      onClick={handleSelect}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      {isSelected && (
        <div className="slide-order-badge">
          Slide {slideNumber}
        </div>
      )}

      <div
        className="media-checkbox"
        onClick={handleCheckboxClick}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChangeLocal}
        />
      </div>

      <button
        type="button"
        className="media-preview-trigger"
        title="Hold to preview image"
      >
        {imageSource ? (
          <img
            src={imageSource}
            alt={imageName}
          />
        ) : (
          <div className="media-image-placeholder">
            No Preview
          </div>
        )}

        <span className="media-preview-overlay">
          Hold to Preview
        </span>
      </button>

      <p
        className="media-name"
        title={imageName}
      >
        {imageName}
      </p>

      <p className="media-category">
        {imageCategory}
      </p>
    </div>
  );
}

export default MediaCard;