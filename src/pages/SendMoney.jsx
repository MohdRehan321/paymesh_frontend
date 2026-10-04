import React, { useState, useEffect, useCallback } from 'react';
import '../stylesheets/sendMoney.scss';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SendMoney = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    receiverId: '',
    amount: '',
  });
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorDescription, setErrorDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const currentUserId = Number(user?.id ?? user?.userId ?? user?.sub);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/users/all');
      const usersData = response.data || [];
      setUsers(usersData.filter((u) => Number(u.id) !== currentUserId));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [currentUserId]);

  const fetchRecentTransactions = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const response = await api.get(`/api/transactions/user/${currentUserId}`);
      const sortedTransactions = (response.data || [])
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3);
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

  const fetchUserRewards = async (userId) => {
    try {
      const response = await api.get(`/api/rewards/user/${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
  };

  const addNewTransaction = (newTransaction) => {
    setTransactions((prevTransactions) => {
      return [newTransaction, ...prevTransactions].slice(0, 3);
    });
  };

  const showError = (title, description) => {
    setErrorTitle(title);
    setErrorDescription(description);
    setShowErrorPopup(true);
  };

  const showReward = (rewards) => {
    if (rewards && rewards.length > 0) {
      const latestReward = rewards[rewards.length - 1];
      setRewardData(latestReward);
      setShowRewardPopup(true);
    }
  };

  const closePopup = () => {
    setShowErrorPopup(false);
    setShowRewardPopup(false);
    setErrorTitle('');
    setErrorDescription('');
    setRewardData(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const extractCleanErrorMessage = (technicalMessage) => {
    if (!technicalMessage) return 'Transaction failed';

    if (
      technicalMessage.includes('Not enough balance') ||
      technicalMessage.includes('InsufficientFundsException')
    ) {
      return 'Insufficient funds in your wallet';
    }

    try {
      const jsonMatch = technicalMessage.match(/"message":"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1];
      }
    } catch (e) {
      // Ignore parse issues and fall back to generic message.
    }

    return 'Transaction failed - please try again';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!currentUserId) {
        throw new Error('Unable to determine current user');
      }

      const payload = {
        senderId: currentUserId,
        receiverId: parseInt(formData.receiverId, 10),
        amount: parseFloat(formData.amount),
        idempotencyKey,
      };

      const response = await api.post('/api/transactions/create', payload);
      const data = response.data;

      if (data.status === 'SUCCESS') {
        setMessage('✅ Money sent successfully!');
        setFormData({ receiverId: '', amount: '' });
        addNewTransaction(data);
        setIdempotencyKey(crypto.randomUUID());

        setTimeout(async () => {
          const rewards = await fetchUserRewards(currentUserId);
          showReward(rewards);
        }, 1000);
      } else {
        const cleanError = extractCleanErrorMessage(data.message);
        showError('Transaction Failed', cleanError);
        addNewTransaction(data);
      }
    } catch (error) {
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;

      showError('Transaction Error', extractCleanErrorMessage(apiMessage));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (userId) => {
    const matchedUser = users.find((u) => Number(u.id) === Number(userId));
    return matchedUser ? matchedUser.name : `User ${userId}`;
  };

  const isSentTransaction = (transaction) => {
    if (!currentUserId) return false;
    return Number(transaction.senderId) === currentUserId;
  };

  return (
    <div className="send-money-container">
      {showRewardPopup && rewardData && (
        <div className="reward-popup-overlay">
          <div className="reward-popup">
            <div className="popup-header">
              <div className="reward-icon">🎉</div>
              <h3>Reward Earned!</h3>
            </div>
            <div className="popup-body">
              <div className="reward-amount">
                +{rewardData.points} Points
              </div>
              <p>You earned reward points for your transaction!</p>
              <div className="reward-details">
                <div className="reward-info">
                  <span>Transaction Reward</span>
                  <span>{new Date(rewardData.sentAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="popup-footer">
              <button className="popup-ok-btn" onClick={closePopup}>
                Awesome!
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
          <h2>Send Money</h2>
          <p>Transfer funds to other users securely</p>
        </div>

        <form onSubmit={handleSubmit} className="send-money-form">
          <div className="form-group">
            <label htmlFor="receiverId">Send To</label>
            <select
              id="receiverId"
              name="receiverId"
              value={formData.receiverId}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a user</option>
              {users.map((userItem) => (
                <option key={userItem.id} value={userItem.id}>
                  {userItem.name} ({userItem.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !idempotencyKey}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Sending...
              </>
            ) : (
              'Send Money'
            )}
          </button>

          {message && (
            <div className="message success">
              {message}
            </div>
          )}
        </form>

        <div className="transaction-info">
          <h3>Recent Transactions</h3>
          {transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-details">
                    <div className="transaction-type">
                      {isSentTransaction(transaction) ? 'Sent to' : 'Received from'}
                      <span className="user-name">
                        {isSentTransaction(transaction)
                          ? getUserName(transaction.receiverId)
                          : getUserName(transaction.senderId)}
                      </span>
                    </div>
                    <div className="transaction-date">
                      {formatDate(transaction.timestamp)}
                    </div>
                  </div>
                  <div className="transaction-amount">
                    <span className={`amount ${isSentTransaction(transaction) ? 'sent' : 'received'}`}>
                      {isSentTransaction(transaction) ? '-' : '+'}₹{transaction.amount}
                    </span>
                    <span className={`status ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-transactions">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMoney;