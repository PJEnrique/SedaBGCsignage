export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
};

export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      reject(
        new Error(
          'GIF compression is not supported. Please compress GIF manually below 700KB.'
        )
      );
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
    };

    img.onerror = () => reject(new Error('Failed to load image.'));

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1600;

      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.75;
      let compressed = canvas.toDataURL('image/jpeg', quality);

      while (compressed.length > 900000 && quality > 0.35) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }

      if (compressed.length > 900000) {
        reject(
          new Error(
            `${file.name} is still too large after compression. Please compress it manually.`
          )
        );
        return;
      }

      resolve(compressed);
    };

    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });
};