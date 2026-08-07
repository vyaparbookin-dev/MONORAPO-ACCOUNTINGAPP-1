# Project Scripts — Documentation & Cleanup Guide

Teeno zip folders (`scripts-all copy`, `scripts-all`, `scripts`) padh kar ye document banaya hai. Har script ka kaam, use kaise karna hai, aur konsa **rakhna hai / delete karna hai** — sab neeche hai.

---

## 🔴 SABSE PEHLE: Poora `scripts-all copy` folder DELETE kar do

Maine `scripts-all copy/` ke har file ko `scripts-all/` ke corresponding file se byte-by-byte compare kiya — **sab 100% identical hain** (`check-imports.js`, `find-duplicates.cjs`, `generate-tree-script.js`, `generate-tree.cjs`, `scan-project.cjs`, `show-ip.js`, `scripts/analyze-project.js`, `scripts/project-tree.js`, `file-tree`). Ye ek purani copy-paste ki hui duplicate folder hai jisme koi naya/alag content nahi hai — bas `scripts-all` me 2 extra files (`run-diagnostics.js`, `generate-full-tree.cjs`) hain jo copy me nahi hain.

**Action: `scripts-all copy/` poora delete kar do.** Neeche sirf `scripts-all/` aur `scripts/` ke unique scripts document kiye hain.

---

## 📁 Folder: `scripts-all/`

### 1. `show-ip.js`
**Kaam:** Tumhare computer ka local network IP address (WiFi/LAN) print karta hai.
**Kab use karo:** Jab mobile app (Expo) ko physical phone pe test karna ho aur backend ka local IP address `mobile/src/services/config.js` me set karna ho.
**Kaise chalao:**
```
node scripts-all/show-ip.js
```
**Rakho ya hatao:** ✅ Rakho — genuinely useful hai, mobile dev ke liye zaroori.

---

### 2. `check-imports.js`
**Kaam:** Ek single app (jahan se chalao, jaise `apps/web`) ke andar sabhi `import` statements check karta hai — dhoondta hai:
- **Broken links** — jo file import ki hai wo exist hi nahi karti
- **Case mismatch** — jaise `import X from './Button'` likha lekin file `button.jsx` hai (capital/small letter ka farak)
**Kab use karo:** Web/desktop app me koi screen add/rename karne ke baad, ye check karne ke liye ki koi import toota to nahi.
**Kaise chalao:** (root se nahi — us app ke folder ke andar se, kyunki `SRC_DIR` aur `APP_JS` `__dirname` pe based hain)
```
cd apps/web
node ../../scripts-all/check-imports.js
```
⚠️ Note: Is script ko us app folder me copy karke chalana better hai (`__dirname` base hai), warna galat folder scan hoga.
**Rakho ya hatao:** ✅ Rakho — bahut useful, maine khud web ka audit karte waqt yahi kaam manually kiya tha.

---

### 3. `find-duplicates.cjs`
**Kaam:** Ek app ke `src/` folder me **content-identical duplicate files** dhoondta hai (file ka hash/checksum compare karke) — matlab do files jo bilkul same content ki hain, chahe naam kuch bhi ho.
**Kab use karo:** Jaise maine abhi tumhare scripts folders me `scripts-all copy` ko duplicate pakda — waisi hi cheez tumhare app ke src code me bhi ho sakti hai (jaise purani/nayi copy dono reh gayi ho).
**Kaise chalao:**
```
cd apps/web        # ya jo bhi app check karni hai
node ../../scripts-all/find-duplicates.cjs
```
**Rakho ya hatao:** ✅ Rakho — periodic cleanup ke liye acha hai.

---

### 4. `generate-tree-script.js`
**Kaam:** Jahan se chalao (current working directory), uska pura folder tree bana kar `project-tree-full.txt` me save karta hai. `node_modules`, `.git`, `build`, `dist`, `.expo`, `.next`, `android` waghera ignore karta hai.
**Kaise chalao:**
```
node scripts-all/generate-tree-script.js
```
(jis folder me chalaoge, usi ka tree banega — `process.cwd()` use hota hai)

