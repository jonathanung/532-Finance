"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OCRPage() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setRotation(0); // Reset rotation when a new image is selected

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const rotateImage = (degrees) => {
    const newRotation = (rotation + degrees + 360) % 360;
    setRotation(newRotation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!image) {
      setError('Please select an image');
      return;
    }

    const formData = new FormData();
    
    // If the image is rotated, we need to create a new rotated image file
    if (rotation !== 0) {
      const rotatedImage = await createRotatedImage();
      formData.append('image', rotatedImage);
    } else {
      formData.append('image', image);
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/ocr`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(response.data);
      setResult(response.data);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred during OCR processing');
    }
  };

  const createRotatedImage = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob((blob) => {
          resolve(new File([blob], 'rotated_image.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg');
      };
      img.src = imagePreview;
    });
  };

  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="ocr-page">
      <h1>OCR Image Processing</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <button type="submit">Process Image</button>
      </form>
      {imagePreview && (
        <div className="image-preview">
          <h2>Selected Image:</h2>
          <img 
            src={imagePreview} 
            alt="Selected" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }} 
          />
          <div className="rotation-controls">
            <button onClick={() => rotateImage(-90)}>Rotate Left</button>
            <button onClick={() => rotateImage(90)}>Rotate Right</button>
          </div>
        </div>
      )}
      {result && (
        <div className="result">
          <h2>OCR Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
