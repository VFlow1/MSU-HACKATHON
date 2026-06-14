// ===== SYSTEM CONFIGURATION (หลังบ้านสามารถป้อนคีย์ของแต่ละค่ายที่นี่ หรือตั้งค่าผ่านไฟล์ .env ใน Root) =====
let GEMINI_API_KEY = ""; // คีย์หลักสำหรับวิเคราะห์ (Insights & Agent)
const GEMINI_MODEL = "gemini-2.5-flash";

let GROQ_API_KEY = ""; // คีย์สำหรับตอบแชทบอร์ดรวดเร็วพิเศษ
const GROQ_MODEL = "llama-3.3-70b-versatile";

let OPENROUTER_API_KEY = ""; // คีย์สำรอง ใช้กรณีโมเดลหลักล่ม
const OPENROUTER_MODEL = "openrouter/free"; // ใช้เราเตอร์ฟรีอัตโนมัติของ OpenRouter

// ฟังก์ชันโหลดคอนฟิกจากไฟล์ .env หรือ Vercel API แบบไดนามิกบนฝั่งไคลเอนต์
async function loadEnvConfig() {
    try {
        console.log("Checking environment configuration from Vercel config API...");
        try {
            const apiRes = await fetch('/api/config');
            if (apiRes.ok) {
                const config = await apiRes.json();
                if (config.GEMINI_API_KEY) GEMINI_API_KEY = config.GEMINI_API_KEY;
                if (config.GROQ_API_KEY) GROQ_API_KEY = config.GROQ_API_KEY;
                if (config.OPENROUTER_API_KEY) OPENROUTER_API_KEY = config.OPENROUTER_API_KEY;
                console.log("Configuration loaded from Vercel Serverless environment.");
                return;
            }
        } catch (apiErr) {
            console.log("Vercel config API not active. Trying local .env...");
        }

        console.log("Loading configuration from .env...");
        const response = await fetch('/.env');
        if (!response.ok) {
            console.warn(".env file not found or could not be served. Using fallback/empty keys.");
            return;
        }
        const text = await response.text();
        const lines = text.split('\n');
        
        lines.forEach(line => {
            // ตัดช่องว่างและละเว้นบรรทัดที่เป็นคอมเมนต์หรือบรรทัดว่าง
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            
            const equalsIdx = trimmed.indexOf('=');
            if (equalsIdx === -1) return;
            
            const key = trimmed.substring(0, equalsIdx).trim();
            const value = trimmed.substring(equalsIdx + 1).trim();
            
            // ลบเครื่องหมายคำพูดหากมีครอบไว้ (เช่น "key" หรือ 'key')
            let cleanValue = value;
            if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1);
            }
            
            if (key === 'GEMINI_API_KEY') GEMINI_API_KEY = cleanValue;
            else if (key === 'GROQ_API_KEY') GROQ_API_KEY = cleanValue;
            else if (key === 'OPENROUTER_API_KEY') OPENROUTER_API_KEY = cleanValue;
        });
        
        console.log("Configuration loaded successfully from .env");
    } catch (e) {
        console.error("Failed to load .env config:", e);
    }
}

// Active State Arrays
let tasksData = [];
let coursesData = [];
let employeesData = [];
let projectsData = [];

