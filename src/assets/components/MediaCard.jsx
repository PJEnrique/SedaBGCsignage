import React from 'react';

function MediaCard({
  media,
  index,
  selectedMedia,
  handleCheckboxChange,
}) {
  const isSelected = selectedMedia.includes(media.id);

  const slideNumber =
    selectedMedia.indexOf(media.id) + 1;

  return (
    <div
      className={`media-card ${
        isSelected ? 'selected' : ''
      }`}
      key={media.id || index}
      onClick={() =>
        handleCheckboxChange(media.id)
      }
    >
      {isSelected && (
        <div className="slide-order-badge">
          Slide {slideNumber}
        </div>
      )}

      <div
        className="media-checkbox"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() =>
            handleCheckboxChange(media.id)
          }
        />
      </div>

      <img
        src={media.url}
        alt={media.name}
      />

      <p
        className="media-name"
        title={media.name}
      >
        {media.name}
      </p>

      <p className="media-category">
        {media.category}
      </p>
    </div>
  );
}

export default MediaCard;