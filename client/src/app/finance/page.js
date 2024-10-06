"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { useRouter } from "next/navigation";
import OCRModal from '../components/ocrModal';
import Insights from '../components/insights';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FinancePage() {
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [income, setIncome] = useState(1000);
  const [expenses, setExpenses] = useState([]);
  const [token, setToken] = useState(null);
  const router = useRouter();

  const [pieData, setPieData] = useState({
    labels: ['Necessity', 'Want', 'Saving'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 2,
      },
    ],
  });

  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (token) fetchExpenses();
  }, [token]);

  useEffect(() => {
    updatePieChart();
  }, [expenses]);

  const updatePieChart = () => {
    const totalNecessitySpent = expenses
      .filter(expense => expense['expense-type'] === 'needs')
      .reduce((acc, expense) => acc + parseFloat(expense.expenseTotal), 0);
    const totalWantSpent = expenses
      .filter(expense => expense['expense-type'] === 'wants')
      .reduce((acc, expense) => acc + parseFloat(expense.expenseTotal), 0);
    const totalSavingSpent = expenses
      .filter(expense => expense['expense-type'] === 'savings')
      .reduce((acc, expense) => acc + parseFloat(expense.expenseTotal), 0);

    const totalSpent = totalNecessitySpent + totalWantSpent + totalSavingSpent;

    const necessityPercentage = totalSpent ? (totalNecessitySpent / totalSpent) * 100 : 0;
    const wantPercentage = totalSpent ? (totalWantSpent / totalSpent) * 100 : 0;
    const savingPercentage = totalSpent ? (totalSavingSpent / totalSpent) * 100 : 0;

    setPieData({
      labels: ['Necessity', 'Want', 'Saving'],
      datasets: [
        {
          data: [necessityPercentage, wantPercentage, savingPercentage],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          borderWidth: 2,
        }
      ],
    });
  };

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
      setExpenses(response.data);
      console.log('Fetched expenses:', response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleAddExpense = async (newExpense) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/expenses`,
        newExpense,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setExpenses(prevExpenses => [...prevExpenses, response.data]);
      console.log('Added new expense:', response.data);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const openOCR = () => setIsOCRModalOpen(true);
  const closeOCR = () => {
    setIsOCRModalOpen(false);
    fetchExpenses();
  };

  const openAddIncomeModal = () => setIsAddIncomeModalOpen(true);
  const closeAddIncomeModal = () => setIsAddIncomeModalOpen(false);

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/budget`,
        { budget: parseFloat(newBudget) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.status === 200) {
        alert('Budget updated successfully');
        setIncome(parseFloat(newBudget));
        closeAddIncomeModal();
      } else {
        alert(`Failed to update budget: ${response.data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('An error occurred while updating budget');
    }
  };

  return (
    <div className="ocr-page">
      <div className="chart-container">
        <div className="chart-header">
          <button 
            onClick={openAddIncomeModal}
            className="add-income-btn bg-[#A1C7BE] text-white rounded-md hover:bg-[#A8AAC7] transition px-4 py-2"
          >
            Add Income
          </button>
          <button
            onClick={openOCR}
            className="w-full bg-[#A1C7BE] hover:bg-[#90b6ad] text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Add Expenses
          </button>
        </div>
        
        <div className="pie-chart-box">
          <Pie data={pieData} key={JSON.stringify(pieData)} />
        </div>
      </div>

      <Insights token={token} />

      {isOCRModalOpen && (
        <OCRModal 
          onClose={closeOCR} 
          onAddExpense={handleAddExpense}
          token={token}
        />
      )}

      {isAddIncomeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-[#A8AAC7] mb-4">Update Budget</h2>
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label htmlFor="newBudget" className="block text-sm font-medium text-gray-700">New Budget</label>
                <input
                  type="number"
                  id="newBudget"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E3A7A9] focus:border-[#E3A7A9]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeAddIncomeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E3A7A9] text-white rounded-md hover:bg-[#d397a9] transition duration-300"
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .ocr-page {
          background-color: #E3A7A9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center; 
          padding: 20px;
        }

        .chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 2px solid #A8AAC7;
          padding: 20px;
          margin: 20px;
          width: 300px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .chart-header {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .add-income-btn, .add-expense-btn {
          cursor: pointer;
        }

        .pie-chart-box {
          width: 100%;
          max-width: 250px;
        }

        .insights-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 2px solid #A8AAC7;
          padding: 20px;
          margin: 20px;
          width: 300px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}