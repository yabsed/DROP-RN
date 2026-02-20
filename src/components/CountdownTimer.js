import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { styles } from '../styles/globalStyles';

export const CountdownTimer = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - createdAt;
      const fifteenMins = 15 * 60 * 1000;
      const remaining = fifteenMins - (elapsed % fifteenMins);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <Text style={styles.timerText}>⏳ {timeLeft} 후 리셋</Text>;
};
