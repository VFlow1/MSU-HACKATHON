# สถาปัตยกรรมระบบ (System Architecture) - AI-Driven Task & Learning Management Ecosystem

เอกสารฉบับนี้อธิบายโครงสร้าง สถาปัตยกรรมปัญญาประดิษฐ์ และการไหลเวียนข้อมูลภายในระบบจัดการงานและพัฒนาทักษะ (Phase 2 Upgrade)

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture Overview)

ระบบถูกพัฒนาขึ้นในรูปแบบ **Client-side Web Application** (ทำงานบนเบราว์เซอร์ของผู้ใช้ทั้งหมดแบบไร้ Server-side ประมวลผล) โดยใช้การเชื่อมต่อและดึงข้อมูลของบริการ AI ต่างๆ จากภายนอกโดยตรง ผ่านแผนผังการทำงานหลักดังนี้:

```mermaid
graph TD
    User([ผู้ใช้งาน]) -->|1. ป้อนข้อมูล / สั่งงาน| UI[HTML5/CSS3 Dashboard UI]
    
    subgraph Client-side Engine (เบราว์เซอร์)
        UI -->|2. โหลดหน้าจอ| App[js/app.js - Logic & Router]
        App -->|3. ดึงคีย์ลับเมื่อโหลดหน้า| Env[js/data.js - loadEnvConfig]
        Env -.->|อ่านไฟล์| EnvFile[/.env File]
        App -->|4. รัน UI สรุปสถิติ| DB[(LocalStorage Database)]
    end
    
    subgraph Multi-API Router (การจัดเส้นทาง AI)
        App -->|วิเคราะห์เชิงลึก / Insights / Agent| CallAnalysis[callAnalysisAI]
        App -->|ตอบคำถามด่วน / Chatbot| CallChat[callChatAI]
        
        CallAnalysis -->|1st Priority| Gemini[Google Gemini API]
        CallAnalysis -->|2nd Priority| OR_Analysis[OpenRouter - Free Router]
        CallAnalysis -->|3rd Priority| Groq_Analysis[Groq Cloud - Llama 3]
        CallAnalysis -->|4th Priority| Local_Analysis[Local Rule-based Simulator]
        
        CallChat -->|1st Priority| Groq[Groq Cloud API]
        CallChat -->|2nd Priority| OR_Chat[OpenRouter - Free Router]
        CallChat -->|3rd Priority| Gemini_Chat[Google Gemini API]
        CallChat -->|4th Priority| Local_Chat[Local Keyword-based Chat]
    end

    Gemini -->|ส่งคำตอบกลับ| UI
    Groq -->|ส่งคำตอบกลับ| UI
    OR_Analysis -->|ส่งคำตอบกลับ| UI
    Local_Analysis -->|ส่งคำตอบกลับ| UI
```

---

## 2. การจัดเส้นทางและการสำรองข้อมูล (Multi-API Routing & Failover)

เพื่อเสถียรภาพและความคุ้มค่าสูงสุด ระบบได้รับการวางเส้นทาง (Routing) ให้สลับสายการประมวลผลอัตโนมัติหากพบว่ามีคีย์ไม่พร้อมใช้งานหรือ API เกิดการปิดกั้น:

### 2.1 แผนกวิเคราะห์และวางแผน (Heavy Analysis Workflow)
ใช้งานผ่านฟังก์ชัน `callAnalysisAI(promptText)` ในหน้าจอ **AI Insights** และ **AI Agent**:
1.  **Google Gemini API (สมองหลัก)**: เรียกใช้รุ่น `gemini-2.5-flash` เพื่อความลึกซึ้งสูงสุด
2.  **OpenRouter API (สำรองตัวท็อป)**: สลับใช้ระบบเราเตอร์โมเดลฟรี `openrouter/free` ของ OpenRouter
3.  **Groq Cloud API (สำรองระดับรอง)**: สลับไปเรียก `llama-3.3-70b-versatile` บน Groq
4.  **Local Rule-based Simulator (สำรองขั้นสุดท้าย)**: สรุปผลจากฐานข้อมูลสดในเครื่องทันที ป้องกันแอปแครช

### 2.2 แผนกสนทนาโต้ตอบด่วน (Low-Latency Chat Workflow)
ใช้งานผ่านฟังก์ชัน `callChatAI(promptText)` ใน **Chatbot Drawer**:
1.  **Groq Cloud API (แชทบอร์ดหลัก)**: ใช้ `llama-3.3-70b-versatile` บน Groq เพื่อการตอบสนองที่เร็วกว่า 0.5 วินาที
2.  **OpenRouter API (สำรองด่วน)**: สลับใช้ระบบเราเตอร์โมเดลฟรี `openrouter/free` ของ OpenRouter
3.  **Google Gemini API (สำรองระดับรอง)**: สลับใช้ `gemini-2.5-flash` ของ Google
4.  **Local Keyword-based Chat (สำรองขั้นสุดท้าย)**: วิเคราะห์คำตอบจากคีย์เวิร์ดในเครื่อง

---

## 3. ขั้นตอนการประมวลผลของ AI Agent (AI Agent Workflow)

AI Agent ทำหน้าที่ระดมสมองคิดงานย่อย 3 งานและจับคู่พนักงานตามความเหมาะสม:

1.  **สแกนและค้นหา (Scan & Discovery)**: อ่านพนักงานจริงจาก `users.json` และดึงคุณสมบัติฝ่าย, ตำแหน่ง, ทักษะหลัก (Skills) และภาระงานค้างออกมา
2.  **ตรวจหาจุดขาดทักษะ (Skill Gap Analyzer)**: ค้นหาความขัดข้องในโครงสร้างและประวัติการเรียนจบหลักสูตรใน `enrollments.json`
3.  **ส่งสังเคราะห์ผล (Synthesis)**: ส่งพรอมต์เฉพาะทางให้ AI Router หาไอเดียโครงการย่อยที่สอดคล้องกับพนักงานที่มีทักษะตรงสายที่สุด
4.  **ร่างแผนและอนุมัติ (Draft & Approve)**: เจนเนอเรตเป็นหน้าการ์ดไอเดีย 3 โครงการย่อยพร้อมปุ่มกดอนุมัติ เมื่อกดอนุมัติจะบันทึกงานใหม่ลงฐานข้อมูลและสะท้อนไปยังบอร์ดงานหลักและ KPI แดชบอร์ดทันที

---

## 4. โครงสร้างการจัดการคีย์ผ่านสภาพแวดล้อม (Environment Config)

*   **ไฟล์ `.env`**: ถูกจัดเก็บไว้ใน Root Directory ของเว็บแอปพลิเคชัน สำหรับให้ฝั่งหลังบ้านหรือผู้พัฒนาระบุตัวแปรคีย์ลับ
*   **กระบวนการโหลด (Client-side loader)**: เมื่อเว็บแอปถูกโหลดขึ้น บราว์เซอร์จะดึง `/.env` ผ่านการ Fetch, ล้างบรรทัดว่าง/คอมเมนต์, และพาร์สเก็บค่าลงสู่ตัวแปร `let` ในหน่วยความจำเพื่อให้พร้อมใช้งานได้อย่างรวดเร็วและปลอดภัยจากเวอร์ชันคอนโทรลผ่าน `.gitignore`
