"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from "next/navigation";
export default function OCRPage() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(300);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Expense form state
  const [expenseType, setExpenseType] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseTotal, setExpenseTotal] = useState('');
    const [expenseName, setExpenseName] = useState('');
    const [token, setToken] = useState(null);
    const router = useRouter();
useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/user`,
            { 
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
        //   setUser(response.data);
        //   router.push("/testocr");
        } catch (error) {
          console.error("Token validation failed:", error);
          if (error.response && error.response.status === 401) {
              handleLogout();
              router.push("/");
          }
        }
      }
    };

    validateToken();
}, [token]);
    

    //make a useeffect here to grab all of the user's expenses and log them to the console
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/expenses`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };

        fetchExpenses();
    }, [token]);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setRotation(0);

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

  useEffect(() => {
    if (imagePreview) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        const size = Math.max(img.width, img.height);
        setCanvasSize(size);
      };
      img.src = imagePreview;
    }
  }, [imagePreview]);

  useEffect(() => {
    if (imageRef.current) {
      drawRotatedImage();
    }
  }, [rotation, canvasSize]);

  const rotateImage = (degrees) => {
    setRotation((prevRotation) => (prevRotation + degrees + 360) % 360);
  };

  const drawRotatedImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = -img.width / 2 * scale;
    const y = -img.height / 2 * scale;
    
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.restore();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOcrResult(null);

    if (!image) {
      setError('Please select an image');
      return;
    }

    const formData = new FormData();
    
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
      setOcrResult(response.data);
      populateExpenseForm(response.data);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred during OCR processing');
    }
  };

  const createRotatedImage = () => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const originalType = image.type; // Get the original image type

      // Determine the MIME type and file extension
      let mimeType, fileExtension;
      switch (originalType) {
        case 'image/png':
          mimeType = 'image/png';
          fileExtension = 'png';
          break;
        case 'image/webp':
          mimeType = 'image/webp';
          fileExtension = 'webp';
          break;
        default:
          // Default to JPEG for unsupported types
          mimeType = 'image/jpeg';
          fileExtension = 'jpg';
      }

      canvas.toBlob((blob) => {
        resolve(new File([blob], `rotated_image.${fileExtension}`, { type: mimeType }));
      }, mimeType);
    });
  };

  const populateExpenseForm = (ocrData) => {
    // Directly set the values from the ocrData object
    setExpenseType(ocrData['expense-type'] || '');
    setExpenseDate(ocrData.date || '');
    setExpenseTotal((ocrData.total[0] === "$" ? parseFloat(ocrData.total.slice(1)) : parseFloat(ocrData.total)) || '');    
    setExpenseName(ocrData['expense-name'] || '');
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
      try {
          console.log({ expenseType, expenseDate, expenseTotal, expenseName });
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/expenses`,
        {
        expenseType,
        expenseDate,
        expenseTotal: parseFloat(expenseTotal),
        expenseName
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        }
      );
      console.log('Expense submitted successfully:', response.data);
      // Clear form after successful submission
      setExpenseType('');
      setExpenseDate('');
      setExpenseTotal('');
      setExpenseName('');
      // You might want to show a success message to the user here
    } catch (error) {
      console.error('Error submitting expense:', error);
      setError(error.response?.data?.detail || 'An error occurred while submitting the expense');
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split(/[/.-]/);
    return `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  return (
    <div className="ocr-page">
      <div className="ocr-section">
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
            <div className="canvas-container" style={{ width: `${canvasSize}px`, height: `${canvasSize}px`, margin: '0 auto' }}>
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </div>
            <div className="rotation-controls">
              <button type="button" onClick={() => rotateImage(-90)}>Rotate Left</button>
              <button type="button" onClick={() => rotateImage(90)}>Rotate Right</button>
            </div>
          </div>
        )}
        {ocrResult && (
          <div className="ocr-result">
            <h2>OCR Result:</h2>
            <pre>{JSON.stringify(ocrResult, null, 2)}</pre>
          </div>
        )}
      </div>
      <div className="expense-form-section">
        <h2>Create Expense</h2>
        <form onSubmit={handleExpenseSubmit}>
          <div>
            <label htmlFor="expense-type">Expense Type:</label>
            <input
              id="expense-type"
              type="text"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="expense-date">Date:</label>
            <input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="expense-total">Total:</label>
            <input
              id="expense-total"
              type="number"
              step="0.01"
              value={expenseTotal}
              onChange={(e) => setExpenseTotal(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="expense-name">Expense Name:</label>
            <input
              id="expense-name"
              type="text"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Expense</button>
        </form>
      </div>
    </div>
  );
}