import api from "../services/api";
import React, { useState, useRef, useEffect } from "react";
import { extractPagesAndBillsFromPDF } from "../utils/PdfParser";
import { storageManager } from "../services/storageManager";
import { deduplicateBills } from "../utils/deduplicateBills";
import { persistPhotoToLocalCache, getWebSafeImageUrl } from "../utils/photoStorage";

export default function SmartPdfBillModal({ isOpen, onClose, onBillsSaved, companyId }) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [defaultBillType, setDefaultBillType] = useState("Purchase"); // Purchase (खरीद) vs Sale (बिक्री)
  const fileInputRef = useRef(null);

  // State for Full Screen, Store Products, Aliases, Expanded items, and Error recovery
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [storeProducts, setStoreProducts] = useState([]);
  const [itemAliases, setItemAliases] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [modalError, setModalError] = useState(null);

  // State for AI Smart Bill Scanner
  const [aiScanningPages, setAiScanningPages] = useState({});
  const [aiScanningAll, setAiScanningAll] = useState(false);

  const toggleExpandItem = (pageIdx, itemIdx) => {
    const key = `${pageIdx}_${itemIdx}`;
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Load existing products and aliases when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setModalError(null);
    try {
      const prodKeys = ["vb_local_products", "products", "inventory", "items"];
      for (const k of prodKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStoreProducts(parsed);
            break;
          }
        }
      }
    } catch (e) {}

    try {
      const rawA = localStorage.getItem("vb_item_aliases");
      if (rawA) setItemAliases(JSON.parse(rawA));
    } catch (e) {}
  }, [isOpen]);

  // Close preview image on hardware back press or ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, previewImage, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("कृपया सिर्फ PDF फाइल चुनें (.pdf format)");
      return;
    }

    setLoading(true);
    setPages([]);

    try {
      const extractedPages = await extractPagesAndBillsFromPDF(file);
      if (extractedPages.length === 0) {
        alert("इस PDF में कोई पेज नहीं मिला।");
      } else {
        setPages(extractedPages);
      }
    } catch (err) {
      console.error("PDF Parsing error:", err);
      alert("PDF को पढ़ने में समस्या आई। कृपया फाइल चेक करें।");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index, field, value) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleSelectPage = (index) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isSelected: !updated[index].isSelected };
      return updated;
    });
  };

  const recalcItem = (item, field, val) => {
    const updated = { ...item, [field]: val };
    const qty = Math.max(0.01, parseFloat(updated.qty) || 1);
    const gst = Math.max(0, parseFloat(updated.gstRate) || 0);
    const lessVal = Math.max(0, parseFloat(updated.less) || 0);
    const isPercent = updated.lessType === "%";

    if (field === "preGstRate") {
      const pre = Math.max(0, parseFloat(val) || 0);
      const lessAmt = isPercent ? (pre * lessVal / 100) : lessVal;
      const netPre = Math.max(0, pre - lessAmt);
      const withGst = Math.round((netPre * (1 + gst / 100)) * 100) / 100;
      const totalAmt = Math.round(qty * withGst * 100) / 100;
      const taxAmt = Math.round(qty * netPre * (gst / 100) * 100) / 100;

      updated.preGstRate = pre;
      updated.withGstRate = withGst;
      updated.rate = withGst;
      updated.taxableAmount = Math.round(qty * netPre * 100) / 100;
      updated.gstAmount = taxAmt;
      updated.amount = totalAmt;
    } else if (field === "withGstRate" || field === "rate") {
      const withGst = Math.max(0, parseFloat(val) || 0);
      const netPre = gst > 0 ? (withGst / (1 + gst / 100)) : withGst;
      const grossPre = isPercent ? (lessVal < 100 ? netPre / (1 - lessVal / 100) : netPre) : (netPre + lessVal);
      const preRound = Math.round(grossPre * 100) / 100;
      const totalAmt = Math.round(qty * withGst * 100) / 100;
      const taxAmt = Math.round((totalAmt - (qty * netPre)) * 100) / 100;

      updated.withGstRate = withGst;
      updated.rate = withGst;
      updated.preGstRate = preRound;
      updated.taxableAmount = Math.round(qty * netPre * 100) / 100;
      updated.gstAmount = taxAmt;
      updated.amount = totalAmt;
    } else if (field === "gstRate" || field === "less" || field === "lessType" || field === "qty") {
      let pre = parseFloat(updated.preGstRate);
      if (!pre && updated.withGstRate) {
        pre = gst > 0 ? (updated.withGstRate / (1 + gst / 100)) : updated.withGstRate;
        updated.preGstRate = Math.round(pre * 100) / 100;
      } else if (!pre) {
        pre = parseFloat(updated.rate) || 0;
        updated.preGstRate = pre;
      }

      const lessAmt = isPercent ? (pre * lessVal / 100) : lessVal;
      const netPre = Math.max(0, pre - lessAmt);
      const withGst = Math.round((netPre * (1 + gst / 100)) * 100) / 100;
      const totalAmt = Math.round(qty * withGst * 100) / 100;
      const taxAmt = Math.round(qty * netPre * (gst / 100) * 100) / 100;

      updated.withGstRate = withGst;
      updated.rate = withGst;
      updated.taxableAmount = Math.round(qty * netPre * 100) / 100;
      updated.gstAmount = taxAmt;
      updated.amount = totalAmt;
    } else if (field === "amount") {
      const amt = Math.max(0, parseFloat(val) || 0);
      const withGst = Math.round((amt / qty) * 100) / 100;
      const netPre = gst > 0 ? (withGst / (1 + gst / 100)) : withGst;
      updated.amount = amt;
      updated.withGstRate = withGst;
      updated.rate = withGst;
      updated.preGstRate = Math.round(netPre * 100) / 100;
      updated.taxableAmount = Math.round(qty * netPre * 100) / 100;
      updated.gstAmount = Math.round((amt - updated.taxableAmount) * 100) / 100;
    }

    return updated;
  };

  const handleItemChange = (pageIdx, itemIdx, field, value) => {
    setPages((prev) => {
      const updated = [...prev];
      const pageItems = [...(updated[pageIdx].items || [])];
      if (field === "name") {
        const currentItem = pageItems[itemIdx];
        const rawVendor = currentItem.rawVendorName || currentItem.name;
        pageItems[itemIdx] = { ...currentItem, name: value };

        // If product name was linked to an existing store product, remember in aliases
        if (rawVendor && value && rawVendor.toLowerCase().trim() !== value.toLowerCase().trim()) {
          try {
            const currentAliases = JSON.parse(localStorage.getItem("vb_item_aliases") || "{}");
            currentAliases[rawVendor.toLowerCase().trim()] = {
              mappedName: value,
              barcode: currentItem.barcode || "",
              hsnCode: currentItem.hsnCode || ""
            };
            localStorage.setItem("vb_item_aliases", JSON.stringify(currentAliases));
            setItemAliases(currentAliases);
          } catch (e) {}
        }
      } else if (field === "barcode" || field === "hsnCode" || field === "unit") {
        pageItems[itemIdx] = { ...pageItems[itemIdx], [field]: value };
      } else {
        pageItems[itemIdx] = recalcItem(pageItems[itemIdx], field, value);
      }
      const newTotal = pageItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      if (newTotal > 0) {
        updated[pageIdx].totalAmount = Math.round(newTotal * 100) / 100;
      }
      updated[pageIdx].items = pageItems;
      return updated;
    });
  };

  const handleApplyBatchGst = (pageIdx, slab) => {
    setPages((prev) => {
      const updated = [...prev];
      const pageItems = (updated[pageIdx].items || []).map((it) => {
        return recalcItem({ ...it, gstRate: slab }, "gstRate", slab);
      });
      updated[pageIdx].items = pageItems;
      const newTotal = pageItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      if (newTotal > 0) {
        updated[pageIdx].totalAmount = Math.round(newTotal * 100) / 100;
      }
      return updated;
    });
  };

  const handleAddItem = (pageIdx) => {
    setPages((prev) => {
      const updated = [...prev];
      const pageItems = [...(updated[pageIdx].items || [])];
      pageItems.push({
        id: `item_${Date.now()}_${pageItems.length + 1}`,
        name: "नया सामान",
        qty: 1,
        rate: 0,
        amount: 0,
      });
      updated[pageIdx].items = pageItems;
      return updated;
    });
  };

  const handleRemoveItem = (pageIdx, itemIdx) => {
    setPages((prev) => {
      const updated = [...prev];
      const pageItems = [...(updated[pageIdx].items || [])];
      pageItems.splice(itemIdx, 1);
      updated[pageIdx].items = pageItems;
      return updated;
    });
  };

  // 1-Click AI Scan per page using Gemini / OpenAI Vision
  const handleAiScanPage = async (pageIdx) => {
    const page = pages[pageIdx];
    if (!page || !page.imageUrl) {
      alert("इस पेज की फोटो उपलब्ध नहीं है।");
      return;
    }

    setAiScanningPages((prev) => ({ ...prev, [pageIdx]: true }));

    try {
      const openAiKey = localStorage.getItem("OPENAI_API_KEY") || "";
      const geminiKey = localStorage.getItem("GEMINI_API_KEY") || "";

      const res = await api.post("/api/billing/parse-image", {
        images: [page.imageUrl],
        scannerType: "printed",
        mode: "printed",
        rawText: page.rawText || undefined,
        openaiApiKey: openAiKey.trim() || undefined,
        geminiApiKey: geminiKey.trim() || undefined
      });

      const billData = res?.data?.batch && Array.isArray(res.data.bills) && res.data.bills[0]
        ? res.data.bills[0]
        : (res?.data?.parsedItems ? res.data : (res?.parsedItems ? res : (res?.data || res)));

      if (!billData) {
        throw new Error("AI से कोई परिणाम नहीं मिला।");
      }

      const aiParty = (billData.partyName || "").trim();
      const aiBillNo = (billData.invoiceNumber || "").trim();
      const aiDate = (billData.date || billData.billDate || "").trim();
      const aiTotal = Number(billData.totalAmount) || 0;
      const aiItems = Array.isArray(billData.parsedItems) ? billData.parsedItems : [];

      let mappedItems = [];
      if (aiItems.length > 0) {
        mappedItems = aiItems.map((it, itemIdx) => {
          const q = Math.max(0.01, Number(it.quantity) || 1);
          const p = Number(it.price) || 0;
          const tot = Number(it.total) || Math.round(q * p * 100) / 100;
          const unitRate = p > 0 ? p : (tot > 0 ? Math.round((tot / q) * 100) / 100 : 0);

          return {
            id: `item_ai_${Date.now()}_${itemIdx + 1}`,
            name: it.name || `सामान ${itemIdx + 1}`,
            rawVendorName: it.name || `सामान ${itemIdx + 1}`,
            isAutoMapped: false,
            qty: q,
            unit: it.unit || "pcs",
            barcode: it.barcode || "",
            hsnCode: it.hsn || it.hsnCode || "",
            preGstRate: unitRate,
            withGstRate: unitRate,
            rate: unitRate,
            gstRate: 0,
            less: 0,
            lessType: "flat",
            taxableAmount: tot,
            gstAmount: 0,
            amount: tot,
          };
        });
      }

      setPages((prev) => {
        const updated = [...prev];
        const targetPage = { ...updated[pageIdx] };

        if (aiParty) targetPage.partyName = aiParty;
        if (aiBillNo) targetPage.billNumber = aiBillNo;
        if (aiDate) {
          try {
            const d = new Date(aiDate);
            if (!isNaN(d.getTime())) targetPage.date = d.toISOString().split("T")[0];
            else targetPage.date = aiDate;
          } catch (e) {
            targetPage.date = aiDate;
          }
        }

        if (mappedItems.length > 0) {
          targetPage.items = mappedItems;
          const itemsSum = mappedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
          targetPage.totalAmount = aiTotal > 0 ? aiTotal : (itemsSum > 0 ? Math.round(itemsSum * 100) / 100 : targetPage.totalAmount);
        } else if (aiTotal > 0) {
          targetPage.totalAmount = aiTotal;
        }

        targetPage.aiParsed = true;
        updated[pageIdx] = targetPage;
        return updated;
      });

      alert(`✨ AI सफलता: पेज ${page.pageNumber} से ${mappedItems.length} सामान और कुल रकम पहचान ली गई है!`);
    } catch (err) {
      console.error("AI parse error:", err);
      alert("AI स्कैन में त्रुटि: " + (err.message || "कृपया पुनः प्रयास करें"));
    } finally {
      setAiScanningPages((prev) => ({ ...prev, [pageIdx]: false }));
    }
  };

  // AI Scan all selected pages
  const handleAiScanAllPages = async () => {
    if (pages.length === 0) return;
    setAiScanningAll(true);
    let successCount = 0;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].isSelected) {
        try {
          await handleAiScanPage(i);
          successCount++;
        } catch (e) {}
      }
    }

    setAiScanningAll(false);
    alert(`🎉 सभी ${successCount} पेजों का AI स्कैन पूरा हुआ!`);
  };

  const handleSaveAllBills = async () => {
    const selected = pages.filter((p) => p.isSelected);
    if (selected.length === 0) {
      alert("कम से कम 1 बिल सेलेक्ट करें।");
      return;
    }

    setSaving(true);
    const coId = companyId || localStorage.getItem("companyId") || "default";

    try {
      let photosCache = {};
      try {
        photosCache = JSON.parse(localStorage.getItem("vb_tx_photos_cache") || "{}");
      } catch (e) {}

      const timestamp = Date.now();
      const currentBills = storageManager.getBills(coId) || [];
      const createdBills = [];
      const allPurchasedItems = [];

      // 1. Process each page bill
      for (let i = 0; i < selected.length; i++) {
        const page = selected[i];
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const uniqueId = `pdf_${timestamp}_p${page.pageNumber}_${randomSuffix}`;
        const billAmt = Number(page.totalAmount) || 0;
        const pMode = (page.paymentMode || "CASH").toUpperCase();

        const rawBillNo = (page.billNumber && page.billNumber.trim()) ? page.billNumber.trim() : "";
        const finalBillNo = rawBillNo
          ? (selected.length > 1 && !rawBillNo.includes(`P${page.pageNumber}`) ? `${rawBillNo}-P${page.pageNumber}` : rawBillNo)
          : `BILL-P${page.pageNumber}-${timestamp.toString().slice(-4)}`;

        const party = (page.partyName && page.partyName.trim())
          ? page.partyName.trim()
          : `सप्लायर (पेज ${page.pageNumber})`;

        const billDate = page.date || new Date().toISOString().split("T")[0];

        // Format items properly with guaranteed positive numbers, GST, and Less tracking
        const billItems = Array.isArray(page.items) && page.items.length > 0
          ? page.items.map((it) => {
              const q = Math.max(0.01, Number(it.qty) || 1);
              const withRate = Number(it.withGstRate) > 0 ? Number(it.withGstRate) : (Number(it.rate) || billAmt);
              const preRate = Number(it.preGstRate) > 0 ? Number(it.preGstRate) : withRate;
              const gst = Number(it.gstRate) || 0;
              const l = Number(it.less) || 0;
              const amt = Number(it.amount) > 0 ? Number(it.amount) : Math.round(q * withRate * 100) / 100;
              const taxVal = Number(it.taxableAmount) > 0 ? Number(it.taxableAmount) : Math.round(q * preRate * 100) / 100;
              const gstVal = Number(it.gstAmount) > 0 ? Number(it.gstAmount) : Math.round((amt - taxVal) * 100) / 100;

              return {
                name: it.name || "सामान",
                rawVendorName: it.rawVendorName || it.name || "सामान",
                qty: q,
                quantity: q,
                unit: it.unit || "pcs",
                barcode: it.barcode || "",
                hsnCode: it.hsnCode || "",
                rate: withRate,
                price: withRate,
                preGstRate: preRate,
                withGstRate: withRate,
                gstRate: gst,
                less: l,
                lessType: it.lessType || "flat",
                discount: l,
                taxableAmount: taxVal,
                gstAmount: gstVal,
                amount: amt,
                total: amt,
              };
            })
          : [
              {
                name: `सामान / बिल विवरण (PDF पेज ${page.pageNumber})`,
                rawVendorName: `सामान / बिल विवरण (PDF पेज ${page.pageNumber})`,
                qty: 1,
                quantity: 1,
                unit: "pcs",
                barcode: "",
                hsnCode: "",
                rate: billAmt,
                price: billAmt,
                preGstRate: billAmt,
                withGstRate: billAmt,
                gstRate: 0,
                less: 0,
                lessType: "flat",
                discount: 0,
                taxableAmount: billAmt,
                gstAmount: 0,
                amount: billAmt,
                total: billAmt,
              },
            ];

        allPurchasedItems.push(...billItems);

        const totalTax = Math.round(billItems.reduce((s, it) => s + (Number(it.gstAmount) || 0), 0) * 100) / 100;
        const totalTaxable = Math.round(billItems.reduce((s, it) => s + (Number(it.taxableAmount) || 0), 0) * 100) / 100;
        const totalLess = Math.round(billItems.reduce((s, it) => {
          const l = Number(it.less) || 0;
          const q = Number(it.qty) || 1;
          const p = Number(it.preGstRate) || 0;
          return s + (it.lessType === "%" ? (p * l / 100) * q : l * q);
        }, 0) * 100) / 100;

        const isCash = pMode === "CASH";

        // Upload page proof to Cloudinary storage to prevent localStorage 5MB quota errors
        let cloudImgUrl = "";
        if (page.imageUrl) {
          try {
            const upRes = await api.post('/api/upload/bill-image', {
              fileData: page.imageUrl,
              fileName: `bill_${finalBillNo}.jpg`,
              targetType: "bill",
              targetId: finalBillNo
            }).catch(() => null);
            cloudImgUrl = upRes?.url || upRes?.data?.url || "";
          } catch (e) {}
        }
        const effectivePageImg = cloudImgUrl || page.imageUrl || "";

        const newBill = {
          _id: uniqueId,
          id: uniqueId,
          billNumber: finalBillNo,
          invoiceNumber: finalBillNo,
          customerName: party,
          partyName: party,
          customer: party,
          date: billDate,
          rawDate: `${billDate}T12:00:00.000Z`,
          amount: billAmt,
          total: billAmt,
          finalAmount: billAmt,
          totalAmount: billAmt,
          grandTotal: billAmt,
          paidAmount: isCash ? billAmt : 0,
          balance: isCash ? 0 : billAmt,
          paymentStatus: isCash ? "Paid" : "Unpaid",
          type: defaultBillType,
          paymentMode: pMode,
          paymentMethod: isCash ? "cash" : "credit",
          source: "PDF_MULTI_IMPORT",
          pdfPage: page.pageNumber,
          isOfflineCreated: true,
          billImageUrl: effectivePageImg,
          billImageUrls: effectivePageImg ? [effectivePageImg] : [],
          imgUrls: effectivePageImg ? [effectivePageImg] : [],
          items: billItems,
          tax: totalTax,
          taxAmount: totalTax,
          discountAmount: totalLess,
          subTotal: totalTaxable,
          taxableAmount: totalTaxable,
        };

        if (effectivePageImg) {
          photosCache[uniqueId] = [effectivePageImg];
          photosCache[finalBillNo] = [effectivePageImg];
          persistPhotoToLocalCache(uniqueId, [effectivePageImg]);
          persistPhotoToLocalCache(finalBillNo, [effectivePageImg]);
        }

        // Auto-create / update Party in Vendor ledger
        if (party && !party.startsWith("Party Page")) {
          try {
            const currentParties = storageManager.getParties(coId) || [];
            const exists = currentParties.find(
              (p) => (p.name || p.partyName || "").trim().toLowerCase() === party.toLowerCase()
            );
            if (!exists) {
              const pType = defaultBillType === "Purchase" ? "supplier" : "customer";
              const newPartyObj = {
                _id: `party_${timestamp}_${randomSuffix}`,
                id: `party_${timestamp}_${randomSuffix}`,
                name: party,
                partyName: party,
                type: pType,
                partyType: pType,
                openingBalance: 0,
                balance: isCash ? 0 : (pType === "supplier" ? -billAmt : billAmt),
                currentBalance: isCash ? 0 : (pType === "supplier" ? -billAmt : billAmt),
                phone: "",
                address: "",
              };
              storageManager.saveParty(coId, newPartyObj);
            } else if (!isCash) {
              // If Udhar, add to supplier's pending payable balance
              const currentBal = Number(exists.balance ?? exists.currentBalance ?? 0);
              const updatedBal = exists.type === "supplier" ? currentBal - billAmt : currentBal + billAmt;
              storageManager.saveParty(coId, { ...exists, balance: updatedBal, currentBalance: updatedBal });
            }
          } catch (pErr) {
            console.warn("Auto save party error:", pErr);
          }
        }

        // If Cash, log cash expense entry so shop cash drawer reflects the payout immediately
        if (isCash && billAmt > 0) {
          try {
            const cashExp = {
              _id: `exp_${timestamp}_${randomSuffix}`,
              id: `exp_${timestamp}_${randomSuffix}`,
              date: billDate,
              category: "सप्लायर माल खरीद (Goods Purchase)",
              amount: billAmt,
              paymentMode: "CASH",
              partyName: party,
              notes: `बिल नं ${finalBillNo} नकद भुगतान (PDF बिल)`,
              companyId: coId
            };
            const curExp = storageManager.getExpenses(coId) || [];
            storageManager.saveExpenses(coId, [cashExp, ...curExp]);
          } catch (e) {}
        }

        createdBills.push(newBill);
      }

      // 2. Batch save all bills into storageManager
      const updatedBills = deduplicateBills([...createdBills, ...currentBills]);
      storageManager.saveBills(coId, updatedBills);

      // 3. Increment Inventory Stock & Auto-Create Products with Barcode & HSN Code
      try {
        let currentProducts = [];
        const prodKeys = ["vb_local_products", "products", "inventory", "items"];
        for (const k of prodKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                currentProducts = parsed;
                break;
              }
            } catch (e) {}
          }
        }

        const updatedProducts = [...currentProducts];
        const aliases = JSON.parse(localStorage.getItem("vb_item_aliases") || "{}");

        for (const it of allPurchasedItems) {
          const q = Number(it.qty) || 1;
          const nameToMatch = String(it.name || "").trim().toLowerCase();
          const barcodeToMatch = String(it.barcode || "").trim();

          let matchIdx = -1;
          if (barcodeToMatch) {
            matchIdx = updatedProducts.findIndex((p) => String(p.barcode || "").trim() === barcodeToMatch);
          }
          if (matchIdx === -1) {
            matchIdx = updatedProducts.findIndex((p) => String(p.name || p.productName || "").trim().toLowerCase() === nameToMatch);
          }

          if (matchIdx !== -1) {
            // Existing Product: Increase Stock
            const curStock = Number(updatedProducts[matchIdx].currentStock ?? updatedProducts[matchIdx].stock ?? 0);
            const newStock = curStock + q;
            updatedProducts[matchIdx].currentStock = newStock;
            updatedProducts[matchIdx].stock = newStock;
            if (it.preGstRate || it.rate) {
              updatedProducts[matchIdx].costPrice = Number(it.preGstRate) || Number(it.rate);
            }
            if (it.withGstRate || it.rate) {
              updatedProducts[matchIdx].sellingPrice = updatedProducts[matchIdx].sellingPrice || Number(it.withGstRate) || Number(it.rate);
            }
            if (it.hsnCode && !updatedProducts[matchIdx].hsnCode) {
              updatedProducts[matchIdx].hsnCode = it.hsnCode;
            }

            // Sync to backend
            const prodId = updatedProducts[matchIdx]._id || updatedProducts[matchIdx].id;
            if (prodId && !String(prodId).startsWith("prod_")) {
              api.put(`/api/inventory/${prodId}/stock`, { quantity: newStock }).catch(() => {});
            }
          } else {
            // New Product: Create in store inventory with Barcode and HSN Code
            const newProdId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const autoBarcode = it.barcode || `BC-${Date.now().toString().slice(-6)}`;
            const newProd = {
              _id: newProdId,
              id: newProdId,
              name: it.name || "नया सामान",
              category: "General",
              subCategory: "",
              brand: "General",
              costPrice: Number(it.preGstRate) || Number(it.rate) || 0,
              sellingPrice: Number(it.withGstRate) || Number(it.rate) || 0,
              salePrice: Number(it.withGstRate) || Number(it.rate) || 0,
              mrp: Number(it.withGstRate) || Number(it.rate) || 0,
              stock: q,
              currentStock: q,
              unit: it.unit || "Pcs",
              barcode: autoBarcode,
              hsnCode: it.hsnCode || "",
              gstRate: Number(it.gstRate) || 0,
              isActive: true,
              companyId: coId,
            };
            updatedProducts.unshift(newProd);
            api.post("/api/inventory", newProd).catch(() => {});

            // Link vendor name to new product code in aliases
            if (it.rawVendorName) {
              aliases[it.rawVendorName.toLowerCase().trim()] = {
                mappedName: it.name,
                barcode: autoBarcode,
                hsnCode: it.hsnCode || ""
              };
            }
          }
        }

        localStorage.setItem("vb_local_products", JSON.stringify(updatedProducts));
        localStorage.setItem("products", JSON.stringify(updatedProducts));
        localStorage.setItem("vb_item_aliases", JSON.stringify(aliases));
        window.dispatchEvent(new CustomEvent("inventory_updated", { detail: { products: updatedProducts } }));
      } catch (stkErr) {
        console.warn("Stock update error:", stkErr);
      }

      // 4. Persist photo cache
      try {
        localStorage.setItem("vb_tx_photos_cache", JSON.stringify(photosCache));
      } catch (e) {}

      // 5. Notify parent app
      if (onBillsSaved) {
        onBillsSaved(createdBills);
      }

      alert(`✅ ${createdBills.length} बिल सफलतापूर्वक दर्ज किए गए! इन्वेंट्री में सभी सामानों का स्टॉक बढ़ गया है और खाता अपडेट हो गया है।`);
      onClose();
    } catch (err) {
      console.error("Save bills error:", err);
      alert("बिल सेव करते समय एरर आया: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-1 sm:p-3 overflow-y-auto">
      <div className={`bg-white flex flex-col shadow-2xl overflow-hidden border border-gray-100 transition-all duration-200 ${
        isFullScreen
          ? "fixed inset-0 sm:inset-2 rounded-none sm:rounded-2xl z-50 max-w-none max-h-none h-full sm:h-[calc(100vh-1rem)]"
          : "rounded-2xl w-full max-w-6xl max-h-[92vh]"
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">स्मार्ट Multi-Page PDF बिल इंपोर्टर</h3>
              <p className="text-xs text-indigo-100">PDF पढ़कर बिल विवरण, आइटम्स और फोटो प्रूफ के साथ दर्ज करें</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-lg border border-white/20 transition cursor-pointer flex items-center gap-1.5"
              title={isFullScreen ? "सामान्य विंडो में देखें" : "बड़ी स्क्रीन / फुल स्क्रीन में देखें"}
            >
              <span>{isFullScreen ? "🗗 सामान्य स्क्रीन" : "⛶ बड़ी स्क्रीन (Full Screen)"}</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Store Products Datalist for Auto-complete */}
        <datalist id="store_products_datalist">
          {(storeProducts || []).map((prod, pIdx) => (
            <option key={pIdx} value={prod.name}>
              {prod.barcode ? `[${prod.barcode}] ` : ""}{prod.name} (स्टॉक: {prod.currentStock || prod.stock || 0})
            </option>
          ))}
        </datalist>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* File Picker / Dropzone */}
          {pages.length === 0 && !loading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px]"
            >
              <span className="text-5xl mb-3">📑</span>
              <h4 className="font-bold text-gray-800 text-base mb-1">अपने बिल की PDF फाइल चुनें</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                यदि 1 PDF में 2, 5 या 10 अलग-अलग बिल हैं, तो यह सिस्टम हर पेज को अलग फोटो बनाएगा और सप्लायर, तारीख और कुल रकम खुद पढ़ लेगा।
              </p>
              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition pointer-events-none"
              >
                PDF अपलोड करें
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h4 className="font-bold text-gray-800 text-base">PDF को पेजों में बांटा जा रहा है...</h4>
              <p className="text-xs text-gray-500 mt-1">हर पेज की HD फोटो और बिल डिटेल्स (पार्टी, आइटम्स, Grand Total) पढ़ी जा रही है।</p>
            </div>
          )}

          {/* Pages / Bills List */}
          {pages.length > 0 && !loading && (
            <div className="space-y-4">
              
              {/* Type selector and summary header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>कुल <strong className="text-indigo-600 text-base">{pages.length}</strong> पेज पहचाने गए</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                    ({pages.filter((p) => p.isSelected).length} चयनित)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">खाता प्रकार:</span>
                  <div className="inline-flex rounded-lg border border-indigo-200 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => setDefaultBillType("Purchase")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        defaultBillType === "Purchase"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      खरीद (Purchase)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultBillType("Sale")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        defaultBillType === "Sale"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      बिक्री (Sale)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAiScanAllPages}
                    disabled={aiScanningAll}
                    className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95 ml-2"
                    title="Gemini/OpenAI Vision से सभी बिलों का सही सामान व रेट निकालें"
                  >
                    {aiScanningAll ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>AI स्कैन जारी...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖 AI से सभी बिल बनाएं</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline ml-2 cursor-pointer"
                  >
                    बदलें
                  </button>
                </div>
              </div>

              {pages.map((p, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-3.5 transition ${
                    p.isSelected
                      ? "border-indigo-400 bg-white shadow-sm ring-1 ring-indigo-100"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Thumbnail Preview */}
                    <div className="relative group shrink-0 w-full sm:w-28 h-36 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                      <img
                        src={getWebSafeImageUrl(p.imageUrl)}
                        alt={`Page ${p.pageNumber}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(p.imageUrl)}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(p.imageUrl)}
                        className="absolute inset-0 bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition font-semibold cursor-pointer"
                      >
                        🔍 बड़ा देखें
                      </button>
                      <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                        पेज {p.pageNumber}
                      </span>
                    </div>

                    {/* Form Fields for this Bill */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.isSelected}
                            onChange={() => toggleSelectPage(idx)}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-xs font-black text-gray-900">
                            पेज {p.pageNumber} को अलग बिल के रूप में दर्ज करें
                          </span>
                        </label>

                        {/* Payment Mode Selector: Cash vs Udhar */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 pl-1">भुगतान:</span>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(idx, "paymentMode", "CASH")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                              (p.paymentMode || "CASH") === "CASH"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            💵 नकद (Cash - दुकान गल्ला)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(idx, "paymentMode", "UDHAR")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                              p.paymentMode === "UDHAR"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-transparent text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ⏳ उधारी (Udhar / Credit)
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAiScanPage(idx)}
                            disabled={aiScanningPages[idx]}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                              aiScanningPages[idx]
                                ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                : p.aiParsed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent hover:from-purple-700 hover:to-indigo-700 shadow-2xs"
                            }`}
                            title="AI Vision (Gemini / ChatGPT) से इस पेज का सामान, दर और विवरण निकालें"
                          >
                            {aiScanningPages[idx] ? (
                              <>
                                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                                <span>AI पढ़ रहा है...</span>
                              </>
                            ) : p.aiParsed ? (
                              <>
                                <span>✨ AI स्कैन पूरा</span>
                                <span className="text-[10px] text-emerald-600 font-black">✓</span>
                              </>
                            ) : (
                              <>
                                <span>🤖 AI से बिल बनाएं</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewImage(p.imageUrl)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100"
                          >
                            👁️ बिल फोटो देखें
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-gray-500 font-medium">पार्टी / सप्लायर नाम</label>
                          <input
                            type="text"
                            value={p.partyName}
                            onChange={(e) => handleFieldChange(idx, "partyName", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800"
                            placeholder="सप्लायर का नाम"
                          />
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium">बिल / इनवॉइस नंबर</label>
                          <input
                            type="text"
                            value={p.billNumber}
                            onChange={(e) => handleFieldChange(idx, "billNumber", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800"
                            placeholder="बिल नं"
                          />
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium">तारीख (Bill Date)</label>
                          <input
                            type="date"
                            value={p.date}
                            onChange={(e) => handleFieldChange(idx, "date", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-800"
                          />
                        </div>

                        <div>
                          <label className="text-indigo-700 font-bold flex items-center justify-between">
                            <span>कुल रकम (Grand Total ₹)</span>
                            {p.totalAmount > 0 && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                                ऑटो-डिटेक्टेड
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            value={p.totalAmount}
                            onChange={(e) => handleFieldChange(idx, "totalAmount", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border-2 border-indigo-400 bg-indigo-50/40 rounded-md focus:ring-2 focus:ring-indigo-500 font-extrabold text-indigo-800 text-sm"
                            placeholder="₹ 0.00"
                          />
                        </div>
                      </div>

                      {/* Items Section with Pre-GST, With-GST, and Less Support */}
                      {p.isSelected && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                              📦 सामान / आइटम्स ({(p.items || []).length}):
                            </span>
                            
                            {/* Quick GST batch applicator */}
                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-500">⚡ GST लगाएं:</span>
                              {[0, 5, 12, 18, 28].map((slab) => (
                                <button
                                  key={slab}
                                  type="button"
                                  onClick={() => handleApplyBatchGst(idx, slab)}
                                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white hover:bg-indigo-600 hover:text-white border border-slate-300 text-slate-700 transition cursor-pointer"
                                  title={`सभी सामान पर ${slab}% GST लगाएं`}
                                >
                                  {slab}%
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddItem(idx)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                            >
                              + नया सामान जोड़ें
                            </button>
                          </div>

                          {/* Table Header */}
                          <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 mb-1">
                            <span className="col-span-4">सामान का नाम</span>
                            <span className="col-span-2 text-center">मात्रा (Qty)</span>
                            <span className="col-span-2 text-right">दर (With-GST ₹)</span>
                            <span className="col-span-2 text-right">रकम (₹)</span>
                            <span className="col-span-1 text-center">GST/छूट</span>
                            <span className="col-span-1 text-center">हटाएं</span>
                          </div>

                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {(p.items || []).map((it, itemIdx) => {
                              const itemAmt = Number(it.amount || ((Number(it.qty) || 1) * (Number(it.rate) || 0)));
                              const isExp = expandedItems[`${idx}_${itemIdx}`];

                              return (
                                <div key={itemIdx} className="space-y-1">
                                  <div
                                    className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-lg border text-xs transition ${
                                      isExp ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200" : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div className="col-span-4">
                                      <input
                                        type="text"
                                        value={it.name}
                                        onChange={(e) => handleItemChange(idx, itemIdx, "name", e.target.value)}
                                        placeholder="सामान का नाम (टाइप करें या लिस्ट से चुनें)"
                                        list="store_products_datalist"
                                        className="w-full bg-white px-2 py-1 rounded border border-gray-300 text-xs font-bold text-gray-800"
                                      />
                                      {it.rawVendorName && it.rawVendorName.toLowerCase().trim() !== (it.name || '').toLowerCase().trim() && (
                                        <div className="text-[9px] text-emerald-700 font-bold mt-0.5 truncate flex items-center gap-1" title={`सप्लायर नाम: ${it.rawVendorName}`}>
                                          <span>🔗 लिंक्ड:</span> <span className="bg-emerald-100/90 text-emerald-800 px-1 py-0.2 rounded font-mono">{it.rawVendorName}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={it.qty ?? 1}
                                        onChange={(e) => handleItemChange(idx, itemIdx, "qty", e.target.value)}
                                        className="w-full bg-white px-1 py-1 rounded border border-gray-300 text-xs text-center font-bold"
                                        placeholder="Qty"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={it.withGstRate || it.rate || ""}
                                        onChange={(e) => handleItemChange(idx, itemIdx, "withGstRate", e.target.value)}
                                        className="w-full bg-white px-1 py-1 rounded border border-gray-300 text-xs text-right font-bold text-indigo-700"
                                        placeholder="दर ₹"
                                      />
                                      <div className="text-[9px] text-gray-500 text-right truncate">
                                        Pre: ₹{it.preGstRate || it.rate || 0} {it.gstRate > 0 ? `+${it.gstRate}%` : ""}
                                      </div>
                                    </div>
                                    <div className="col-span-2 text-right pr-1">
                                      <span className="font-extrabold text-slate-800 text-xs block truncate" title={`₹${itemAmt.toLocaleString("en-IN")}`}>
                                        ₹{itemAmt.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandItem(idx, itemIdx)}
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${
                                          isExp ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                        }`}
                                        title="Pre-GST, GST% व Less (छूट) सेट करें"
                                      >
                                        {isExp ? "▲ बंद" : "⚡ GST"}
                                      </button>
                                    </div>
                                    <div className="col-span-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx, itemIdx)}
                                        className="text-rose-500 hover:text-rose-700 p-0.5 font-bold cursor-pointer"
                                        title="हटाएं"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expandable GST & Less Editor Box */}
                                  {isExp && (
                                    <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5 space-y-2 text-xs animate-in fade-in">
                                      <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                                        <span className="font-extrabold text-indigo-900 text-[11px] flex items-center gap-1">
                                          🧮 GST व छूट (Less) कैलकुलेटर: {it.name || "सामान"}
                                        </span>
                                        <span className="text-[10px] text-indigo-600 font-semibold">
                                          (दोनों तरफ से ऑटोमैटिक गणना)
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {/* 1. Pre-GST Base Rate */}
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                            📝 Pre-GST दर (Base ₹)
                                          </label>
                                          <input
                                            type="number"
                                            step="any"
                                            value={it.preGstRate ?? ""}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "preGstRate", e.target.value)}
                                            placeholder="उदा. 84.75"
                                            className="w-full bg-white px-2 py-1 rounded border border-gray-300 font-bold text-indigo-900 text-xs"
                                          />
                                          <span className="text-[9px] text-gray-500">बिना GST की दर</span>
                                        </div>

                                        {/* 2. Less / Discount */}
                                        <div>
                                          <div className="flex justify-between items-center mb-0.5">
                                            <label className="text-[10px] font-bold text-gray-700">🏷️ Less (छूट)</label>
                                            <button
                                              type="button"
                                              onClick={() => handleItemChange(idx, itemIdx, "lessType", it.lessType === "%" ? "flat" : "%")}
                                              className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                                            >
                                              {it.lessType === "%" ? "% प्रतिशत" : "₹ फिक्स"}
                                            </button>
                                          </div>
                                          <input
                                            type="number"
                                            step="any"
                                            value={it.less ?? ""}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "less", e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white px-2 py-1 rounded border border-gray-300 font-bold text-amber-700 text-xs"
                                          />
                                          <span className="text-[9px] text-amber-600">
                                            {it.less > 0 ? (it.lessType === "%" ? `-${it.less}% छूट` : `-₹${it.less}/इकाई`) : "छूट नहीं"}
                                          </span>
                                        </div>

                                        {/* 3. GST % Slabs */}
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                            📊 GST दर (%)
                                          </label>
                                          <select
                                            value={it.gstRate ?? 0}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "gstRate", e.target.value)}
                                            className="w-full bg-white px-1.5 py-1 rounded border border-gray-300 font-bold text-indigo-700 text-xs"
                                          >
                                            <option value={0}>0% (टैक्स मुक्त)</option>
                                            <option value={5}>5% GST (2.5% + 2.5%)</option>
                                            <option value={12}>12% GST (6% + 6%)</option>
                                            <option value={18}>18% GST (9% + 9%)</option>
                                            <option value={28}>28% GST (14% + 14%)</option>
                                          </select>
                                          <span className="text-[9px] text-gray-500">
                                            टैक्स: ₹{(Number(it.gstAmount) || 0).toLocaleString("en-IN")}
                                          </span>
                                        </div>

                                        {/* 4. With-GST Rate */}
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                            💰 With-GST दर (Final ₹)
                                          </label>
                                          <input
                                            type="number"
                                            step="any"
                                            value={it.withGstRate ?? ""}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "withGstRate", e.target.value)}
                                            placeholder="उदा. 100.00"
                                            className="w-full bg-white px-2 py-1 rounded border border-emerald-400 font-extrabold text-emerald-800 text-xs"
                                          />
                                          <span className="text-[9px] text-emerald-600">फाइनल रेट</span>
                                        </div>
                                      </div>

                                      {/* HSN, Barcode, Unit, and Alias Memory */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-indigo-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">🏷️ HSN कोड</label>
                                          <input
                                            type="text"
                                            value={it.hsnCode || ""}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "hsnCode", e.target.value)}
                                            placeholder="उदा. 8517"
                                            className="w-full bg-white px-2 py-1 rounded border border-gray-300 font-bold text-gray-800 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">📊 बारकोड / कोड</label>
                                          <input
                                            type="text"
                                            value={it.barcode || ""}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "barcode", e.target.value)}
                                            placeholder="उदा. BC-1001"
                                            className="w-full bg-white px-2 py-1 rounded border border-gray-300 font-bold text-gray-800 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">📦 इकाई (Unit)</label>
                                          <input
                                            type="text"
                                            value={it.unit || "pcs"}
                                            onChange={(e) => handleItemChange(idx, itemIdx, "unit", e.target.value)}
                                            placeholder="pcs / box / kg"
                                            className="w-full bg-white px-2 py-1 rounded border border-gray-300 font-bold text-gray-800 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">🔗 सप्लायर बिल नाम</label>
                                          <div className="text-[10px] text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 truncate font-semibold" title={it.rawVendorName || it.name}>
                                            {it.rawVendorName || it.name}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Formula explanation preview */}
                                      <div className="bg-white/90 p-1.5 rounded border border-indigo-100 flex flex-wrap items-center justify-between text-[11px] text-slate-700 font-medium">
                                        <span>
                                          <strong>₹{it.preGstRate || 0}</strong> (Pre-GST)
                                          {Number(it.less) > 0 && <span className="text-amber-700 font-bold"> - ₹{it.less} (Less)</span>}
                                          {Number(it.gstRate) > 0 && <span className="text-indigo-700 font-bold"> + {it.gstRate}% GST (₹{Math.round(((it.withGstRate || 0) - (it.preGstRate || 0) + (Number(it.less) || 0)) * 100) / 100})</span>}
                                          {" = "}
                                          <span className="text-emerald-700 font-black">₹{it.withGstRate || 0} (With-GST)</span>
                                        </span>
                                        <span className="font-bold text-slate-900">
                                          योग: {it.qty} × ₹{it.withGstRate || 0} = <span className="text-emerald-700 font-black">₹{(itemAmt || 0).toLocaleString("en-IN")}</span>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Page Summary Strip */}
                          <div className="mt-2.5 pt-2 border-t border-dashed border-gray-300 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 block">टैक्सेबल मूल्य:</span>
                              <span className="font-bold text-slate-800">
                                ₹{Math.round((p.items || []).reduce((s, it) => s + (Number(it.taxableAmount) || ((Number(it.preGstRate) || Number(it.rate) || 0) * (Number(it.qty) || 1))), 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-600 block">कुल छूट (Less):</span>
                              <span className="font-bold text-amber-700">
                                -₹{Math.round((p.items || []).reduce((s, it) => {
                                  const l = Number(it.less) || 0;
                                  const q = Number(it.qty) || 1;
                                  const pr = Number(it.preGstRate) || 0;
                                  return s + (it.lessType === "%" ? (pr * l / 100) * q : l * q);
                                }, 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-indigo-600 block">कुल GST:</span>
                              <span className="font-bold text-indigo-700">
                                +₹{Math.round((p.items || []).reduce((s, it) => s + (Number(it.gstAmount) || 0), 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-bold">फाइनल बिल टोटल:</span>
                              <span className="font-extrabold text-emerald-800 text-sm">
                                ₹{Math.round(p.totalAmount || (p.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
          >
            रद्द करें
          </button>

          {pages.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAllBills}
              disabled={saving || pages.filter((p) => p.isSelected).length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? "सेव हो रहा है..." : `💾 बिल स्वीकार करें और खाते में जोड़ें (${pages.filter((p) => p.isSelected).length} बिल)`}
            </button>
          )}
        </div>

      </div>

      {/* Full Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] flex flex-col items-center">
            <img
              src={getWebSafeImageUrl(previewImage)}
              alt="Bill Full Preview"
              className="max-h-[85vh] w-auto rounded-xl shadow-2xl object-contain bg-white"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-3 bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-full font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              ✕ बंद करें
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
