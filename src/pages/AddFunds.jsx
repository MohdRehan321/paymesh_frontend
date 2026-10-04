import React, { useState, useEffect } from 'react';
import '../stylesheets/sendMoney.scss';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddFunds = () => {
  const { user } = useAuth();
  const userId = user?.id ?? user?.userId ?? user?.sub;

  const [formData, setFormData] = useState({
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorDescription, setErrorDescription] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [creditedAmount, setCreditedAmount] = useState('');

  useEffect(() => {
    if (userId) {
      fetchWalletBalance();
    }
  }, [userId]);

  const fetchWalletBalance = async () => {
    try {
      const response = await api.get(`/api/v1/wallets/${userId}`);
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const showError = (title, description) => {
    setErrorTitle(title);
    setErrorDescription(description);
    setShowErrorPopup(true);
  };

  const showSuccess = () => {
    setShowSuccessPopup(true);
  };

  const closePopup = () => {
    setShowSuccessPopup(false);
    setShowErrorPopup(false);
    setErrorTitle('');
    setErrorDescription('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        userId: parseInt(userId, 10),
        currency: 'INR',
        amount: parseFloat(formData.amount)
      };

      const response = await api.post('/api/v1/wallets/credit', payload);
      const data = response.data;

      setCreditedAmount(formData.amount);
      setMessage(`✅ Successfully added ₹${formData.amount} to your wallet!`);
      setFormData({ amount: '' });
      setWalletBalance(data.balance);
      showSuccess();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to add funds';
      showError('Add Funds Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleQuickAmount = (amount) => {
    setFormData({ amount: amount.toString() });
  };

  return (
    <div className="send-money-container">
      {showSuccessPopup && (
        <div className="error-popup-overlay">
          <div className="error-popup success-popup">
            <div className="popup-header">
              <div className="success-icon">✅</div>
              <h3>Funds Added Successfully!</h3>
            </div>
            <div className="popup-body">
              <p>₹{creditedAmount} has been added to your wallet.</p>
              <div className="new-balance">
                New Balance: <strong>₹{walletBalance}</strong>
              </div>
            </div>
            <div className="popup-footer">
              <button className="popup-ok-btn" onClick={closePopup}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className="error-popup-overlay">
          <div className="error-popup">
            <div className="popup-header">
              <div className="error-icon">⚠️</div>
              <h3>{errorTitle}</h3>
            </div>
            <div className="popup-body">
              <p>{errorDescription}</p>
            </div>
            <div className="popup-footer">
              <button className="popup-ok-btn" onClick={closePopup}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="send-money-card">
        <div className="send-money-header">
          <h2>Add Funds</h2>
          <p>Add money to your wallet instantly</p>
        </div>

        <div className="balance-display">
          <div className="balance-label">Current Balance</div>
          <div className="balance-amount">₹{walletBalance}</div>
        </div>

        <form onSubmit={handleSubmit} className="send-money-form">
          <div className="form-group">
            <label htmlFor="amount">Amount to Add (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="0.00"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="quick-amounts">
            <label>Quick Add:</label>
            <div className="amount-buttons">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`amount-btn ${formData.amount === amount.toString() ? 'active' : ''}`}
                  onClick={() => handleQuickAmount(amount)}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !userId}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Adding Funds...
              </>
            ) : (
              'Add Funds'
            )}
          </button>

          {message && (
            <div className="message success">
              {message}
            </div>
          )}
        </form>

        <div className="transaction-info">
          <h3>How it works</h3>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Enter Amount</strong>
                <p>Choose how much you want to add to your wallet</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Instant Credit</strong>
                <p>Funds are added to your wallet immediately</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Start Using</strong>
                <p>Use your balance to send money to others</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;