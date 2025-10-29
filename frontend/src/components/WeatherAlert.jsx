import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WeatherAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Create and configure STOMP client
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-alerts'),
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Handle connection
    stompClient.onConnect = () => {
      console.log('WebSocket Connected!');
      
      // Subscribe to alerts topic
      stompClient.subscribe('/topic/alerts', (message) => {
        const newAlert = message.body;
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts].slice(0, 5)); // Keep last 5 alerts
      });
    };

    stompClient.onWebSocketError = (error) => {
      console.error('WebSocket Error:', error);
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
    };

    // Activate the client
    stompClient.activate();
    setClient(stompClient);

    // Cleanup on unmount
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  if (alerts.length === 0) {
    return null; // Don't render anything if no alerts
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2 rounded shadow-lg max-w-md animate-slide-in"
          role="alert"
        >
          <p className="font-medium">{alert}</p>
        </div>
      ))}
    </div>
  );
};

export default WeatherAlert;