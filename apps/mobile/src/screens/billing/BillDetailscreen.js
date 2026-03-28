import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Alert, Image } from 'react-native';
import { getData } from '../../services/ApiService';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import WhatsappSender from '../../components/WhatsappSender';

const BillDetailScreen = ({ route }) => {
  const { billId } = route.params || {};
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (billId) {
      loadBill();
    }
  }, [billId]);

  const loadBill = async () => {
    try {
      const res = await getData(`/billing/${billId}`);
      setBill(res.data?.bill || res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bill details");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceHtml = (billData) => {
    const itemsHtml = billData.items.map((item, index) => `
      <tr class="item">
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">₹${item.price?.toFixed(2) || item.rate?.toFixed(2) || 0}</td>
        <td class="right">₹${item.total?.toFixed(2) || 0}</td>
      </tr>
    `).join('');

    const qrCodeHtml = billData.paymentQrCode ? `
      <div style="text-align: right; margin-top: 20px;">
        <p style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">Scan & Pay via UPI</p>
        <img src="${billData.paymentQrCode}" alt="UPI QR Code" style="width: 120px; height: 120px; border: 1px solid #ddd; padding: 5px; border-radius: 8px;" />
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-g">
          <title>Invoice</title>
          <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; }
              .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
              .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
              .invoice-box table td { padding: 5px; vertical-align: top; }
              .invoice-box table tr td:nth-child(n+2) { text-align: right; }
              .invoice-box table tr.top table td { padding-bottom: 20px; }
              .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
              .invoice-box table tr.information table td { padding-bottom: 40px; }
              .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; text-align: left; }
              .invoice-box table tr.heading td:nth-child(n+3) { text-align: right; }
              .invoice-box table tr.details td { padding-bottom: 20px; }
              .invoice-box table tr.item td { border-bottom: 1px solid #eee; text-align: left; }
              .invoice-box table tr.item td:nth-child(n+3) { text-align: right; }
              .invoice-box table tr.item.last td { border-bottom: none; }
              .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
              .right { text-align: right; }
              .left { text-align: left; }
          </style>
      </head>
      <body>
          <div class="invoice-box">
              <table>
                  <tr class="top">
                      <td colspan="5">
                          <table>
                              <tr>
                                  <td class="title">
                                      {/* You can add a logo here */}
                                      <p style="font-size: 20px; font-weight: bold;">Your Company Name</p>
                                  </td>
                                  <td>
                                      Invoice #: ${billData.billNumber || 'N/A'}<br>
                                      Created: ${new Date(billData.date || billData.createdAt).toLocaleDateString()}<br>
                                      Due: ${billData.dueDate ? new Date(billData.dueDate).toLocaleDateString() : 'N/A'}
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr class="information">
                      <td colspan="5">
                          <table>
                              <tr>
                                  <td>
                                      Your Company Address<br>
                                      City, State, ZIP<br>
                                      your.email@example.com
                                  </td>
                                  <td>
                                      <b>Bill To:</b><br>
                                      ${billData.customerName || billData.partyId?.name || 'N/A'}<br>
                                      ${billData.customerMobile || billData.partyId?.mobileNumber || ''}<br>
                                      ${billData.customerAddress || billData.partyId?.address || ''}
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr class="heading">
                      <td class="left">#</td>
                      <td class="left">Item</td>
                      <td class="right">Qty</td>
                      <td class="right">Price</td>
                      <td class="right">Total</td>
                  </tr>
                  ${itemsHtml}
                  <tr class="total">
                      <td colspan="4" class="right"><b>Subtotal</b></td>
                      <td class="right"><b>₹${(billData.totalAmount || billData.total || 0).toFixed(2)}</b></td>
                  </tr>
                  <tr class="total">
                      <td colspan="4" class="right">Tax (${billData.tax > 0 ? 'GST' : '0'}%)</td>
                      <td class="right">₹${(billData.tax || 0).toFixed(2)}</td>
                  </tr>
                   <tr class="total">
                      <td colspan="4" class="right">Discount</td>
                      <td class="right">₹${(billData.discountAmount || 0).toFixed(2)}</td>
                  </tr>
                  <tr class="total">
                      <td colspan="4" class="right"><b>Grand Total</b></td>>
                      <td class="right"><b>₹${(billData.finalAmount || billData.totalAmount || billData.total || 0).toFixed(2)}</b></td>
                  </tr>
              </table>
              ${qrCodeHtml}
          </div>
      </body>
      </html>
    `;
  };

  const handleShareBill = async () => {
    if (!bill) return;
    setIsSharing(true);
    try {
      const html = generateInvoiceHtml(bill);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { dialogTitle: `Share Invoice ${bill.billNumber}` });
    } catch (error) {
      console.error("Error sharing bill:", error);
      Alert.alert("Error", "Could not share the bill.");
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!bill) return <Text style={styles.error}>Bill not found</Text>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Invoice #{bill.billNumber}</Text>
          <Text style={styles.subtitle}>Date: {new Date(bill.date || bill.createdAt).toLocaleDateString()}</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{bill.customerName || bill.partyId?.name}</Text>
          {bill.customerMobile && <Text style={styles.value}>{bill.customerMobile}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Items:</Text>
          {bill.items && bill.items.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={{ flex: 1 }}>{item.name} x {item.quantity}</Text>
              <Text style={{ fontWeight: 'bold' }}>₹{item.total?.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{(bill.finalAmount || bill.totalAmount || bill.total || 0).toFixed(2)}</Text>
          </View>
        </View>

        {bill.paymentQrCode && (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Text style={styles.qrTitle}>Scan & Pay via UPI</Text>
            <View style={styles.qrContainer}>
              <Image source={{ uri: bill.paymentQrCode }} style={styles.qrImage} />
            </View>
            <Text style={styles.qrText}>
              Amount: <Text style={styles.totalValue}>₹{(bill.finalAmount || bill.totalAmount || bill.total || 0).toFixed(2)}</Text>
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomActions}>
        <View style={styles.waContainer}>
          <WhatsappSender bill={bill} />
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareBill} disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={22} color="white" />
              <Text style={styles.shareButtonText}>Share PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    marginBottom: 15, 
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    })
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  label: { fontWeight: 'bold', color: '#555', marginTop: 5 },
  value: { fontSize: 16, marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  error: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'red' },
  qrTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  qrContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  qrImage: { width: 150, height: 150, resizeMode: 'contain' },
  qrText: { fontSize: 14, color: '#666' },
  bottomActions: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  waContainer: {
    marginRight: 10,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default BillDetailScreen;