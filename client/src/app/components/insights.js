"use client";

import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function Insights({ token }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/insights`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setInsights(response.data.insights);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights('Error fetching insights');
    }
    setLoading(false);
  };

  return (
    <main className=" flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div className="flex gap-8 flex-wrap justify-center">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-6 py-3 bg-[#A1C7BE] text-white rounded-md hover:bg-[#A8AAC7] transition"
          >
            {loading ? 'Loading...' : 'Get Insights'}
          </button>
        </div>

        {insights && (
          <div className="w-full p-6 bg-white border border-gray-200 rounded-md shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-[#A8AAC7]">Your Insights</h2>
            <ReactMarkdown className="text-gray-700">{insights}</ReactMarkdown>
          </div>
        )}

        {!insights && (
          <div className="w-full p-6 bg-white border border-gray-200 rounded-md shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-[#A8AAC7]">User Insights</h2>
            <p className="text-gray-700">
              Discover valuable insights about your data and usage patterns.
              Click the &quot;Get Insights&quot; button above to see your personalized insights!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Insights;