// Helper function to format Date ISO -> Thai
function formatDateThai(isoStr) {
    if (!isoStr) return '';
    const monthsThai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr; // Fallback if invalid
    const d = date.getDate();
    const m = monthsThai[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
}

// User Metadata Map for additional fields
const userMetaMap = {
    "u001": { dept: "ฝ่ายพัฒนา", position: "Senior Developer", skills: "React, Node.js, Python" },
    "u002": { dept: "ฝ่ายพัฒนา", position: "Full-Stack Developer", skills: "Python, Cloud, CI/CD" },
    "u003": { dept: "ฝ่ายออกแบบ", position: "UI/UX Designer", skills: "Figma, Adobe XD, CSS" },
    "u004": { dept: "ฝ่ายบริหาร", position: "Project Manager", skills: "Agile, Scrum, Planning" },
    "u005": { dept: "ฝ่ายพัฒนา", position: "DevOps Engineer", skills: "AWS, Docker, Kubernetes" },
    "u006": { dept: "ฝ่ายพัฒนา", position: "Security Specialist", skills: "PenTest, Security, Linux" },
    "u007": { dept: "ฝ่ายออกแบบ", position: "Graphic Designer", skills: "Photoshop, Illustrator" },
    "u008": { dept: "ฝ่ายพัฒนา", position: "Tech Lead", skills: "System Design, Go, Java" },
    "u009": { dept: "ฝ่ายพัฒนา", position: "Junior Developer", skills: "HTML, CSS, JavaScript" },
    "u010": { dept: "ฝ่ายออกแบบ", position: "Interaction Designer", skills: "Prototyping, Figma" },
    "u011": { dept: "ฝ่ายบริหาร", position: "Product Manager", skills: "Product Strategy, Analytics" },
    "u012": { dept: "ฝ่ายบริหาร", position: "HR Manager", skills: "Recruiting, Talent Mgmt" },
    "u013": { dept: "ฝ่ายพัฒนา", position: "QA Engineer", skills: "Selenium, Cypress, Jest" },
    "u014": { dept: "ฝ่ายออกแบบ", position: "Visual Designer", skills: "Sketch, Figma, Motion" },
    "u015": { dept: "ฝ่ายพัฒนา", position: "Backend Developer", skills: "Node.js, Postgres, Redis" }
};

// Maps for transformation
const statusMap = {
    'BLOCKED': 'blocked',
    'TODO': 'pending',
    'DOING': 'in-progress',
    'DONE': 'completed'
};

const priorityMap = {
    'CRITICAL': 'critical',
    'HIGH': 'high',
    'MEDIUM': 'medium',
    'LOW': 'low'
};

const enrollStatusMap = {
    'IN_PROGRESS': 'in-progress',
    'COMPLETED': 'completed',
    'DROPPED': 'dropped',
    'NOT_STARTED': 'pending'
};

// Fetch real JSON files and transform them
async function loadRealData() {
    try {
        const [users, tasks, projects, courses, enrollments] = await Promise.all([
            fetch('data/users.json').then(r => r.json()),
            fetch('data/tasks.json').then(r => r.json()),
            fetch('data/projects.json').then(r => r.json()),
            fetch('data/courses.json').then(r => r.json()),
            fetch('data/enrollments.json').then(r => r.json()),
        ]);

        const userMap = {};
        users.forEach(u => {
            userMap[u.user_id] = u;
        });

        const projectMap = {};
        projects.forEach(p => {
            projectMap[p.project_id] = p;
        });

        const courseMap = {};
        courses.forEach(c => {
            courseMap[c.course_id] = c;
        });

        // 1. Transform Tasks
        tasksData = tasks.map(task => {
            const taskIdNum = parseInt(task.task_id.replace('tk-', '')) || 0;
            const mappedStatus = statusMap[task.status] || 'pending';
            const mappedPriority = priorityMap[task.priority] || 'medium';
            
            // Deterministic progress calculation
            let progress = 0;
            if (mappedStatus === 'completed') progress = 100;
            else if (mappedStatus === 'pending') progress = 0;
            else if (mappedStatus === 'in-progress') progress = 25 + (taskIdNum * 7) % 51; // 25 to 75
            else if (mappedStatus === 'blocked') progress = 10 + (taskIdNum * 3) % 26; // 10 to 35

            // Lookup project deadline
            const project = projectMap[task.project_id];
            const deadline = project ? formatDateThai(project.deadline) : '';

            // Lookup assignee
            const assigneeUser = userMap[task.assigned_to];
            const assigneeName = assigneeUser ? assigneeUser.name : task.assigned_to;

            // Lookup dept
            const dept = userMetaMap[task.assigned_to]?.dept || "ฝ่ายพัฒนา";

            // AI Risk level calculation
            let aiRisk = "ต่ำ";
            if ((mappedPriority === 'critical' || mappedPriority === 'high') && (mappedStatus === 'blocked' || mappedStatus === 'pending')) {
                aiRisk = "สูง";
            } else if (mappedStatus === 'in-progress' && (mappedPriority === 'critical' || mappedPriority === 'high')) {
                aiRisk = "ปานกลาง";
            }

            return {
                id: task.task_id,
                name: task.title,
                assignee: assigneeName,
                dept: dept,
                priority: mappedPriority,
                status: mappedStatus,
                progress: progress,
                deadline: deadline,
                aiRisk: aiRisk
            };
        });

        // 2. Transform Courses (Enrollments)
        coursesData = enrollments.map(enroll => {
            const course = courseMap[enroll.course_id];
            const courseName = course ? course.title : enroll.course_id;

            const user = userMap[enroll.user_id];
            const learnerName = user ? user.name : enroll.user_id;

            const mappedStatus = enrollStatusMap[enroll.status] || 'pending';
            const progress = enroll.progress_percent;

            const totalLessons = course ? course.total_lessons : 10;
            const remaining = Math.max(0, Math.round(totalLessons * (1 - progress / 100)));

            let aiSuggestion = "เริ่มเรียนสัปดาห์ละ 1 บท";
            if (mappedStatus === 'completed') {
                aiSuggestion = "แนะนำคอร์สเรียนขั้นสูงถัดไป";
            } else if (mappedStatus === 'dropped') {
                aiSuggestion = "ทบทวนบทเรียนแรกใหม่";
            } else if (mappedStatus === 'in-progress') {
                if (progress < 30) {
                    aiSuggestion = "จัดเวลาวันละ 15 นาที";
                } else if (progress < 70) {
                    aiSuggestion = "เพิ่มเวลาเรียน 20 นาที/วัน";
                } else {
                    aiSuggestion = "ทบทวนบทเรียนสุดท้าย";
                }
            }

            return {
                id: enroll.enroll_id,
                name: courseName,
                learner: learnerName,
                status: mappedStatus,
                progress: progress,
                remaining: remaining,
                aiSuggestion: aiSuggestion
            };
        });

        // 3. Transform Employees
        employeesData = users.map(user => {
            const meta = userMetaMap[user.user_id] || { dept: "ฝ่ายพัฒนา", position: "Member", skills: "General" };
            
            const userTasks = tasks.filter(t => t.assigned_to === user.user_id);
            const userEnrollments = enrollments.filter(e => e.user_id === user.user_id);

            // Compute performance dynamically
            let taskRate = 80;
            if (userTasks.length > 0) {
                const completed = userTasks.filter(t => t.status === 'DONE').length;
                taskRate = (completed / userTasks.length) * 100;
            }

            let courseAvg = 75;
            if (userEnrollments.length > 0) {
                const sum = userEnrollments.reduce((acc, curr) => acc + curr.progress_percent, 0);
                courseAvg = sum / userEnrollments.length;
            }

            const performance = Math.min(100, Math.max(30, Math.round(taskRate * 0.6 + courseAvg * 0.4)));

            return {
                id: user.user_id,
                name: user.name,
                position: meta.position,
                dept: meta.dept,
                tasks: userTasks.length,
                courses: userEnrollments.length,
                skills: meta.skills,
                performance: performance,
                email: user.email,
                phone: user.phone,
                points: user.loyalty_points || 0,
                role: user.role || "MEMBER"
            };
        });

        // Store projects globally
        projectsData = projects;

    } catch (error) {
        console.error("Error loading and transforming JSON data:", error);
    }
}

// ===== LOCALSTORAGE ENGINE =====
async function initDatabase() {
    const savedTasks = localStorage.getItem('tasksData');
    const savedCourses = localStorage.getItem('coursesData');
    const savedEmployees = localStorage.getItem('employeesData');
    const savedProjects = localStorage.getItem('projectsData');

    if (savedTasks && savedCourses && savedEmployees && savedProjects) {
        tasksData = JSON.parse(savedTasks);
        coursesData = JSON.parse(savedCourses);
        employeesData = JSON.parse(savedEmployees);
        projectsData = JSON.parse(savedProjects);
    } else {
        await loadRealData();
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem('tasksData', JSON.stringify(tasksData));
    localStorage.setItem('coursesData', JSON.stringify(coursesData));
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    localStorage.setItem('projectsData', JSON.stringify(projectsData));
}

async function resetDatabase() {
    localStorage.removeItem('tasksData');
    localStorage.removeItem('coursesData');
    localStorage.removeItem('employeesData');
    localStorage.removeItem('projectsData');
    await loadRealData();
    saveDatabase();
}
