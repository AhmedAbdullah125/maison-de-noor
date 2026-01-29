import React, { useState, useEffect } from 'react';
import { FALLBACK_IMAGE_URL } from '../constants';

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // Can be extended with custom fallback if needed in future
}

const AppImage: React.FC<AppImageProps> = ({ src, alt, onError, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(FALLBACK_IMAGE_URL);
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <img
      src={currentSrc || FALLBACK_IMAGE_URL}
      alt={alt || ''}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

export default AppImage;