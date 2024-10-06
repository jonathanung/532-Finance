'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


export default function UserPage() {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '', budget: '' });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [budget, setBudget] = useState('');
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [currentPig, setCurrentPig] = useState("/pig.png");
  const [pigPosition, setPigPosition] = useState(100);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserData(storedToken);
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentPig(prev => prev === "/pig.png" ? "/pig2.png" : "/pig.png");
    }, 500); // Switch every 500ms

    const moveInterval = setInterval(() => {
      setPigPosition(prev => {
        if (prev <= 0) return 100; // Reset to right side when reaching left edge
        return prev - 1; // Move left
      });
    }, 50); // Move every 50ms for smooth animation

    return () => {
      clearInterval(imageInterval);
      clearInterval(moveInterval);
    };
  }, [router]);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const userData = await response.json();
      setUser(userData);
      setBudget(userData.budget.toString());
      console.log(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('You are not logged in. Please log in and try again.');
      router.push('/login');
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change_password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          current_password: password,
          new_password: newPassword,
        }),
      });
      if (response.ok) {
        alert('Password updated successfully');
        setPassword('');
        setNewPassword('');
      } else {
        const errorData = await response.json();
        alert(`Failed to update password: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('An error occurred while updating password');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try { 
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete`, { method: 'DELETE' });
        if (response.ok) {
          alert('Account deleted successfully');
          router.push('/login'); // Redirect to login page after deletion
        } else {
          alert('Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting account');
      }
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending budget update:', { budget: parseFloat(budget) });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ budget: parseFloat(budget) }),
      });
      const data = await response.json();
      console.log('Response:', data);
      if (response.ok) {
        alert(data.message);
        setBudget(data.budget.toString());
      } else {
        alert(`Failed to update budget: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('An error occurred while updating budget');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3A7A9] to-purple-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div 
        className="absolute bottom-0 transition-all duration-50 ease-linear"
        style={{ right: `${pigPosition}%`, transform: `scaleX(-1)` }}
      >
        <Image src={currentPig} alt="Walking Pig" width={100} height={100} />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-[#A8AAC7] px-6 py-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">User Settings</h1>
              <div className="mt-2 text-white">
                <p>Welcome back, {user.first_name}!</p>
                <p className="text-sm opacity-80">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/default')}
              className="px-4 py-2 bg-[#E3A7A9] text-white rounded-md hover:bg-[#d397a9] transition duration-300"
            >
              Back to Home
            </button>
          </div>

          <div className="p-6 space-y-8">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-[#A8AAC7] mb-4">Update Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#A1C7BE] focus:border-[#A1C7BE]"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#A1C7BE] focus:border-[#A1C7BE]"
                  />
                </div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#A1C7BE] hover:bg-[#91b7ae] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A1C7BE]">
                  Update Password
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-[#A8AAC7] mb-4">Update Budget</h2>
              <form onSubmit={handleUpdateBudget} className="space-y-4">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">New Budget</label>
                  <input
                    type="number"
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E3A7A9] focus:border-[#E3A7A9]"
                  />
                </div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#E3A7A9] hover:bg-[#d397a9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E3A7A9]">
                  Update Budget
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold text-[#A8AAC7] mb-4">Delete Account</h2>
              <p className="text-sm text-gray-600 mb-4">Warning: This action cannot be undone. Please be certain.</p>
              <button
                onClick={handleDeleteAccount}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
              >
                Delete Account
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}