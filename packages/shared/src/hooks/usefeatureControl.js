import { useState, useEffect } from "react";
import axios from "axios";

// Hook to check which features are active for a specific party/user
export const useFeatureControl = (partyId) => {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await axios.get(`/api/features?partyId=${partyId}`);
        setFeatures(res.data);
      } catch (err) {
        console.error("Failed to fetch features", err);
      }
    };

    fetchFeatures();
  }, [partyId]);

  const isFeatureActive = (featureName) => features.some(f => f.name === featureName && f.isActive);

  return { features, isFeatureActive };
};