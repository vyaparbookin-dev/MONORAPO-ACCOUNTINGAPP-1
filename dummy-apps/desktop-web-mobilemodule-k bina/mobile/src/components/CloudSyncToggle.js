import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { syncQueueNative } from '@repo/shared/src/services/syncqueue.native';

const CloudSyncToggle = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        handleSync();
      }
    });

    const checkQueue = async () => {
      const q = await syncQueueNative.getQueue();
      setPendingCount(q.length);
    };
    
    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncQueueNative.processQueue();
    const q = await syncQueueNative.getQueue();
    setPendingCount(q.length);
    setIsSyncing(false);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !isOnline ? styles.offline : pendingCount > 0 ? styles.pending : styles.synced]} 
      onPress={handleSync}
      disabled={!isOnline || isSyncing || pendingCount === 0}
    >
      {isSyncing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={!isOnline ? "cloud-offline" : pendingCount > 0 ? "cloud-upload" : "cloud-done"} size={18} color="#fff" />}
      <Text style={styles.text}>{!isOnline ? `Offline (${pendingCount})` : isSyncing ? "Syncing..." : pendingCount > 0 ? `${pendingCount} Pending` : "Synced"}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  offline: { backgroundColor: '#dc2626' }, pending: { backgroundColor: '#ea580c' }, synced: { backgroundColor: '#16a34a' },
  text: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});
export default CloudSyncToggle;