---

### 5. `generate-tree.cjs`
**Kaam:** Same kaam — folder tree banata hai, lekin ye `__dirname` based hai (jahan script hai, waha se upar ka tree) aur output `project-tree.txt` me save karta hai.
**Kaise chalao:**
```
node scripts-all/generate-tree.cjs
```

### 6. `generate-full-tree.cjs`
**Kaam:** Ye poore **project root** (`__dirname/..`) ka tree banata hai (Electron `dist_electron` bhi ignore list me hai), aur `full_structure_tree.txt` root me save karta hai.
**Kaise chalao:**
```
node scripts-all/generate-full-tree.cjs
```

> ⚠️ **`generate-tree-script.js`, `generate-tree.cjs`, aur `generate-full-tree.cjs` — teeno LAGBHAG same kaam karte hain** (folder tree print karna), bas thoda alag scope/output-filename ke saath. Tumhe teeno rakhne ki zaroorat nahi — jo tumne mujhe project tree bheja tha wo shaayad inhi me se kisi ek ka output tha. **Recommendation: sirf `generate-full-tree.cjs` rakho** (sabse complete/latest version lagta hai, poore root ka tree banata hai), baaki 2 delete kar do.

---

### 7. `scan-project.cjs`
**Kaam:** Ek app ke `src/` folder ke andar **unused imports aur unused files** dhoondne ki koshish karta hai (kaunsi files kahin import hi nahi ho rahi).
**Kaise chalao:**
```
cd apps/web
node ../../scripts-all/scan-project.cjs
```
**Rakho ya hatao:** ✅ Rakho — bahut kaam ki cheez hai, especially tumhare jaise bade codebase me jahan purani/dead screens reh gayi ho sakti hain.

---

### 8. `run-diagnostics.js`
**Kaam:** Ye ek "master runner" hai — khud kuch scan nahi karta, balki `generate-tree.cjs` aur root ki `scan-project-health.js` (jo tumne abhi bheji nahi hai) ko **ek ke baad ek automatically chalata hai**, taaki tumhe har script alag se na chalani pade.
**Andar `targetApps = ['web', 'desktop']`** hardcoded hai — matlab abhi ye sirf web+desktop scan karta hai, mobile nahi. Agar mobile bhi chahiye to is line ko `['web', 'desktop', 'mobile']` karna hoga.
**Kaise chalao:**
```
node scripts-all/run-diagnostics.js
```
**Rakho ya hatao:** ✅ Rakho — sabse convenient script hai teeno tools me se, ek command me sab chal jaata hai.

---

### 9. `scripts/analyze-project.js` (scripts-all ke andar wala sub-folder)
**Kaam:** Ye specifically **mobile app** ke liye bana hai (`projectRoot = __dirname/..`, mobile-specific ignore list jaise `.expo`, `android`, `ios`). Sabhi imports collect karta hai — local imports, package imports (npm libraries), aur **broken imports** ki list banata hai.
**Kaise chalao:** (mobile folder ke andar se)
```
cd apps/mobile
node scripts/analyze-project.js
```
**Rakho ya hatao:** ✅ Rakho — mobile ke liye `check-imports.js` jaisa hi kaam karta hai, dono milke complete coverage dete hain.

---

### 10. `scripts/project-tree.js`
**Kaam:** Sirf mobile app ka tree console pe print karta hai (file me save nahi karta, direct terminal output).
**Kaise chalao:**
```
cd apps/mobile
node scripts/project-tree.js
```

---

### 11. `scripts/project-structure-mobile` — ⚠️ Ye SCRIPT nahi hai
Ye `project-tree.js` chalane ka **saved output/result** hai (mobile ka tree text file ke roop me), koi executable script nahi. Naam se confusion ho sakta hai kyunki extension nahi hai.
**Rakho ya hatao:** 🗑️ Delete kar sakte ho — ye sirf ek purana snapshot hai, jab chaho `project-tree.js` dobara chala kar fresh output le sakte ho.

---

