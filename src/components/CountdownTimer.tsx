import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { styles } from "../styles/globalStyles";

type Props = {
  createdAt: number;
};

export const CountdownTimer = ({ createdAt }: Props) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - createdAt;
      const fifteenMins = 15 * 60 * 1000;
      const remaining = fifteenMins - (elapsed % fifteenMins);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return <Text style={styles.timerText}>남은 시간 {timeLeft}</Text>;
};
