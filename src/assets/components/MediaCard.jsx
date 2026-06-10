import React from 'react';

function MediaCard({
  media,
  index,
  selectedMedia,
  handleCheckboxChange,
  handlePreview,
}) {
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

  const handleSelect = () => {
    handleCheckboxChange(media.id);
  };

  const handleCheckboxClick = (event) => {
    event.stopPropagation();
  };

  const handleCheckboxChangeLocal = (event) => {
    event.stopPropagation();
    handleCheckboxChange(media.id);
  };

  const handlePreviewClick = (event) => {
    event.stopPropagation();

    if (handlePreview) {
      handlePreview(media);
    }
  };

  return (
    <div
      className={`media-card ${isSelected ? 'selected' : ''}`}
      key={media.id || index}
      onClick={handleSelect}
    >
      {isSelected && (
        <div className="slide-order-badge">
          Slide {slideNumber}
        </div>
      )}

      <div
        className="media-checkbox"
        onClick={handleCheckboxClick}
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
        onClick={handlePreviewClick}
        title="Preview image"
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
          Preview
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