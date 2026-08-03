import React, { useEffect, useRef } from 'react';
import * as PANOLENS from 'panolens'; // Import Panolens.js

const PanolensViewer = ({ imageUrl }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create a new viewer
      const viewer = new PANOLENS.Viewer({
        container: containerRef.current, // Attach to this container
      });

      // Create a panorama using the image URL (360-degree image)
      const panorama = new PANOLENS.ImagePanorama(imageUrl);

      // Add panorama to the viewer
      viewer.add(panorama);
    }

    // Cleanup: destroy viewer when component unmounts
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Clean up the DOM
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '400px' }} // Adjust the container size
    />
  );
};

export default PanolensViewer;