### 12. `project-tree.txt`
Ye bhi ek **output file** hai (`generate-tree.cjs` chalane ka result), script nahi.
**Rakho ya hatao:** 🗑️ Delete kar sakte ho, dobara generate ho sakti hai.

---

### 13. `file-tree` — ⚠️ Ye bhi script nahi hai
Ye ek **manually likha hua planning note** hai (Hindi comments ke saath, jaise "यह यहीं रहेगा क्योंकि..." — refactoring plan) — script ka output nahi, balki tumne/kisi ne hath se likha documentation hai project restructuring ke baare me.
**Rakho ya hatao:** Tumhari marzi — agar wo planning abhi bhi relevant hai to rakho, warna delete.

---

## 📁 Folder: `scripts/` (teesri zip)

### 14. `audit-shared-usage.js`
**Kaam:** Check karta hai ki `@repo/shared` package ke `utils/` aur `services/` folder — web, desktop, mobile, backend, in **charo apps** me kitna use ho rahe hain. Ek report banata hai `audit-report.txt` me (root me save hoti hai).
**Kaise chalao:**
```
node scripts/audit-shared-usage.js
```
**Rakho ya hatao:** ✅ Rakho — bahut relevant hai, kyunki maine tumhare shared package ke audit me exactly yahi dekha (`apiRoutes.js` sirf 2 files me use ho raha tha) — ye script wahi cheez automate kar deti hai.

---

### 15. `check-shared-imports.js` (root wala, `scripts/check-shared-imports.js`)
**Kaam:** Web, Desktop, Mobile — teeno apps me `@repo/shared` import karne wali **files ki poori list** print karta hai (file names ke saath).
**Kaise chalao:**
```
node scripts/check-shared-imports.js
```
**Rakho ya hatao:** ✅ Rakho — ye newer/better version hai (neeche wale se compare karo).

