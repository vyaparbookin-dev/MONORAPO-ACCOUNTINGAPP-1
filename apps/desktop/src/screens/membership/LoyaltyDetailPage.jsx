import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Loader from "../../components/Loader";

const LoyaltyDetailPage = ({ membershipId }) => {
  const { id } = useParams();
  const finalId = membershipId || id;
  const [loyaltyDetails, setLoyaltyDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (finalId) {
      fetchLoyaltyDetails(finalId);
    }
  }, [finalId]);

  const fetchLoyaltyDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/memberships/${id}/loyalty`); // Backend endpoint
      setLoyaltyDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch loyalty details", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loyalty-detail-page">
      {loading ? (
        <Loader />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Points Earned</th>
              <th>Points Redeemed</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {loyaltyDetails.map((detail) => (
              <tr key={detail._id}>
                <td>{detail.customerName}</td>
                <td>{detail.pointsEarned}</td>
                <td>{detail.pointsRedeemed}</td>
                <td>{detail.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoyaltyDetailPage;