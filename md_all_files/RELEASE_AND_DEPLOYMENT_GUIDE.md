# 🚀 Red Accounting Book - Complete Release, Build & Deployment Guide

इस गाइड में **Desktop App (.exe)**, **Mobile App (.apk)** और **GitHub Releases** की संपूर्ण प्रक्रिया और डायरेक्ट लिंक्स दिए गए हैं।

---

## 🔗 महत्वपूर्ण डायरेक्ट लिंक्स (Quick Direct Links)

| प्लेटफार्म / टूल | सीधा लिंक | विवरण |
| :--- | :--- | :--- |
| 🤖 **GitHub Actions APK Builder** | [Build Android APK Console](https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/actions/workflows/build-android.yml) | 1-क्लिक में फ्री और अनलिमिटेड मोबाइल APK तैयार करें |
| 🌐 **GitHub Releases Page** | [All Releases Console](https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases) | सभी पब्लिश किए गए वर्जन (.exe व .apk) |
| ✏️ **v1.2.0 Release (Edit)** | [v1.2.0 Release Page](https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/tag/v1.2.0) | v1.2.0 में APK जोड़ने हेतु एडिट पेज |

---

## 📱 1. Android Mobile App (.apk) डाउनलोड और रिलीज प्रक्रिया

### **A. APK डाउनलोड कैसे करें?**
1. [GitHub Actions Workflow Runs](https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/actions/workflows/build-android.yml) पर जाएँ।
2. सबसे ऊपर वाले **सफल रन (Green Tick ✅)** पर क्लिक करें।
3. नीचे स्क्रॉल करके **"Artifacts"** सेक्शन में **`Red-Accounting-Book-Mobile-APK`** पर क्लिक करें।
4. यह एक `.zip` फ़ाइल के रूप में आपके कंप्यूटर के **Downloads** फोल्डर में आ जाएगी।

### **B. Zip अपलोड करें या Unzip?**
> [!IMPORTANT]
> **हमेशा Unzip करके सिर्फ `.apk` फ़ाइल अपलोड करें!**
> 1. डाउनलोड हुई ज़िप फ़ाइल पर राइट-क्लिक करके **"Extract All" (Unzip)** करें।
> 2. उसके अंदर से **`app-debug.apk`** या **`app-release.apk`** फ़ाइल को कॉपी करके उसका नाम **`Red-Accounting-Book-1.2.0.apk`** रख लें।
> 3. केवल इस **`.apk` फ़ाइल** को GitHub Releases में अपलोड करें, ताकि मोबाइल उपयोगकर्ता सीधे 1-टैप में इंस्टॉल कर सकें।

### **C. प्रोजेक्ट में स्थायी सुरक्षित कॉपी रखना:**
अपने कंप्यूटर में इसे यहाँ सुरक्षित रख लें ताकि यह कभी खोए नहीं:
```text
C:\Users\Lenovo1\Desktop\monorapo-accountingapp-1\release_artifacts\mobile\Red-Accounting-Book-1.2.0.apk
```

---

## 💻 2. Windows Desktop App (.exe) फ़ाइल लोकेशन

विंडोज डेस्कटॉप का इंस्टॉलर आपके प्रोजेक्ट में स्थायी रूप से यहाँ मौजूद है:
```text
C:\Users\Lenovo1\Desktop\monorapo-accountingapp-1\apps\desktop\dist_electron\Red Accounting Book Setup 1.2.0.exe
```
और इसकी बैकअप कॉपी:
```text
C:\Users\Lenovo1\Desktop\monorapo-accountingapp-1\release_artifacts\desktop\Red Accounting Book Setup 1.2.0.exe
```

---

## 🌐 3. GitHub Releases में .exe और .apk दोनों को एक साथ कैसे जोड़ें?

1. सीधे इस लिंक पर जाएँ: 👉 **[v1.2.0 Release Edit Page](https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/tag/v1.2.0)**
2. ऊपर दाईं ओर **✏️ Edit release** पर क्लिक करें।
3. नीचे **"Attach binaries by dropping them here"** बॉक्स में इन दोनों फाइल्स को खींचकर (Drag & Drop) छोड़ें:
   - 📱 **`Red-Accounting-Book-1.2.0.apk`** (Unzipped APK फ़ाइल)
   - 💻 **`Red Accounting Book Setup 1.2.0.exe`** (Windows Installer)
4. नीचे हरे बटन **"Update release"** पर क्लिक कर दें।

---

## 🗄️ 4. Supabase Database Migrations (001 - 031)
सभी डेटाबेस माइग्रेशन फाइल्स प्रोजेक्ट में यहाँ मौजूद हैं:
```text
apps/backend/supabase/migrations/
├── 001_initial_schema.sql
├── ...
├── 029_enhance_restaurant_and_banquet.sql
├── 030_enhance_electronics_and_appliances.sql
└── 031_add_salon_automobile_and_rma.sql
```