### 16. `scripts/scripts/check-shared-imports.js` — ⚠️ DUPLICATE, PURANA VERSION
Maine dono files compare kiye — ye same script ka **purana version** hai (sirf count print karta hai, file names nahi). Ek extra nested `scripts/scripts/` folder ke andar galti se reh gaya lagta hai.
**Rakho ya hatao:** 🗑️ **Delete karo** — `scripts/check-shared-imports.js` (upar wala, #15) already better version hai isi kaam ka.

---

### 17. `find-service-usage.js`
**Kaam:** Specific hardcoded list of mobile service files (`Api.js`, `ApiService.js`, `cloudsyncservices.js`, `config.js`, `encryptionservice.js`, etc.) — ye check karta hai ki ye files kahin use ho rahi hain ya nahi (safe-to-delete check).
**Kaise chalao:**
```
node scripts/find-service-usage.js
```
**Rakho ya hatao:** ✅ Rakho, lekin note karo ki ismein file names **hardcoded** hain — jab bhi naya service file banao, is script ki list update karni padegi.

---

### 18. `find-usage.js`
**Kaam:** `find-service-usage.js` jaisa hi, lekin **web app ke utils/services** (`calculateTax.jsx`, `currency.jsx`, `formateDate.jsx`, etc.) ke liye hardcoded check karta hai — "safe to delete" ya "usage found" batata hai.
**Kaise chalao:**
```
node scripts/find-usage.js
```
**Rakho ya hatao:** ✅ Rakho.

---

### 19. `find-usage.ps1`
**Kaam:** `find-usage.js` ka **hi kaam, PowerShell version** (Windows ke liye, bina Node.js chalaye direct PowerShell se).
**Kaise chalao:** (PowerShell me)
```
.\scripts\find-usage.ps1
```
**Rakho ya hatao:** Tumhari marzi — agar tum hamesha Node se hi scripts chalate ho to ye redundant hai (`find-usage.js` wahi kaam karta hai), delete kar sakte ho. Agar kabhi PowerShell-only environment me kaam karna pade to rakh lo.

---

### 20. `find-usage-script-details` — ⚠️ Ye script nahi hai
Ye `find-usage.js` chalane ka **saved terminal output/log** hai (poora console output copy-paste kiya hua, PowerShell prompt ke saath).
**Rakho ya hatao:** 🗑️ Delete karo — purana snapshot hai, dobara script chalao to fresh result mil jayega.

---

### 21. `project -shared-files-details.txt` — ⚠️ Ye bhi script nahi hai
Ye ek **saved AI chat conversation** hai (Hindi me, "wrapper files" ke baare me discussion) — kisi purani ChatGPT/Claude conversation ka copy-paste note hai, koi script ya scan result nahi.
**Rakho ya hatao:** 🗑️ Delete kar sakte ho, ya agar wo context/decision important tha to kisi `notes/` folder me move kar do — `scripts/` folder me iska koi matlab nahi.

---

### 22. `audit-report.txt`
`audit-shared-usage.js` chalane ka saved output.
**Rakho ya hatao:** 🗑️ Delete kar sakte ho, dobara generate ho jayega.

---

## 📋 Summary Table — Kya Rakhna Hai, Kya Hatana Hai

| # | File | Type | Action |
|---|---|---|---|
| — | **`scripts-all copy/` (pura folder)** | 100% duplicate | 🗑️ **DELETE poora folder** |
| 1 | `show-ip.js` | Script | ✅ Rakho |
| 2 | `check-imports.js` | Script | ✅ Rakho |
| 3 | `find-duplicates.cjs` | Script | ✅ Rakho |
| 4 | `generate-tree-script.js` | Script | 🗑️ Delete (redundant, #6 kaafi hai) |
| 5 | `generate-tree.cjs` | Script | 🗑️ Delete (redundant, #6 kaafi hai) |
| 6 | `generate-full-tree.cjs` | Script | ✅ **Rakho (sirf ye ek tree-generator)** |
| 7 | `scan-project.cjs` | Script | ✅ Rakho |
| 8 | `run-diagnostics.js` | Script | ✅ Rakho (master runner) |
| 9 | `scripts/analyze-project.js` | Script (mobile) | ✅ Rakho |
| 10 | `scripts/project-tree.js` | Script (mobile) | ✅ Rakho |
| 11 | `scripts/project-structure-mobile` | Output file | 🗑️ Delete |
| 12 | `project-tree.txt` | Output file | 🗑️ Delete |
| 13 | `file-tree` | Manual note | Tumhari marzi |
| 14 | `scripts/audit-shared-usage.js` | Script | ✅ Rakho |
| 15 | `scripts/check-shared-imports.js` | Script | ✅ Rakho (better version) |
| 16 | `scripts/scripts/check-shared-imports.js` | Duplicate (purana) | 🗑️ Delete |
| 17 | `scripts/find-service-usage.js` | Script | ✅ Rakho |
| 18 | `scripts/find-usage.js` | Script | ✅ Rakho |
| 19 | `scripts/find-usage.ps1` | Script (Windows alt.) | Tumhari marzi |
| 20 | `find-usage-script-details` | Output log | 🗑️ Delete |
| 21 | `project -shared-files-details.txt` | Chat note | 🗑️ Delete / move to notes |
| 22 | `audit-report.txt` | Output file | 🗑️ Delete |

**Result:** 22 items me se sirf **~11 asli reusable scripts** hain, baaki duplicates, purane outputs, ya notes hain jo safely hata sakte ho.

---

## 💡 Suggestion (agar chaho)
Agar tum in bache hue 11 scripts ko ek jagah organize karna chaho, to ek clean structure ho sakta hai:
```
tools/
├── health-check/
│   ├── run-diagnostics.js       (master — sabse pehle ye chalao)
│   ├── generate-full-tree.cjs
│   ├── scan-project.cjs
│   ├── find-duplicates.cjs
│   └── check-imports.js
├── shared-audit/
│   ├── audit-shared-usage.js
│   └── check-shared-imports.js
├── usage-check/
│   ├── find-usage.js
│   └── find-service-usage.js
├── mobile/
│   ├── analyze-project.js
│   └── project-tree.js
└── show-ip.js
```
Bata do agar ye reorganize bhi karwana hai — main folder structure bana kar de sakta hoon.

