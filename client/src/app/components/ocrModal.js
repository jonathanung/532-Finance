"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from "next/navigation";
import styles from './ocr.modal.css';

export default function OCRModal({ onClose }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(500); // Increased from 300 to 500
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Expense form state
  const [expenseType, setExpenseType] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseTotal, setExpenseTotal] = useState('');
    const [expenseName, setExpenseName] = useState('');
    const [token, setToken] = useState(null);
    const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

    //make a useeffect here to grab all of the user's expenses and log them to the console
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const fetchExpenses = async () => {
                try {
                    const response = await axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/expenses`,
                        {
                            headers: {
                                Authorization: `Bearer ${storedToken}`
                            }
                        }
                    );
                    console.log(response.data);
                } catch (error) {
                    console.error('Error fetching expenses:', error);
                    if (error.response && error.response.status === 401) {
                        console.log('Unauthorized. Redirecting to login...');
                    }
                }
            };
            fetchExpenses();
        } else {
            console.error('No token found. User should be redirected to login.');
        }
    }, []);

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
        setCanvasSize(Math.min(size, 800)); // Set a maximum size of 800px
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
    setIsProcessing(true);

    if (!image) {
      setError('Please select an image');
      setIsProcessing(false);
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
      closeModal();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred during OCR processing');
    } finally {
      setIsProcessing(false);
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
    onClose();
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-[#A8AAC7] rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Add Expense</h2>
            <button onClick={onClose} className="text-white hover:text-gray-300">
              &times;
            </button>
          </div>

          <div className="bg-[#E3A7A9] rounded-lg p-4 mb-4">
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label htmlFor="expense-type" className="block text-white mb-1">Expense Type:</label>
                <input
                  id="expense-type"
                  type="text"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-white text-gray-800"
                />
              </div>
              <div>
                <label htmlFor="expense-date" className="block text-white mb-1">Date:</label>
                <input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-white text-gray-800"
                />
              </div>
              <div>
                <label htmlFor="expense-total" className="block text-white mb-1">Total:</label>
                <input
                  id="expense-total"
                  type="number"
                  step="0.01"
                  value={expenseTotal}
                  onChange={(e) => setExpenseTotal(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-white text-gray-800"
                />
              </div>
              <div>
                <label htmlFor="expense-name" className="block text-white mb-1">Expense Name:</label>
                <input
                  id="expense-name"
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-white text-gray-800"
                />
              </div>
              <button type="submit" className="w-full bg-[#A1C7BE] hover:bg-[#90b6ad] text-white font-bold py-2 px-4 rounded transition duration-200">
                Create Expense
              </button>
            </form>
          </div>

          <div className="bg-[#A1C7BE] rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-3">OCR Image Processing</h3>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="w-full text-white"
              />
              <button 
                type="submit" 
                className="w-full bg-[#E3A7A9] hover:bg-[#d89598] text-white font-bold py-2 px-4 rounded transition duration-200"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process Image'}
              </button>
            </form>
            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                <p className="text-white mt-2">Processing image, please wait...</p>
              </div>
            )}
            {imagePreview && (
              <div className="mt-4">
                <h4 className="text-white font-bold mb-2">Selected Image:</h4>
                <div className="relative w-full" style={{ height: `${canvasSize}px`, maxHeight: '70vh' }}> {/* Added maxHeight */}
                  <canvas
                    ref={canvasRef}
                    width={canvasSize}
                    height={canvasSize}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <div className="flex justify-center space-x-2 mt-2">
                  <button onClick={() => rotateImage(-90)} className="bg-[#E3A7A9] hover:bg-[#d89598] text-white font-bold py-1 px-2 rounded transition duration-200">
                    Rotate Left
                  </button>
                  <button onClick={() => rotateImage(90)} className="bg-[#E3A7A9] hover:bg-[#d89598] text-white font-bold py-1 px-2 rounded transition duration-200">
                    Rotate Right
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}