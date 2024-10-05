"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OCRPage() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    // Create a preview URL for the selected image
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!image) {
      setError('Please select an image');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

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
      setResult(response.data);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred during OCR processing');
    }
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
          <img src={imagePreview} alt="Selected" style={{ maxWidth: '100%', maxHeight: '300px' }} />
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
