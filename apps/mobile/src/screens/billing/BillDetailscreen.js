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
    const itemsHtml = (billData.items || []).map((item, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 12px; text-align: left; font-size: 13px; color: #475569;">${index + 1}</td>
        <td style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 600; color: #1E293B;">
          ${item.name}
          ${item.hsnCode ? `<div style="font-size: 10px; color: #94A3B8; font-family: monospace;">HSN: ${item.hsnCode}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-size: 13px; color: #1E293B;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 13px; color: #1E293B;">₹${(item.price || item.rate || 0).toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #0F172A;">₹${(item.total || (item.quantity * (item.price || item.rate || 0))).toFixed(2)}</td>
      </tr>
    `).join('');

    const subTotal = Number(billData.totalAmount || billData.total || billData.subTotal || 0);
    const taxAmt = Number(billData.tax || billData.taxAmount || 0);
    const discountAmt = Number(billData.discountAmount || 0);
    const grandTotal = Number(billData.finalAmount || billData.totalAmount || billData.total || (subTotal + taxAmt - discountAmt));

    const qrCodeHtml = billData.paymentQrCode ? `
      <div style="text-align: center; border: 1px solid #E2E8F0; padding: 12px; border-radius: 12px; background-color: #F8FAFC; width: 160px;">
        <p style="font-weight: 800; font-size: 11px; margin: 0 0 6px 0; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Scan & Pay via UPI</p>
        <img src="${billData.paymentQrCode}" alt="UPI QR Code" style="width: 130px; height: 130px; border-radius: 6px; background-color: #FFF;" />
        <p style="font-size: 10px; color: #64748B; margin: 6px 0 0 0;">GPay, PhonePe, Paytm</p>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Invoice #${billData.billNumber || '001'}</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; margin: 0; padding: 24px; background-color: #FFF; }
              .invoice-container { max-width: 800px; margin: auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
              .header-bar { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px 28px; color: #FFF; display: flex; justify-content: space-between; align-items: center; }
              .company-title { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
              .doc-badge { background-color: rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 8px; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
              .meta-section { padding: 24px 28px; display: flex; justify-content: space-between; background-color: #FAFAFA; border-bottom: 1px solid #E2E8F0; }
              .info-box { font-size: 13px; line-height: 20px; }
              .info-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 4px; }
              .info-val { font-size: 14px; font-weight: 700; color: #0F172A; }
              .items-table { width: 100%; border-collapse: collapse; text-align: left; }
              .table-head { background-color: #1E293B; color: #FFFFFF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .table-head th { padding: 12px; font-weight: 700; }
              .summary-section { padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
              .totals-table { width: 320px; border-collapse: collapse; }
              .totals-table td { padding: 6px 12px; font-size: 13px; }
              .grand-total-row { background-color: #F59E0B; color: #FFFFFF; border-radius: 8px; font-size: 16px; font-weight: 800; }
              .grand-total-row td { padding: 10px 12px; }
              .footer-section { padding: 16px 28px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748B; }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <!-- Accent Header Bar -->
              <div class="header-bar">
                  <div>
                      <h1 class="company-title">GANESH HARDWARE</h1>
                      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Building Materials, Plywood, Sariya & Paints</p>
                  </div>
                  <div class="doc-badge">
                      ${billData.billType === 'quotation' ? 'QUOTATION' : 'TAX INVOICE'}
                  </div>
              </div>

              <!-- Metadata & Customer Info -->
              <div class="meta-section">
                  <div class="info-box">
                      <div class="info-label">Billed To</div>
                      <div class="info-val">${billData.customerName || billData.partyId?.name || 'Walk-in Customer'}</div>
                      <div>${billData.customerMobile || billData.partyId?.mobileNumber || ''}</div>
                      <div>${billData.customerAddress || billData.partyId?.address || ''}</div>
                  </div>
                  <div class="info-box" style="text-align: right;">
                      <div class="info-label">Invoice Details</div>
                      <div><b>Invoice #:</b> ${billData.billNumber || '001'}</div>
                      <div><b>Date:</b> ${new Date(billData.date || billData.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
                      <div><b>Payment Status:</b> <span style="color: ${billData.paymentStatus === 'unpaid' ? '#DC2626' : '#059669'}; font-weight: bold;">${(billData.paymentStatus || 'PAID').toUpperCase()}</span></div>
                  </div>
              </div>

              <!-- Table -->
              <table class="items-table">
                  <thead class="table-head">
                      <tr>
                          <th style="width: 40px;">#</th>
                          <th>Item Description</th>
                          <th style="text-align: center; width: 90px;">Qty</th>
                          <th style="text-align: right; width: 110px;">Price</th>
                          <th style="text-align: right; width: 120px;">Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${itemsHtml}
                  </tbody>
              </table>

              <!-- Summary & QR Section -->
              <div class="summary-section">
                  <div>
                      ${qrCodeHtml}
                  </div>
                  <table class="totals-table">
                      <tr>
                          <td style="color: #64748B;">Subtotal:</td>
                          <td style="text-align: right; font-weight: 600; color: #1E293B;">₹${subTotal.toFixed(2)}</td>
                      </tr>
                      ${taxAmt > 0 ? `
                      <tr>
                          <td style="color: #64748B;">GST / Tax:</td>
                          <td style="text-align: right; font-weight: 600; color: #1E293B;">₹${taxAmt.toFixed(2)}</td>
                      </tr>` : ''}
                      ${discountAmt > 0 ? `
                      <tr>
                          <td style="color: #64748B;">Discount:</td>
                          <td style="text-align: right; font-weight: 600; color: #DC2626;">-₹${discountAmt.toFixed(2)}</td>
                      </tr>` : ''}
                      <tr class="grand-total-row">
                          <td>Total:</td>
                          <td style="text-align: right;">₹${grandTotal.toFixed(2)}</td>
                      </tr>
                  </table>
              </div>

              <!-- Footer -->
              <div class="footer-section">
                  <div>
                      <b>Terms & Conditions:</b><br>
                      1. Goods once sold will not be taken back without bill.<br>
                      2. Subject to local jurisdiction.
                  </div>
                  <div style="text-align: right;">
                      <p style="margin: 0 0 35px 0;">For <b>GANESH HARDWARE</b></p>
                      <p style="margin: 0; border-top: 1px solid #CBD5E1; padding-top: 4px;">Authorised Signatory</p>
                  </div>
              </div>
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

  const handleThermalPrint = async () => {
    if (!bill) return;
    try {
      const itemsHtml = bill.items.map(item => `
        <tr>
          <td style="text-align: left; padding: 2px 0;">${item.name}</td>
          <td style="text-align: center; padding: 2px 0;">${item.quantity}</td>
          <td style="text-align: right; padding: 2px 0;">${item.rate || item.price}</td>
          <td style="text-align: right; padding: 2px 0;">${item.total?.toFixed(2) || 0}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: monospace; width: 100%; margin: 0; padding: 10px; font-size: 14px; color: #000; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; }
              th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 18px;">Retail Invoice</div>
            <div class="divider"></div>
            <div>Bill No: ${bill.billNumber}</div>
            <div>Date: ${new Date(bill.date || bill.createdAt).toLocaleDateString()}</div>
            <div>Customer: ${bill.customerName || bill.partyId?.name || 'Cash'}</div>
            <div class="divider"></div>
            <table>
              <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amt</th></tr>
              ${itemsHtml}
            </table>
            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between; font-size: 16px;" class="bold">
              <span>Total:</span><span>₹${(bill.finalAmount || bill.totalAmount || bill.total || 0).toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="center">Thank You! Visit Again</div>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "Could not print thermal receipt.");
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
        <TouchableOpacity style={styles.printBtn} onPress={handleThermalPrint}>
          <Ionicons name="print-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareBill} disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={22} color="white" />
              <Text style={styles.shareButtonText}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {(bill.finalAmount >= 50000 || bill.total >= 50000 || bill.totalAmount >= 50000) && (
        <TouchableOpacity style={styles.ewayBtn} onPress={() => {
          Alert.alert("E-Way Bill", "Ready to integrate with NIC E-Way Bill Portal.");
          // navigation.navigate('EwayBill', { bill });
        }}>
          <Ionicons name="bus-outline" size={20} color="white" />
          <Text style={styles.ewayBtnText}>Generate E-Way Bill</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  waContainer: { marginRight: 10 },
  printBtn: {
    backgroundColor: '#4b5563',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  ewayBtn: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  ewayBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default BillDetailScreen;