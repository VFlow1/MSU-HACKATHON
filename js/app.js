// ===== GLOBAL APP STATE =====
// Note: tasksData, coursesData, employeesData are declared in js/data.js
let currentSection = 'dashboard';
let previousSection = 'dashboard';
let dashboardChartsInitialized = false;
let learningChartsInitialized = false;

// ===== NAVIGATION =====
function showSection(sectionId) {
    previousSection = currentSection;
    currentSection = sectionId;

    if (typeof playBeep === 'function') playBeep(480, 'sine', 0.06);

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    const titles = {
        'dashboard': 'ภาพรวมระบบ',
        'tasks': 'จัดการงาน',
        'learning': 'ระบบเรียนรู้',
        'ai-insights': 'AI Insights',
        'employees': 'บุคลากร',
        'reports': 'รายงาน',
        'analytics': 'วิเคราะห์ข้อมูล',
        'settings': 'ตั้งค่า',
        'detail': 'รายละเอียด'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'ภาพรวมระบบ';
    document.getElementById('breadcrumb').innerHTML = 
        '<a href="#" onclick="showSection(\'dashboard\')">หน้าแรก</a> / ' + (titles[sectionId] || 'ภาพรวมระบบ');

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');

    if (sectionId === 'dashboard') {
        initDashboardCharts();
        dashboardChartsInitialized = true;
        
        // Phase 3 Premium Interactions
        if (typeof buildActivityTicker === 'function') buildActivityTicker();
        if (typeof animateCounters === 'function') animateCounters();
        if (typeof initTiltCards === 'function') initTiltCards();
        if (typeof initProgressRings === 'function') initProgressRings();
    }
    if (sectionId === 'learning') {
        initLearningCharts();
        learningChartsInitialized = true;
    }
    if (sectionId === 'analytics') {
        initAnalyticsCharts();
    }
    if (sectionId === 'settings') {
        checkGeminiApiStatus();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
}

function goBack() {
    showSection(previousSection);
}

// ===== MODAL CONTROLS =====
function openAddTaskModal() {
    const assigneeSelect = document.getElementById('taskAssigneeInput');
    if (assigneeSelect) {
        assigneeSelect.innerHTML = '<option value="" disabled selected>เลือกผู้รับผิดชอบ</option>' + 
            employeesData.map(emp => `<option value="${emp.name}">${emp.name} (${emp.position})</option>`).join('');
    }
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.add('open');
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.remove('open');
    }
    document.getElementById('addTaskModalTitle').textContent = 'เพิ่มงานใหม่';
    document.getElementById('addTaskForm')?.reset();
    editingTaskId = null;
}

function handleAddTask(e) {
    e.preventDefault();
    const name = document.getElementById('taskNameInput').value;
    const assigneeName = document.getElementById('taskAssigneeInput').value;
    const priority = document.getElementById('taskPriorityInput').value;
    const deadlineRaw = document.getElementById('taskDeadlineInput').value;
    
    let deadline = deadlineRaw;
    try {
        const dateObj = new Date(deadlineRaw);
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const day = dateObj.getDate();
        const month = thaiMonths[dateObj.getMonth()];
        const adYear = dateObj.getFullYear();
        deadline = `${day} ${month} ${adYear}`;
    } catch (err) {}

    const emp = employeesData.find(e => e.name === assigneeName);
    const dept = emp ? emp.dept : "ฝ่ายพัฒนา";

    let aiRisk = "ต่ำ";
    if (priority === "critical" || priority === "high") {
        if (emp && emp.performance < 80) {
            aiRisk = "สูง";
        } else {
            aiRisk = "ปานกลาง";
        }
    }

    if (editingTaskId !== null) {
        const task = tasksData.find(t => t.id === editingTaskId);
        if (task) {
            task.name = name;
            task.assignee = assigneeName;
            task.dept = dept;
            task.priority = priority;
            task.deadline = deadline;
            task.aiRisk = aiRisk;
            showToast(`แก้ไขข้อมูลงาน "<strong>${name}</strong>" เรียบร้อยแล้ว`, 'success');
        }
        editingTaskId = null;
    } else {
        const maxNum = tasksData.reduce((max, t) => {
            const num = parseInt(String(t.id).replace('tk-', '')) || 0;
            return num > max ? num : max;
        }, 0);
        const newTask = {
            id: `tk-${String(maxNum + 1).padStart(3, '0')}`,
            name: name,
            assignee: assigneeName,
            dept: dept,
            priority: priority,
            status: "pending",
            progress: 0,
            deadline: deadline,
            aiRisk: aiRisk
        };
        tasksData.push(newTask);
        if (emp) {
            emp.tasks += 1;
        }
        showToast(`เพิ่มงานใหม่ "<strong>${name}</strong>" มอบหมายให้ <strong>${assigneeName}</strong>`, 'success');
    }

    saveDatabase();
    updateDashboardKPIs();
    renderTasksTable();
    renderAllTasks();
    renderEmployees();
    
    closeAddTaskModal();
}

function openAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.add('open');
    }
}

function closeAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.remove('open');
    }
    document.getElementById('addEmployeeModalTitle').textContent = 'เพิ่มบุคลากรใหม่';
    document.getElementById('addEmployeeForm')?.reset();
    editingEmployeeId = null;
}

function handleAddEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('empNameInput').value;
    const position = document.getElementById('empPositionInput').value;
    const dept = document.getElementById('empDeptInput').value;
    const skills = document.getElementById('empSkillsInput').value;
    const performance = parseInt(document.getElementById('empPerformanceInput').value) || 80;

    if (editingEmployeeId !== null) {
        const emp = employeesData.find(e => e.id === editingEmployeeId);
        if (emp) {
            emp.name = name;
            emp.position = position;
            emp.dept = dept;
            emp.skills = skills;
            emp.performance = performance;
            showToast(`แก้ไขข้อมูลบุคลากร "<strong>${name}</strong>" เรียบร้อยแล้ว`, 'success');
        }
        editingEmployeeId = null;
    } else {
        const maxNum = employeesData.reduce((max, e) => {
            const num = parseInt(String(e.id).replace('u', '')) || 0;
            return num > max ? num : max;
        }, 0);
        const newEmp = {
            id: `u${String(maxNum + 1).padStart(3, '0')}`,
            name: name,
            position: position,
            dept: dept,
            tasks: 0,
            courses: 0,
            skills: skills,
            performance: performance
        };
        employeesData.push(newEmp);
        showToast(`เพิ่มบุคลากรใหม่ "<strong>${name}</strong>" ฝ่าย <strong>${dept}</strong>`, 'success');
    }

    saveDatabase();
    renderEmployees();
    closeAddEmployeeModal();
}

function animateValue(element, start, end, duration, suffix = '', decimals = 0) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = (progress * (end - start) + start);
        element.textContent = currentVal.toFixed(decimals) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end.toFixed(decimals) + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

function updateValueWithAnimation(element, newValue, suffix = '', decimals = 0) {
    if (!element) return;
    // Extract numerical part from element content (removing % or ' ชม.')
    const text = element.textContent || '';
    const prevValue = parseFloat(text.replace(/[^\d.-]/g, '')) || 0;
    if (prevValue === newValue) return;
    animateValue(element, prevValue, newValue, 800, suffix, decimals);
}

function updateDashboardKPIs() {
    // 1. Dashboard section KPIs
    const dbSection = document.getElementById('dashboard');
    if (dbSection) {
        const dbCards = dbSection.querySelectorAll('.kpi-card');
        if (dbCards.length >= 4) {
            // Card 0: Completed Tasks
            const completedCount = tasksData.filter(t => t.status === "completed").length + 128;
            updateValueWithAnimation(dbCards[0].querySelector('.kpi-value'), completedCount, '', 0);

            // Card 1: Blocked Tasks
            const blockedCount = tasksData.filter(t => t.status === "blocked").length;
            updateValueWithAnimation(dbCards[1].querySelector('.kpi-value'), blockedCount, '', 0);

            // Card 2: LMS Completion Rate (Average Course progress)
            const lmsCompletion = coursesData.length > 0 
                ? (coursesData.reduce((sum, c) => sum + c.progress, 0) / coursesData.length)
                : 87.4;
            updateValueWithAnimation(dbCards[2].querySelector('.kpi-value'), lmsCompletion, '%', 1);

            // Card 3: Team Performance
            const teamPerformance = employeesData.length > 0
                ? (employeesData.reduce((sum, e) => sum + e.performance, 0) / employeesData.length)
                : 92.1;
            updateValueWithAnimation(dbCards[3].querySelector('.kpi-value'), teamPerformance, '', 1);

            // Set SVG progress ring values dynamically (Phase 3)
            const totalTasksCount = tasksData.length + 128;
            const completedPercent = totalTasksCount > 0 ? (completedCount / totalTasksCount) * 100 : 85;
            const blockedPercent = Math.min(100, (blockedCount / 10) * 100);

            const ring0 = dbCards[0].querySelector('.kpi-ring-bar');
            const ring1 = dbCards[1].querySelector('.kpi-ring-bar');
            const ring2 = dbCards[2].querySelector('.kpi-ring-bar');
            const ring3 = dbCards[3].querySelector('.kpi-ring-bar');

            if (ring0) ring0.setAttribute('data-value', completedPercent);
            if (ring1) ring1.setAttribute('data-value', blockedPercent);
            if (ring2) ring2.setAttribute('data-value', lmsCompletion);
            if (ring3) ring3.setAttribute('data-value', teamPerformance);

            // Animate progress rings
            if (typeof initProgressRings === 'function') {
                initProgressRings();
            }
        }
    }

    // Auto-update Live Activity Ticker (Phase 3)
    if (typeof buildActivityTicker === 'function') {
        buildActivityTicker();
    }

    // 2. Learning section KPIs
    const lrSection = document.getElementById('learning');
    if (lrSection) {
        const lrCards = lrSection.querySelectorAll('.kpi-card');
        if (lrCards.length >= 4) {
            // Card 0: Active Learning Courses
            const activeCourses = coursesData.filter(c => c.status === "in-progress").length + 21;
            updateValueWithAnimation(lrCards[0].querySelector('.kpi-value'), activeCourses, '', 0);

            // Card 1: Dropout Rate
            const dropoutRate = coursesData.length > 0
                ? (coursesData.filter(c => c.status === "dropped").length / coursesData.length * 100)
                : 8.3;
            updateValueWithAnimation(lrCards[1].querySelector('.kpi-value'), dropoutRate, '%', 1);

            // Card 2: Average Hours
            const avgHours = coursesData.length > 0
                ? (coursesData.reduce((sum, c) => sum + c.progress, 0) * 0.08)
                : 4.2;
            updateValueWithAnimation(lrCards[2].querySelector('.kpi-value'), avgHours, ' ชม.', 1);

            // Card 3: Average LMS Score
            const avgLmsScore = employeesData.length > 0
                ? (employeesData.reduce((sum, e) => sum + e.performance, 0) / employeesData.length * 0.9)
                : 82.5;
            updateValueWithAnimation(lrCards[3].querySelector('.kpi-value'), avgLmsScore, '', 1);
        }
    }
    
    const sidebarBadge = document.querySelector('.sidebar .badge');
    if (sidebarBadge) {
        sidebarBadge.textContent = tasksData.filter(t => t.status === "blocked" || t.priority === "critical").length;
    }
}


// ===== RENDER FUNCTIONS =====
function getStatusBadge(status) {
    const map = {
        'completed': { cls: 'status-completed', text: 'เสร็จสิ้น', icon: 'fa-check' },
        'in-progress': { cls: 'status-in-progress', text: 'กำลังทำ', icon: 'fa-spinner' },
        'blocked': { cls: 'status-blocked', text: 'ติดขัด', icon: 'fa-exclamation' },
        'pending': { cls: 'status-pending', text: 'รอดำเนินการ', icon: 'fa-clock' },
        'dropped': { cls: 'status-dropped', text: 'ดอง', icon: 'fa-pause' }
    };
    const s = map[status] || map['pending'];
    return '<span class="status-badge ' + s.cls + '"><span class="status-dot"></span> ' + s.text + '</span>';
}

function getPriorityBadge(priority) {
    const map = {
        'critical': { cls: 'priority-critical', text: 'วิกฤต' },
        'high': { cls: 'priority-high', text: 'สูง' },
        'medium': { cls: 'priority-medium', text: 'ปานกลาง' },
        'low': { cls: 'priority-low', text: 'ต่ำ' }
    };
    const p = map[priority] || map['medium'];
    return '<span class="priority-badge ' + p.cls + '">' + p.text + '</span>';
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

function renderTasksTable() {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    const searchVal = document.getElementById('taskSearch')?.value.toLowerCase() || '';
    const filterVal = document.getElementById('taskFilter')?.value || 'all';

    let filtered = tasksData.filter(t => t.status === 'blocked' || t.priority === 'critical');
    if (searchVal) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(searchVal) || t.assignee.toLowerCase().includes(searchVal));
    }
    if (filterVal !== 'all') {
        if (filterVal === 'blocked') {
            filtered = filtered.filter(t => t.status === 'blocked');
        } else {
            filtered = filtered.filter(t => t.priority === filterVal);
        }
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--medium-gray);">
            <i class="fas fa-search" style="font-size:32px; margin-bottom:12px; color: var(--primary-yellow);"></i>
            <div>ไม่พบงานที่ตรงตามเงื่อนไข</div>
        </td></tr>`;
        const pagInfo = document.getElementById('tasksTablePaginationInfo');
        const pagBtns = document.getElementById('tasksTablePaginationBtns');
        if (pagInfo) pagInfo.textContent = "แสดง 0 จาก 0 รายการ";
        if (pagBtns) pagBtns.style.display = 'none';
        return;
    }

    tbody.innerHTML = filtered.slice(0, 6).map(task => `
        <tr onclick="showTaskDetail('${task.id}')">
            <td><strong>${task.name}</strong></td>
            <td>
                <div class="user-cell">
                    <div class="user-cell-avatar">${getInitials(task.assignee)}</div>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${task.assignee}</div>
                        <div class="user-cell-dept">${task.dept}</div>
                    </div>
                </div>
            </td>
            <td>${getPriorityBadge(task.priority)}</td>
            <td>${getStatusBadge(task.status)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${task.progress}%"></div>
                </div>
                <div class="progress-text">${task.progress}%</div>
            </td>
            <td>${task.deadline}</td>
        </tr>
    `).join('');

    // Update pagination dynamically
    const pagInfo = document.getElementById('tasksTablePaginationInfo');
    const pagBtns = document.getElementById('tasksTablePaginationBtns');
    if (pagInfo) {
        const count = filtered.length;
        const shown = Math.min(6, count);
        pagInfo.textContent = `แสดง 1-${shown} จาก ${count} รายการ`;
        if (pagBtns) {
            pagBtns.style.display = count > 6 ? 'flex' : 'none';
        }
    }
}

function renderAllTasks() {
    const tbody = document.getElementById('allTasksBody');
    if (!tbody) return;
    const searchVal = document.getElementById('allTasksSearch')?.value.toLowerCase() || '';
    const filterVal = document.getElementById('allTasksFilter')?.value || 'all';

    let filtered = tasksData;
    if (searchVal) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(searchVal) || t.assignee.toLowerCase().includes(searchVal));
    }
    if (filterVal !== 'all') {
        filtered = filtered.filter(t => t.status === filterVal);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--medium-gray);">
            <i class="fas fa-tasks" style="font-size:32px; margin-bottom:12px; color: var(--primary-yellow);"></i>
            <div>ไม่พบข้อมูลงาน</div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(task => `
        <tr onclick="showTaskDetail('${task.id}')">
            <td><strong>${task.name}</strong></td>
            <td>
                <div class="user-cell">
                    <div class="user-cell-avatar">${getInitials(task.assignee)}</div>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${task.assignee}</div>
                        <div class="user-cell-dept">${task.dept}</div>
                    </div>
                </div>
            </td>
            <td>${getPriorityBadge(task.priority)}</td>
            <td>${getStatusBadge(task.status)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${task.progress}%"></div>
                </div>
                <div class="progress-text">${task.progress}%</div>
            </td>
            <td>${task.deadline}</td>
            <td><span class="priority-badge ${task.aiRisk === 'สูง' ? 'priority-critical' : task.aiRisk === 'ปานกลาง' ? 'priority-high' : 'priority-low'}">${task.aiRisk}</span></td>
        </tr>
    `).join('');
}

function renderCourses() {
    const tbody = document.getElementById('coursesBody');
    if (!tbody) return;
    const searchVal = document.getElementById('lmsCoursesSearch')?.value.toLowerCase() || '';
    const filterVal = document.getElementById('lmsCoursesFilter')?.value || 'all';

    let filtered = coursesData;
    if (searchVal) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(searchVal) || c.learner.toLowerCase().includes(searchVal));
    }
    if (filterVal !== 'all') {
        filtered = filtered.filter(c => c.status === filterVal);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--medium-gray);">
            <i class="fas fa-graduation-cap" style="font-size:32px; margin-bottom:12px; color: var(--primary-yellow);"></i>
            <div>ไม่พบข้อมูลคอร์สเรียน</div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(course => `
        <tr>
            <td><strong>${course.name}</strong></td>
            <td>
                <div class="user-cell">
                    <div class="user-cell-avatar">${getInitials(course.learner)}</div>
                    <div class="user-cell-name">${course.learner}</div>
                </div>
            </td>
            <td>${getStatusBadge(course.status)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${course.progress}%"></div>
                </div>
                <div class="progress-text">${course.progress}%</div>
            </td>
            <td>${course.remaining} บท</td>
            <td><span class="status-badge status-pending"><i class="fas fa-robot"></i> ${course.aiSuggestion}</span></td>
        </tr>
    `).join('');
}

function renderEmployees() {
    const tbody = document.getElementById('employeesBody');
    if (!tbody) return;
    const searchVal = document.getElementById('employeesSearch')?.value.toLowerCase() || '';
    const filterVal = document.getElementById('employeesFilter')?.value || 'all';

    let filtered = employeesData;
    if (searchVal) {
        filtered = filtered.filter(emp => emp.name.toLowerCase().includes(searchVal) || emp.position.toLowerCase().includes(searchVal) || emp.skills.toLowerCase().includes(searchVal));
    }
    if (filterVal !== 'all') {
        filtered = filtered.filter(emp => emp.dept === filterVal);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--medium-gray);">
            <i class="fas fa-users" style="font-size:32px; margin-bottom:12px; color: var(--primary-yellow);"></i>
            <div>ไม่พบข้อมูลบุคลากร</div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(emp => `
        <tr onclick="showEmployeeDetail('${emp.id}')">
            <td>
                <div class="user-cell">
                    <div class="user-cell-avatar">${getInitials(emp.name)}</div>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${emp.name}</div>
                        <div class="user-cell-dept">${emp.position}</div>
                    </div>
                </div>
            </td>
            <td>${emp.position}</td>
            <td>${emp.dept}</td>
            <td>${emp.tasks} งาน</td>
            <td>${emp.courses} คอร์ส</td>
            <td><span class="status-badge status-completed">${emp.skills}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${emp.performance}%"></div>
                </div>
                <div class="progress-text">${emp.performance}/100</div>
            </td>
        </tr>
    `).join('');
}

function showEmployeeDetail(empId) {
    const emp = employeesData.find(e => e.id === empId);
    if (!emp) return;

    previousSection = currentSection;
    currentSection = 'detail';

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('detail').classList.add('active');

    document.getElementById('pageTitle').textContent = 'รายละเอียดบุคลากร';
    document.getElementById('breadcrumb').innerHTML = 
        '<a href="#" onclick="showSection(\'dashboard\')">หน้าแรก</a> / <a href="#" onclick="goBack()">บุคลากร</a> / รายละเอียด';

    const headerActions = document.querySelector('#detail .ai-actions');
    if (headerActions) {
        headerActions.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="editEmployee('${emp.id}')"><i class="fas fa-edit"></i> แก้ไข</button>
            <button class="btn btn-primary btn-sm" onclick="deleteEmployee('${emp.id}')" style="background:var(--danger); color:white; border:none;"><i class="fas fa-trash"></i> ลบบุคลากร</button>
        `;
    }

    const empTasks = tasksData.filter(t => t.assignee === emp.name);
    const empCourses = coursesData.filter(c => c.learner === emp.name);

    const content = document.getElementById('detailContent');
    const roleBadge = emp.role === 'VIP' 
        ? `<span class="badge" style="background:linear-gradient(135deg, #FFD700, #FFA500); color:black; font-weight:bold; font-size:10px; padding:3px 8px; border-radius:4px; margin-left:8px;"><i class="fas fa-crown"></i> VIP</span>` 
        : `<span class="badge" style="background:var(--light-gray); color:var(--dark-gray); font-size:10px; padding:3px 8px; border-radius:4px; margin-left:8px;">MEMBER</span>`;

    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-card">
                <div class="detail-card-title"><i class="fas fa-user-circle"></i> ข้อมูลส่วนตัว</div>
                <div class="detail-row">
                    <span class="detail-label">ชื่อ-นามสกุล</span>
                    <span class="detail-value" style="display:flex; align-items:center;">${emp.name} ${roleBadge}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ตำแหน่ง</span>
                    <span class="detail-value">${emp.position}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ฝ่าย/แผนก</span>
                    <span class="detail-value">${emp.dept}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ทักษะหลัก</span>
                    <span class="detail-value">${emp.skills}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">คะแนนสะสม (Loyalty)</span>
                    <span class="detail-value" style="font-weight:bold; color:var(--primary-yellow-dark);"><i class="fas fa-coins"></i> ${emp.points} คะแนน</span>
                </div>
            </div>
            <div class="detail-card">
                <div class="detail-card-title"><i class="fas fa-chart-line"></i> ประสิทธิภาพการทำงาน</div>
                <div style="text-align:center; padding:20px 0;">
                    <div style="font-size:48px; font-weight:700; color:var(--primary-yellow-dark);">${emp.performance}/100</div>
                    <div style="font-size:14px; color:var(--medium-gray); margin-top:8px;">คะแนนรวมสะสม</div>
                </div>
                <div class="progress-bar" style="height:12px; margin-top:16px;">
                    <div class="progress-bar-fill" style="width:${emp.performance}%"></div>
                </div>
            </div>
            <div class="detail-card detail-card-full">
                <div class="detail-card-title"><i class="fas fa-tasks"></i> งานที่รับผิดชอบ (${empTasks.length} รายการ)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ชื่องาน</th>
                            <th>ความสำคัญ</th>
                            <th>สถานะ</th>
                            <th>ความคืบหน้า</th>
                            <th>Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${empTasks.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:var(--medium-gray)">ไม่มีงานที่รับผิดชอบในขณะนี้</td></tr>' : 
                          empTasks.map(t => `
                            <tr>
                                <td><strong>${t.name}</strong></td>
                                <td>${getPriorityBadge(t.priority)}</td>
                                <td>${getStatusBadge(t.status)}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill" style="width:${t.progress}%"></div>
                                    </div>
                                    <div class="progress-text">${t.progress}%</div>
                                </td>
                                <td>${t.deadline}</td>
                            </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="detail-card detail-card-full">
                <div class="detail-card-title"><i class="fas fa-graduation-cap"></i> คอร์สเรียนที่ลงทะเบียน (${empCourses.length} คอร์ส)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ชื่อคอร์ส</th>
                            <th>สถานะ</th>
                            <th>ความคืบหน้า</th>
                            <th>คำแนะนำเรียนรู้</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${empCourses.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:var(--medium-gray)">ไม่มีคอร์สเรียนในขณะนี้</td></tr>' : 
                          empCourses.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td>${getStatusBadge(c.status)}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill" style="width:${c.progress}%"></div>
                                    </div>
                                    <div class="progress-text">${c.progress}%</div>
                                </td>
                                <td><span class="status-badge status-pending"><i class="fas fa-robot"></i> ${c.aiSuggestion}</span></td>
                            </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== DETAIL VIEW =====
function showTaskDetail(taskId) {
    const task = tasksData.find(t => t.id === taskId);
    if (!task) return;

    previousSection = currentSection;
    currentSection = 'detail';

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('detail').classList.add('active');

    document.getElementById('pageTitle').textContent = 'รายละเอียดงาน';
    document.getElementById('breadcrumb').innerHTML = 
        '<a href="#" onclick="showSection(\'dashboard\')">หน้าแรก</a> / <a href="#" onclick="goBack()">งาน</a> / รายละเอียด';

    const headerActions = document.querySelector('#detail .ai-actions');
    if (headerActions) {
        headerActions.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="editTask('${task.id}')"><i class="fas fa-edit"></i> แก้ไข</button>
            <button class="btn btn-primary btn-sm" onclick="deleteTask('${task.id}')" style="background:var(--danger); color:white; border:none;"><i class="fas fa-trash"></i> ลบงาน</button>
        `;
    }

    const content = document.getElementById('detailContent');
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-card">
                <div class="detail-card-title"><i class="fas fa-info-circle"></i> ข้อมูลงาน</div>
                <div class="detail-row">
                    <span class="detail-label">ชื่องาน</span>
                    <span class="detail-value">${task.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ผู้รับผิดชอบ</span>
                    <span class="detail-value">${task.assignee}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ฝ่าย</span>
                    <span class="detail-value">${task.dept}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ความสำคัญ</span>
                    <span class="detail-value">${getPriorityBadge(task.priority)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">สถานะ</span>
                    <span class="detail-value" style="display:flex; align-items:center; gap:12px;">
                        ${getStatusBadge(task.status)}
                        <select class="filter-select" style="height:32px; font-size:12.5px; padding:0 8px; border-radius:6px; border: 1px solid var(--border); font-family: inherit; cursor: pointer;" onchange="updateTaskStatusManual('${task.id}', this.value)">
                            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>รอดำเนินการ</option>
                            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>กำลังทำ</option>
                            <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>ติดขัด</option>
                            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>เสร็จสิ้น</option>
                        </select>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Deadline</span>
                    <span class="detail-value highlight">${task.deadline}</span>
                </div>
            </div>
            <div class="detail-card">
                <div class="detail-card-title"><i class="fas fa-chart-line"></i> ความคืบหน้า</div>
                <div style="text-align:center; padding:20px 0;">
                    <div style="font-size:48px; font-weight:700; color:var(--primary-yellow-dark);">${task.progress}%</div>
                    <div style="font-size:14px; color:var(--medium-gray); margin-top:8px;">ความคืบหน้าโดยรวม</div>
                </div>
                <div class="progress-bar" style="height:12px; margin-top:16px;">
                    <div class="progress-bar-fill" style="width:${task.progress}%"></div>
                </div>
                <div class="ai-suggestion-box" style="margin-top:20px">
                    <div class="suggestion-title"><i class="fas fa-robot"></i> AI วิเคราะห์</div>
                    <div class="suggestion-text">
                        ความเสี่ยงระดับ <strong>${task.aiRisk}</strong> - 
                        ${task.aiRisk === 'สูง' ? 'งานนี้มีความเสี่ยงสูง ควรติดตามด่วนและพิจารณาสลับผู้รับผิดชอบ' : 
                          task.aiRisk === 'ปานกลาง' ? 'ควรเฝ้าระวังและติดตามความคืบหน้าอย่างใกล้ชิด' : 
                          'ความเสี่ยงต่ำ งานดำเนินไปตามแผน'}
                    </div>
                </div>
            </div>
            <div class="detail-card detail-card-full">
                <div class="detail-card-title"><i class="fas fa-history"></i> ประวัติการดำเนินงาน</div>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-dot completed"></div>
                        <div class="timeline-time">13 มิ.ย. 2026 - 10:15 น.</div>
                        <div class="timeline-text">สร้างงานและมอบหมายให้ <strong>${task.assignee}</strong></div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-dot completed"></div>
                        <div class="timeline-time">12 มิ.ย. 2026 - 14:30 น.</div>
                        <div class="timeline-text">อัปเดตความคืบหน้า ${task.progress}%</div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-dot ${task.status === 'blocked' ? '' : 'completed'}"></div>
                        <div class="timeline-time">ปัจจุบัน</div>
                        <div class="timeline-text">สถานะปัจจุบัน: <strong>${task.status === 'blocked' ? 'ติดขัด - รอการแก้ไข' : task.status === 'in-progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}</strong></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateTaskStatusManual(taskId, newStatus) {
    const task = tasksData.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    task.status = newStatus;
    
    // Update progress automatically based on status
    if (newStatus === 'completed') {
        task.progress = 100;
        task.aiRisk = 'ต่ำ';
        
        // Award +50 loyalty points to assignee
        const emp = employeesData.find(e => e.name === task.assignee);
        if (emp) {
            emp.points = (emp.points || 0) + 50;
            showToast(`งานเสร็จสิ้น! <strong>${task.assignee}</strong> ได้รับ +50 คะแนนสะสม (รวม ${emp.points} คะแนน)`, 'success');
        } else {
            showToast(`งาน "${task.name}" เสร็จสิ้นเรียบร้อยแล้ว`, 'success');
        }

        // Trigger visual confetti and victory sound
        if (typeof triggerConfetti === 'function') triggerConfetti();
        if (typeof playSuccess === 'function') playSuccess();
    } else {
        if (newStatus === 'pending') {
            task.progress = 0;
            task.aiRisk = task.priority === 'critical' || task.priority === 'high' ? 'สูง' : 'ต่ำ';
        } else if (newStatus === 'in-progress') {
            if (task.progress >= 100 || task.progress === 0) task.progress = 25;
            task.aiRisk = task.priority === 'critical' || task.priority === 'high' ? 'ปานกลาง' : 'ต่ำ';
        } else if (newStatus === 'blocked') {
            if (task.progress >= 100) task.progress = 50;
            task.aiRisk = task.priority === 'critical' || task.priority === 'high' ? 'สูง' : 'ปานกลาง';
            if (typeof playBeep === 'function') playBeep(220, 'sawtooth', 0.25); // Warning tone
        }
        
        showToast(`เปลี่ยนสถานะงานเป็น "${getStatusName(newStatus)}"`, 'info');
        if (typeof playBeep === 'function') playBeep(523.25, 'sine', 0.08); // Normal click sound
    }

    saveDatabase();
    updateDashboardKPIs();
    if (typeof buildActivityTicker === 'function') buildActivityTicker();
    renderTasksTable();
    renderAllTasks();
    renderEmployees();

    // Re-render task detail view to reflect new status & progress
    showTaskDetail(taskId);
}

function getStatusName(status) {
    const map = {
        'completed': 'เสร็จสิ้น',
        'in-progress': 'กำลังทำ',
        'blocked': 'ติดขัด',
        'pending': 'รอดำเนินการ'
    };
    return map[status] || status;
}

// ===== SORTING =====
function sortTable(tableId, colIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aText = a.cells[colIndex].textContent.trim();
        const bText = b.cells[colIndex].textContent.trim();
        return aText.localeCompare(bText, 'th');
    });

    rows.forEach(row => tbody.appendChild(row));
}

// ===== SEARCH & FILTER BINDINGS =====
function initSearchAndFilters() {
    document.getElementById('taskSearch')?.addEventListener('input', renderTasksTable);
    document.getElementById('taskFilter')?.addEventListener('change', renderTasksTable);

    document.getElementById('allTasksSearch')?.addEventListener('input', renderAllTasks);
    document.getElementById('allTasksFilter')?.addEventListener('change', renderAllTasks);

    document.getElementById('lmsCoursesSearch')?.addEventListener('input', renderCourses);
    document.getElementById('lmsCoursesFilter')?.addEventListener('change', renderCourses);

    document.getElementById('employeesSearch')?.addEventListener('input', renderEmployees);
    document.getElementById('employeesFilter')?.addEventListener('change', renderEmployees);

    document.getElementById('globalSearch')?.addEventListener('input', function(e) {
        const query = e.target.value;
        if (currentSection === 'dashboard') {
            const taskSearch = document.getElementById('taskSearch');
            if (taskSearch) { taskSearch.value = query; renderTasksTable(); }
        } else if (currentSection === 'tasks') {
            const allTasksSearch = document.getElementById('allTasksSearch');
            if (allTasksSearch) { allTasksSearch.value = query; renderAllTasks(); }
        } else if (currentSection === 'learning') {
            const lmsCoursesSearch = document.getElementById('lmsCoursesSearch');
            if (lmsCoursesSearch) { lmsCoursesSearch.value = query; renderCourses(); }
        } else if (currentSection === 'employees') {
            const employeesSearch = document.getElementById('employeesSearch');
            if (employeesSearch) { employeesSearch.value = query; renderEmployees(); }
        }
    });
}

// ===== EDIT & DELETE UTILITIES =====
function editTask(id) {
    const task = tasksData.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    
    openAddTaskModal();
    
    document.getElementById('addTaskModalTitle').textContent = 'แก้ไขงาน';
    document.getElementById('taskNameInput').value = task.name;
    document.getElementById('taskAssigneeInput').value = task.assignee;
    document.getElementById('taskPriorityInput').value = task.priority;
    
    const deadlineInput = document.getElementById('taskDeadlineInput');
    if (deadlineInput) {
        deadlineInput.value = '2026-06-15';
    }
}

function deleteTask(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) {
        const index = tasksData.findIndex(t => t.id === id);
        if (index !== -1) {
            const name = tasksData[index].name;
            tasksData.splice(index, 1);
            saveDatabase();
            updateDashboardKPIs();
            renderTasksTable();
            renderAllTasks();
            showToast(`ลบงาน "${name}" เรียบร้อยแล้ว`, 'warning');
            goBack();
        }
    }
}

function editEmployee(id) {
    const emp = employeesData.find(e => e.id === id);
    if (!emp) return;
    editingEmployeeId = id;
    
    openAddEmployeeModal();
    
    document.getElementById('addEmployeeModalTitle').textContent = 'แก้ไขข้อมูลบุคลากร';
    document.getElementById('empNameInput').value = emp.name;
    document.getElementById('empPositionInput').value = emp.position;
    document.getElementById('empDeptInput').value = emp.dept;
    document.getElementById('empSkillsInput').value = emp.skills;
    document.getElementById('empPerformanceInput').value = emp.performance;
}

function deleteEmployee(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบบุคลากรนี้?')) {
        const index = employeesData.findIndex(e => e.id === id);
        if (index !== -1) {
            const name = employeesData[index].name;
            employeesData.splice(index, 1);
            saveDatabase();
            renderEmployees();
            showToast(`ลบข้อมูลบุคลากร "${name}" เรียบร้อยแล้ว`, 'warning');
            goBack();
        }
    }
}

// ===== CSV EXPORT UTILITIES =====
function downloadCSV(csv, filename) {
    const csvFile = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function exportTasksCSV() {
    const headers = ["ชื่องาน", "ผู้รับผิดชอบ", "ฝ่าย", "ความสำคัญ", "สถานะ", "ความคืบหน้า", "Deadline", "AI Risk"];
    const rows = tasksData.map(t => [t.name, t.assignee, t.dept, t.priority, t.status, `${t.progress}%`, t.deadline, t.aiRisk]);
    
    let csv = headers.join(",") + "\n";
    rows.forEach(r => {
        csv += r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });
    downloadCSV(csv, "tasks_export.csv");
    showToast("ส่งออกข้อมูลงานสำเร็จ (CSV)", "success");
}

function exportLmsCSV() {
    const headers = ["ชื่อคอร์ส", "ผู้เรียน", "สถานะ", "ความคืบหน้า", "บทเรียนที่เหลือ", "AI แนะนำ"];
    const rows = coursesData.map(c => [c.name, c.learner, c.status, `${c.progress}%`, `${c.remaining} บท`, c.aiSuggestion]);
    
    let csv = headers.join(",") + "\n";
    rows.forEach(r => {
        csv += r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });
    downloadCSV(csv, "lms_courses_export.csv");
    showToast("ส่งออกข้อมูลคอร์สเรียนสำเร็จ (CSV)", "success");
}

function exportEmployeesCSV() {
    const headers = ["ชื่อ-นามสกุล", "ตำแหน่ง", "ฝ่าย", "งานที่รับผิดชอบ", "คอร์สที่เรียน", "ทักษะหลัก", "ประสิทธิภาพ"];
    const rows = employeesData.map(e => [e.name, e.position, e.dept, `${e.tasks} งาน`, `${e.courses} คอร์ส`, e.skills, `${e.performance}/100`]);
    
    let csv = headers.join(",") + "\n";
    rows.forEach(r => {
        csv += r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });
    downloadCSV(csv, "employees_export.csv");
    showToast("ส่งออกข้อมูลบุคลากรสำเร็จ (CSV)", "success");
}

// ===== TOAST ENGINE =====
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle',
        'danger': 'fa-times-circle'
    };
    const icon = icons[type] || 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div>${message}</div>
        <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ===== THEME TOGGLE LOGIC =====
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
    showToast(isDark ? 'เปิดใช้งานโหมดมืดแล้ว' : 'เปิดใช้งานโหมดสว่างแล้ว');
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('themeToggleIcon');
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeIcon) {
        const isDark = document.body.classList.contains('dark-theme');
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (themeBtn) {
        const isDark = document.body.classList.contains('dark-theme');
        themeBtn.setAttribute('data-tooltip', isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด');
    }
}
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon();
}

// ===== TOPBAR DROPDOWN LOGIC =====
function toggleDropdown(id) {
    const dropdowns = ['notifDropdown', 'msgDropdown'];
    dropdowns.forEach(dId => {
        const d = document.getElementById(dId);
        if (dId === id) {
            d?.classList.toggle('show');
            
            // If opening notification dropdown, clear the notification dot
            if (id === 'notifDropdown' && d?.classList.contains('show')) {
                const dot = document.querySelector('.notif-dot');
                if (dot) dot.style.display = 'none';
            }
        } else {
            d?.classList.remove('show');
        }
    });
}

// Close dropdowns when clicking outside
window.addEventListener('click', function(e) {
    if (!e.target.closest('.topbar-btn') && !e.target.closest('.topbar-dropdown')) {
        document.getElementById('notifDropdown')?.classList.remove('show');
        document.getElementById('msgDropdown')?.classList.remove('show');
    }
});

// ===== AI CHAT ASSISTANT LOGIC =====
function toggleAIChat() {
    const chatWin = document.getElementById('aiChatWindow');
    if (chatWin) {
        chatWin.classList.toggle('open');
        if (chatWin.classList.contains('open')) {
            document.getElementById('aiChatInput')?.focus();
        }
    }
}

function askAIChat(question) {
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = question;
        sendAIChatMessage();
    }
}

function appendChatMessage(sender, text) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.innerHTML = text;
    
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('aiChatMessages');
    if (!container) return null;

    const ind = document.createElement('div');
    ind.className = 'chat-message ai typing-indicator-msg';
    ind.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    container.appendChild(ind);
    container.scrollTop = container.scrollHeight;
    return ind;
}

function removeTypingIndicator(indElement) {
    if (indElement && indElement.parentNode) {
        indElement.parentNode.removeChild(indElement);
    }
}

async function sendAIChatMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    appendChatMessage('user', text);
    input.value = '';

    const indicator = showTypingIndicator();

    try {
        const systemContext = buildSystemContextPrompt();
        const prompt = `${systemContext}\n\nคำถามจากผู้ใช้: ${text}\n\nคำตอบ (กรุณาตอบเป็นภาษาไทย และใช้แท็ก HTML ที่จำเป็นเพื่อให้จัดรูปแบบข้อความสวยงาม เช่น strong, ul, li):`;
        const reply = await callChatAI(prompt);
        removeTypingIndicator(indicator);
        appendChatMessage('ai', reply);
        if (typeof playNotification === 'function') playNotification();
    } catch (error) {
        console.error("AI Router Chat Error:", error);
        removeTypingIndicator(indicator);
        const reply = generateAIResponse(text) + "<br><br><small style='color: var(--danger); font-size: 11px;'><i class='fas fa-exclamation-triangle'></i> ไม่สามารถติดต่อผู้ให้บริการ AI (Groq/OpenRouter/Gemini) ได้ ระบบสลับมาใช้โหมด Rule-based สำรองอัตโนมัติ</small>";
        appendChatMessage('ai', reply);
        if (typeof playNotification === 'function') playNotification();
    }
}

function generateAIResponse(query) {
    const q = query.toLowerCase();
    
    if (q.includes('งานเยอะ') || q.includes('งานสุด') || q.includes('ภาระ') || q.includes('งานมาก')) {
        let maxTasks = -1;
        let empList = [];
        employeesData.forEach(e => {
            const count = tasksData.filter(t => t.assignee === e.name && t.status !== 'completed').length;
            if (count > maxTasks) {
                maxTasks = count;
                empList = [e];
            } else if (count === maxTasks) {
                empList.push(e);
            }
        });
        
        if (empList.length > 0) {
            const names = empList.map(e => `<strong>${e.name}</strong> (${e.position})`).join(', ');
            return `ผู้ที่มีงานค้างที่กำลังทำหรือรอดำเนินการมากที่สุดในขณะนี้คือ ${names} โดยมีจำนวนคนละ <strong>${maxTasks} งาน</strong> ครับ`;
        }
        return `ในระบบไม่มีงานคงค้างสำหรับบุคลากรคนใดเลยครับ`;
    }

    if (q.includes('ประสิทธิภาพ') || q.includes('คะแนนเยอะ') || q.includes('เก่ง') || q.includes('ทำงานดี')) {
        let sortedEmps = [...employeesData].sort((a, b) => b.performance - a.performance);
        let response = `นี่คืออันดับพนักงานที่มีประสิทธิภาพสูงสุด 3 อันดับแรกครับ:<br><ol style="margin-left: 20px; margin-top: 8px;">`;
        sortedEmps.slice(0, 3).forEach((e, idx) => {
            response += `<li><strong>${e.name}</strong> (${e.dept}) - คะแนน ${e.performance}/100</li>`;
        });
        response += `</ol>`;
        return response;
    }

    if (q.includes('ติดขัด') || q.includes('blocked') || q.includes('ปัญหา')) {
        const blockedTasks = tasksData.filter(t => t.status === 'blocked');
        if (blockedTasks.length > 0) {
            let response = `ขณะนี้ตรวจพบงานที่ติดขัด (Blocked) จำนวน <strong>${blockedTasks.length} งาน</strong> ครับ:<br><ul style="margin-left: 20px; margin-top: 8px;">`;
            blockedTasks.forEach(t => {
                response += `<li><strong>${t.name}</strong> มอบหมายให้ <em>${t.assignee}</em> (ความเสี่ยง AI: ${t.aiRisk})</li>`;
            });
            response += `</ul><br>แนะนำให้เข้าตรวจสอบสถานะหรือดำเนินการมอบหมายใหม่ตามคำแนะนำในแท็บ AI Insights ครับ`;
            return response;
        }
        return `ยอดเยี่ยมมาก! ขณะนี้ไม่มีงานใดมีสถานะเป็นติดขัดเลยครับ`;
    }

    if (q.includes('คอร์ส') && (q.includes('เสร็จ') || q.includes('จบ') || q.includes('100%'))) {
        const completedCourses = coursesData.filter(c => c.status === 'completed' || c.progress === 100);
        if (completedCourses.length > 0) {
            let response = `มีคอร์สที่เรียนสำเร็จเสร็จสิ้นจำนวน <strong>${completedCourses.length} คอร์ส</strong> ดังนี้ครับ:<br><ul style="margin-left: 20px; margin-top: 8px;">`;
            completedCourses.forEach(c => {
                response += `<li><strong>${c.name}</strong> เรียนจบโดย <em>${c.learner}</em></li>`;
            });
            response += `</ul>`;
            return response;
        }
        return `ในขณะนี้ยังไม่มีผู้ใดเรียนคอร์สจบ 100% ครับ`;
    }

    if (q.includes('วิเคราะห์') || q.includes('ความเสี่ยง') || q.includes('ภาพรวม') || q.includes('โปรเจกต์')) {
        const total = tasksData.length;
        const blocked = tasksData.filter(t => t.status === 'blocked').length;
        const critical = tasksData.filter(t => t.priority === 'critical').length;
        const progressAvg = total > 0 ? Math.round(tasksData.reduce((acc, t) => acc + t.progress, 0) / total) : 0;
        
        let riskLevel = "ต่ำ";
        let color = "#4CAF50";
        if (blocked > 2 || critical > 2) {
            riskLevel = "สูง";
            color = "#F44336";
        } else if (blocked > 0 || critical > 0) {
            riskLevel = "ปานกลาง";
            color = "#FF9800";
        }

        return `
            <strong>สรุปวิเคราะห์ความเสี่ยงโครงการ</strong><br>
            ความเสี่ยงโดยรวมของโครงการอยู่ในระดับ: <span style="color:${color}; font-weight:700;">${riskLevel}</span><br>
            - ความคืบหน้าโครงการเฉลี่ย: <strong>${progressAvg}%</strong><br>
            - งานติดขัด (Blocked): <strong>${blocked} รายการ</strong><br>
            - งานวิกฤต (Critical): <strong>${critical} รายการ</strong><br>
            - อัตราเรียนจบ LMS: <strong>${coursesData.length > 0 ? Math.round(coursesData.filter(c=>c.status==='completed').length/coursesData.length*100) : 0}%</strong><br><br>
            <em>*คำแนะนำ: ควรสลับผู้รับผิดชอบงานที่ติดขัดไปให้พนักงานที่มีทักษะที่เกี่ยวข้องและพึ่งจบหลักสูตรเรียนรู้ล่าสุด*</em>
        `;
    }

    return `
        ขออภัยครับ ผมยังไม่เข้าใจคำถาม "${query}" อย่างถ่องแท้ คุณสามารถสอบถามสิ่งต่าง ๆ เหล่านี้ได้ครับ:
        <div class="chat-suggestions" style="margin-top: 8px;">
            <button class="suggestion-chip" onclick="askAIChat('วิเคราะห์ความเสี่ยงโครงการหน่อย')">วิเคราะห์ความเสี่ยงโครงการ</button>
            <button class="suggestion-chip" onclick="askAIChat('ใครมีงานเยอะที่สุด?')">ใครมีงานเยอะที่สุด?</button>
            <button class="suggestion-chip" onclick="askAIChat('มีงานอะไรบ้างที่ติดขัดอยู่?')">งานติดขัด (Blocked)</button>
            <button class="suggestion-chip" onclick="askAIChat('คะแนนประสิทธิภาพพนักงาน')">ประสิทธิภาพพนักงานสูงสุด</button>
        </div>
    `;
}

// ===== REAL-TIME SIMULATOR & SETTINGS LOGIC =====
let simulationTimer = null;
let simulationIntervalTime = 20000;
let simulationEnabled = true;

function startSimulation() {
    if (simulationTimer) {
        clearInterval(simulationTimer);
        simulationTimer = null;
    }
    if (!simulationEnabled) return;

    simulationTimer = setInterval(() => {
        const activeTasks = tasksData.filter(t => t.status === 'in-progress' || t.status === 'pending');
        if (activeTasks.length === 0) return;
        
        const randomTask = activeTasks[Math.floor(Math.random() * activeTasks.length)];
        const increment = Math.floor(Math.random() * 11) + 5; // 5-15%
        randomTask.progress = Math.min(randomTask.progress + increment, 100);
        
        if (randomTask.status === 'pending') {
            randomTask.status = 'in-progress';
        }
        
        if (randomTask.progress === 100) {
            randomTask.status = 'completed';
            showToast(`งาน "<strong>${randomTask.name}</strong>" เสร็จสมบูรณ์แล้ว!`, 'success');
        } else {
            showToast(`อัปเดตความคืบหน้างาน "<strong>${randomTask.name}</strong>" เป็น ${randomTask.progress}%`, 'info');
        }
        
        saveDatabase();
        updateDashboardKPIs();
        renderTasksTable();
        renderAllTasks();
        
        if (currentSection === 'detail' && document.getElementById('pageTitle').textContent === 'รายละเอียดงาน') {
            const detailTaskInfo = document.querySelector('.detail-card');
            if (detailTaskInfo && detailTaskInfo.innerHTML.includes(randomTask.name)) {
                showTaskDetail(randomTask.id);
            }
        }
    }, simulationIntervalTime);
}

// ===== SYSTEM CONFIG CONTROLS =====
function checkGeminiApiStatus() {
    const geminiBox = document.getElementById('geminiApiStatusBox');
    const groqBox = document.getElementById('groqApiStatusBox');
    const openRouterBox = document.getElementById('openRouterApiStatusBox');

    if (geminiBox) {
        if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY.length > 0) {
            geminiBox.style.background = 'rgba(76, 175, 80, 0.1)';
            geminiBox.style.borderColor = 'var(--success)';
            geminiBox.style.color = 'var(--success)';
            geminiBox.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> พร้อมใช้งาน (สมองหลัก: <code>${GEMINI_API_KEY.slice(0, 6)}...${GEMINI_API_KEY.slice(-4)}</code>)`;
        } else {
            geminiBox.style.background = 'rgba(244, 67, 54, 0.1)';
            geminiBox.style.borderColor = 'var(--danger)';
            geminiBox.style.color = 'var(--danger)';
            geminiBox.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i> ปิดใช้งาน (ยังไม่ได้ป้อนคีย์ในโค้ด)`;
        }
    }

    if (groqBox) {
        if (typeof GROQ_API_KEY !== 'undefined' && GROQ_API_KEY && GROQ_API_KEY.length > 0) {
            groqBox.style.background = 'rgba(76, 175, 80, 0.1)';
            groqBox.style.borderColor = 'var(--success)';
            groqBox.style.color = 'var(--success)';
            groqBox.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> พร้อมใช้งาน (แชทบอร์ดหลัก: <code>${GROQ_API_KEY.slice(0, 6)}...${GROQ_API_KEY.slice(-4)}</code>)`;
        } else {
            groqBox.style.background = 'rgba(244, 67, 54, 0.1)';
            groqBox.style.borderColor = 'var(--danger)';
            groqBox.style.color = 'var(--danger)';
            groqBox.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i> ปิดใช้งาน (ยังไม่ได้ป้อนคีย์ในโค้ด)`;
        }
    }

    if (openRouterBox) {
        if (typeof OPENROUTER_API_KEY !== 'undefined' && OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 0) {
            openRouterBox.style.background = 'rgba(76, 175, 80, 0.1)';
            openRouterBox.style.borderColor = 'var(--success)';
            openRouterBox.style.color = 'var(--success)';
            openRouterBox.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> พร้อมใช้งาน (สำรองฟรี: <code>${OPENROUTER_API_KEY.slice(0, 6)}...${OPENROUTER_API_KEY.slice(-4)}</code>)`;
        } else {
            openRouterBox.style.background = 'rgba(244, 67, 54, 0.1)';
            openRouterBox.style.borderColor = 'var(--danger)';
            openRouterBox.style.color = 'var(--danger)';
            openRouterBox.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i> ปิดใช้งาน (ยังไม่ได้ป้อนคีย์ในโค้ด)`;
        }
    }
}

function toggleSimulationState() {
    const toggle = document.getElementById('simToggle');
    if (!toggle) return;
    simulationEnabled = toggle.checked;
    
    if (simulationEnabled) {
        startSimulation();
        showToast("เปิดใช้งานการจำลองข้อมูลแบบเรียลไทม์แล้ว", "success");
    } else {
        if (simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = null;
        }
        showToast("ปิดการจำลองข้อมูลแล้ว", "warning");
    }
}

function changeSimulationInterval() {
    const select = document.getElementById('simInterval');
    if (!select) return;
    simulationIntervalTime = parseInt(select.value) || 20000;
    
    if (simulationEnabled) {
        startSimulation();
        showToast(`ปรับความเร็วการจำลองเป็นทุกๆ ${simulationIntervalTime / 1000} วินาที`, "info");
    }
}

async function triggerResetDatabase() {
    if (confirm("คุณต้องการรีเซ็ตฐานข้อมูลกลับเป็นค่าเริ่มต้นใช่หรือไม่? งานและการแก้ไขของคุณทั้งหมดจะถูกล้างออก")) {
        await resetDatabase();
        showToast("รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว!", "success");
        updateDashboardKPIs();
        renderTasksTable();
        renderAllTasks();
        renderCourses();
        renderEmployees();
        if (dashboardChartsInitialized) {
            initDashboardCharts();
        }
        showSection('dashboard');
    }
}

// ===== REAL GEMINI API CALL SERVICE =====
// ===== UNIFIED AI SERVICES CLIENTS & ROUTER =====
async function fetchGeminiAPI(promptText) {
    if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return formatAIResponse(data.candidates[0].content.parts[0].text);
    }
    throw new Error("Invalid Gemini response structure");
}

async function fetchGroqAPI(promptText) {
    if (typeof GROQ_API_KEY === 'undefined' || !GROQ_API_KEY) {
        throw new Error("Groq API Key is not configured.");
    }
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: promptText }]
        })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
        return formatAIResponse(data.choices[0].message.content);
    }
    throw new Error("Invalid Groq response structure");
}

async function fetchOpenRouterAPI(promptText, modelName) {
    if (typeof OPENROUTER_API_KEY === 'undefined' || !OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is not configured.");
    }
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000'
        },
        body: JSON.stringify({
            model: modelName || OPENROUTER_MODEL,
            messages: [{ role: 'user', content: promptText }]
        })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
        return formatAIResponse(data.choices[0].message.content);
    }
    throw new Error("Invalid OpenRouter response structure");
}

function formatAIResponse(text) {
    if (!text) return "";
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    return formatted;
}

async function callChatAI(promptText) {
    // Chat Routing: Groq (Chat Brain) -> OpenRouter (Mistral Free Backup) -> Gemini -> Fallback
    let lastError = null;

    if (typeof GROQ_API_KEY !== 'undefined' && GROQ_API_KEY && GROQ_API_KEY.length > 0) {
        try {
            console.log("Calling Groq Cloud for chat...");
            return await fetchGroqAPI(promptText);
        } catch (e) {
            console.error("Groq chat failed, trying OpenRouter...", e);
            lastError = e;
        }
    }

    if (typeof OPENROUTER_API_KEY !== 'undefined' && OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 0) {
        try {
            console.log("Calling OpenRouter (Mistral Free) for chat...");
            return await fetchOpenRouterAPI(promptText, OPENROUTER_MODEL);
        } catch (e) {
            console.error("OpenRouter chat failed, trying Gemini...", e);
            lastError = e;
        }
    }

    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY.length > 0) {
        try {
            console.log("Calling Google Gemini for chat...");
            return await fetchGeminiAPI(promptText);
        } catch (e) {
            console.error("Gemini chat failed.", e);
            lastError = e;
        }
    }

    throw lastError || new Error("No active AI provider keys configured");
}

async function callAnalysisAI(promptText) {
    // Analysis Routing: Gemini (Main Brain) -> OpenRouter (Gemini Free Backup) -> Groq -> Fallback
    let lastError = null;

    if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY.length > 0) {
        try {
            console.log("Calling Google Gemini for analysis...");
            return await fetchGeminiAPI(promptText);
        } catch (e) {
            console.error("Gemini analysis failed, trying OpenRouter...", e);
            lastError = e;
        }
    }

    if (typeof OPENROUTER_API_KEY !== 'undefined' && OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 0) {
        try {
            console.log("Calling OpenRouter (Free Router) for analysis...");
            return await fetchOpenRouterAPI(promptText, "openrouter/free");
        } catch (e) {
            console.error("OpenRouter analysis failed, trying Groq...", e);
            lastError = e;
        }
    }

    if (typeof GROQ_API_KEY !== 'undefined' && GROQ_API_KEY && GROQ_API_KEY.length > 0) {
        try {
            console.log("Calling Groq (Llama 3) for analysis...");
            return await fetchGroqAPI(promptText);
        } catch (e) {
            console.error("Groq analysis failed.", e);
            lastError = e;
        }
    }

    throw lastError || new Error("No active AI provider keys configured");
}

// ===== AI AGENT WORKSPACE LOGIC =====
let lastAgentRecommendations = [];

async function runAiAgentBrainstorm(e) {
    if (e) e.preventDefault();
    
    const goal = document.getElementById('agentGoalSelect').value;
    const dept = document.getElementById('agentDeptSelect').value;
    const focus = document.getElementById('agentFocusInput').value.trim();
    
    const idleState = document.getElementById('agentIdleState');
    const loadingState = document.getElementById('agentLoadingState');
    const resultState = document.getElementById('agentResultState');
    const cardsContainer = document.getElementById('agentIdeaCardsContainer');
    const summaryAnalysis = document.getElementById('agentSummaryAnalysis');
    
    if (idleState) idleState.style.display = "none";
    if (resultState) resultState.style.display = "none";
    if (loadingState) loadingState.style.display = "block";
    
    const step1 = document.getElementById('agentStep1');
    const step2 = document.getElementById('agentStep2');
    const step3 = document.getElementById('agentStep3');
    const step4 = document.getElementById('agentStep4');
    
    if (step1) { step1.className = "agent-step active"; step1.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; }
    if (step2) { step2.className = "agent-step pending"; step2.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle"></i>'; }
    if (step3) { step3.className = "agent-step pending"; step3.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle"></i>'; }
    if (step4) { step4.className = "agent-step pending"; step4.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle"></i>'; }
    
    // Step 1: Scan employees
    await new Promise(r => setTimeout(r, 700));
    if (step1) { step1.className = "agent-step completed"; step1.querySelector('.step-icon').innerHTML = '<i class="fas fa-check"></i>'; }
    if (step2) { step2.className = "agent-step active"; step2.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; }
    
    // Step 2: Scan LMS gaps
    await new Promise(r => setTimeout(r, 800));
    if (step2) { step2.className = "agent-step completed"; step2.querySelector('.step-icon').innerHTML = '<i class="fas fa-check"></i>'; }
    if (step3) { step3.className = "agent-step active"; step3.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; }
    
    // Step 3: Run AI analysis
    let hasKeys = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY.length > 0) || 
                  (typeof GROQ_API_KEY !== 'undefined' && GROQ_API_KEY.length > 0) ||
                  (typeof OPENROUTER_API_KEY !== 'undefined' && OPENROUTER_API_KEY.length > 0);
                  
    let deptEmployees = employeesData;
    if (dept !== 'all') {
        deptEmployees = employeesData.filter(emp => emp.dept === dept);
    }
    if (deptEmployees.length === 0) deptEmployees = employeesData;

    const empListStr = deptEmployees.map(emp => `- ${emp.name} (ฝ่าย: ${emp.dept}, ทักษะ: ${emp.skills}, งานในมือ: ${emp.tasks} งาน)`).join('\n');
    
    let goalText = "";
    if (goal === 'new-project') goalText = "สร้างโปรเจกต์/งานย่อยใหม่ตามความเชี่ยวชาญ";
    else if (goal === 'skill-remedial') goalText = "วางแผนยกระดับทักษะ LMS เพื่อแก้ปัญหาคอขวดในระบบ";
    else goalText = "ระดมไอเดียนวัตกรรมใหม่ในแผนก";
    
    const prompt = `คุณคือ "AI Project Planner Agent" หน้าที่ของคุณคือการสแกนความสามารถของแผนกและทักษะของทีมงาน เพื่อวางแผนงานใหม่ 3 งานตามโจทย์ที่มอบหมาย
ข้อมูลพนักงานจริงในแผนกขณะนี้:
${empListStr}

เป้าหมายระดมสมอง: "${goalText}"
รายละเอียด/ประเด็นเพิ่มเติม: "${focus || 'ไม่มีเป็นพิเศษ'}"

จงทำการประเมินทีมงานและเขียนรายงานแบ่งออกเป็น 2 ส่วน:
ส่วนที่ 1: การวิเคราะห์เชิงสรุปย่อ (เขียนอธิบายปัญหาหลักหรือแนวทางส่งเสริมความยาวประมาณ 2-3 บรรทัด)
ส่วนที่ 2: งานย่อย 3 งานที่แนะนำให้สร้างในบอร์ดงาน โดยห้ามใช้ชื่อสมมติเด็ดขาด ให้ใช้ชื่อจริงพนักงานจากข้อมูลด้านบนเท่านั้นและจับคู่ตามทักษะงานจริง และต้องเขียนในรูปแบบโครงสร้างดังนี้เท่านั้น (เพื่อนำไปประมวลผลต่อ):
งานที่ 1: [ชื่องาน] | ผู้รับผิดชอบ: [ชื่อพนักงาน] | ความสำคัญ: [critical/high/medium/low] | คอร์สแนะนำ: [ชื่อคอร์ส]
งานที่ 2: [ชื่องาน] | ผู้รับผิดชอบ: [ชื่อพนักงาน] | ความสำคัญ: [critical/high/medium/low] | คอร์สแนะนำ: [ชื่อคอร์ส]
งานที่ 3: [ชื่องาน] | ผู้รับผิดชอบ: [ชื่อพนักงาน] | ความสำคัญ: [critical/high/medium/low] | คอร์สแนะนำ: [ชื่อคอร์ส]

*หมายเหตุ: คำว่า critical/high/medium/low ต้องเขียนเป็นภาษาอังกฤษตัวเล็กเท่านั้น และชื่อพนักงานต้องเป็นพนักงานจริงในระบบสะกดตรงกัน*`;

    let aiRawResponse = "";
    if (hasKeys) {
        try {
            aiRawResponse = await callAnalysisAI(prompt);
            console.log("AI Agent Raw response:", aiRawResponse);
        } catch (err) {
            console.error("AI Agent calling failed, falling back to local simulation:", err);
        }
    }
    
    let summaryText = "";
    let parsedTasks = [];
    
    if (aiRawResponse) {
        const summaryMatch = aiRawResponse.match(/(ส่วนที่ 1:.*|การวิเคราะห์เชิงสรุปย่อ:.*?)(?=\n+ส่วนที่ 2|งานที่ 1|$)/i);
        if (summaryMatch) {
            summaryText = summaryMatch[1].replace(/ส่วนที่ 1:\s*/i, '').replace(/การวิเคราะห์เชิงสรุปย่อ:\s*/i, '').trim();
        } else {
            summaryText = "วิเคราะห์ความเชี่ยวชาญของแผนกแล้ว AI Agent แนะนำให้สร้างโครงการย่อย 3 รายการเพื่อความสมดุลด้านกำลังคนและช่วยลดความเสี่ยงโครงการล่วงหน้า";
        }
        
        const taskRegex = /งานที่ \d+:\s*(.*?)\s*\|\s*ผู้รับผิดชอบ:\s*(.*?)\s*\|\s*ความสำคัญ:\s*(.*?)\s*\|\s*คอร์สแนะนำ:\s*(.*?)(?=\n|งานที่|$)/g;
        let match;
        while ((match = taskRegex.exec(aiRawResponse)) !== null) {
            const name = match[1].trim();
            const assignee = match[2].trim();
            const priority = match[3].trim().toLowerCase();
            const courseName = match[4].trim();
            
            const validPriority = ['critical', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium';
            const empExists = employeesData.find(e => e.name === assignee);
            const verifiedAssignee = empExists ? assignee : deptEmployees[0].name;

            parsedTasks.push({
                name,
                assignee: verifiedAssignee,
                priority: validPriority,
                courseName
            });
        }
    }
    
    if (parsedTasks.length < 3) {
        parsedTasks = generateLocalAgentRecommendations(goal, dept, deptEmployees);
        summaryText = `[โหมดจำลองเฉพาะที่] AI Agent วิเคราะห์ภาระงานและโครงสร้างของทีม เสนอแนะโครงการ 3 รายการย่อยสำหรับฝ่าย ${dept === 'all' ? 'ทุกฝ่าย' : dept} เพื่อเพิ่มประสิทธิภาพทักษะโดยตรง`;
    }
    
    lastAgentRecommendations = parsedTasks;
    
    if (step3) { step3.className = "agent-step completed"; step3.querySelector('.step-icon').innerHTML = '<i class="fas fa-check"></i>'; }
    if (step4) { step4.className = "agent-step active"; step4.querySelector('.step-icon').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; }
    
    // Step 4: Finalize
    await new Promise(r => setTimeout(r, 500));
    if (step4) { step4.className = "agent-step completed"; step4.querySelector('.step-icon').innerHTML = '<i class="fas fa-check"></i>'; }
    
    if (summaryAnalysis) summaryAnalysis.textContent = summaryText;
    
    let cardsHtml = "";
    parsedTasks.forEach((task, idx) => {
        const priorityLabels = { critical: 'วิกฤต', high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };
        const priorityLabel = priorityLabels[task.priority] || 'ปานกลาง';
        
        cardsHtml += `
            <div class="agent-idea-card">
                <div class="idea-header">
                    <div class="idea-title" style="font-weight:700;">งานแนะนำ #${idx + 1}: ${task.name}</div>
                    <span class="badge ${task.priority}">${priorityLabel}</span>
                </div>
                <div class="idea-details-grid">
                    <div class="idea-meta-item"><i class="fas fa-user-tie" style="color:var(--primary-yellow-dark)"></i> มอบหมาย: <strong>${task.assignee}</strong></div>
                    <div class="idea-meta-item"><i class="fas fa-graduation-cap" style="color:var(--info)"></i> คอร์สแนะนำ: <strong>${task.courseName}</strong></div>
                </div>
            </div>
        `;
    });
    
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
    
    if (loadingState) loadingState.style.display = "none";
    if (resultState) resultState.style.display = "block";
    
    showToast("AI Agent ระดมไอเดียสำเร็จ!", "success");
}

function generateLocalAgentRecommendations(goal, dept, employees) {
    const recommendations = [];
    const empCount = employees.length;
    
    const emp1 = employees[0];
    const emp2 = employees[empCount > 1 ? 1 : 0];
    const emp3 = employees[empCount > 2 ? 2 : (empCount > 1 ? 1 : 0)];

    if (goal === 'new-project') {
        recommendations.push({
            name: `ออกแบบและสร้าง Interface หน้าชำระเงินใหม่แบบ Responsive`,
            assignee: emp1.name,
            priority: 'high',
            courseName: 'UI/UX Advanced Prototyping'
        });
        recommendations.push({
            name: `พัฒนาระบบ RESTful API และปรับแต่ง Query บน Postgres`,
            assignee: emp2.name,
            priority: 'medium',
            courseName: 'Backend Optimization with Redis'
        });
        recommendations.push({
            name: `ติดตั้งและทำสคริปต์ Docker Container สำหรับ DevOps Pipeline`,
            assignee: emp3.name,
            priority: 'low',
            courseName: 'Docker & Kubernetes Mastery'
        });
    } else if (goal === 'skill-remedial') {
        recommendations.push({
            name: `ศึกษาหลักการและประยุกต์ใช้ React ในโครงการวิเคราะห์ทักษะ`,
            assignee: emp1.name,
            priority: 'high',
            courseName: 'React Core Development'
        });
        recommendations.push({
            name: `เข้าอบรมบทเรียนด้านความปลอดภัยของฐานข้อมูลเครือข่าย`,
            assignee: emp2.name,
            priority: 'medium',
            courseName: 'Cybersecurity Principles for Web Apps'
        });
        recommendations.push({
            name: `ศึกษาการทำ Automated Testing เพื่อเตรียมการทำ Integration`,
            assignee: emp3.name,
            priority: 'low',
            courseName: 'Jest & Cypress Automated Testing'
        });
    } else {
        recommendations.push({
            name: `จัดตั้งหัวข้อศึกษาการนำ LLM Chatbot เข้ามาช่วยเหลือบุคลากรในบริษัท`,
            assignee: emp1.name,
            priority: 'medium',
            courseName: 'Artificial Intelligence & ChatGPT Integration'
        });
        recommendations.push({
            name: `วิจัยแนวคิดและพัฒนา Progressive Web Apps (PWA) ให้ทำงานแบบออฟไลน์`,
            assignee: emp2.name,
            priority: 'high',
            courseName: 'Progressive Web Apps (PWA) Development'
        });
        recommendations.push({
            name: `ปรับปรุงหน้าตา UI ให้ได้คะแนน Lighthouse Performance 100`,
            assignee: emp3.name,
            priority: 'medium',
            courseName: 'Advanced CSS & Web Performance'
        });
    }
    
    return recommendations;
}

function resetAgentWorkspace() {
    document.getElementById('agentIdleState').style.display = "block";
    document.getElementById('agentLoadingState').style.display = "none";
    document.getElementById('agentResultState').style.display = "none";
    document.getElementById('aiAgentForm').reset();
    lastAgentRecommendations = [];
}

function applyAgentRecommendations() {
    if (lastAgentRecommendations.length === 0) return;
    
    const now = new Date();
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const deadlineStr = `${now.getDate() + 7} ${thaiMonths[now.getMonth()]} ${now.getFullYear()}`;
    
    lastAgentRecommendations.forEach(task => {
        const maxNum = tasksData.reduce((max, t) => {
            const num = parseInt(String(t.id).replace('tk-', '')) || 0;
            return num > max ? num : max;
        }, 0);
        
        const emp = employeesData.find(e => e.name === task.assignee);
        const dept = emp ? emp.dept : "ฝ่ายพัฒนา";
        
        let aiRisk = "ต่ำ";
        if (task.priority === "critical" || task.priority === "high") {
            aiRisk = "ปานกลาง";
        }

        const newTask = {
            id: `tk-${String(maxNum + 1).padStart(3, '0')}`,
            name: task.name,
            assignee: task.assignee,
            dept: dept,
            priority: task.priority,
            status: "pending",
            progress: 0,
            deadline: deadlineStr,
            aiRisk: aiRisk
        };
        
        tasksData.push(newTask);
        
        if (emp) {
            emp.tasks += 1;
        }
    });
    
    saveDatabase();
    updateDashboardKPIs();
    renderTasksTable();
    renderAllTasks();
    renderEmployees();
    
    showToast(`อนุมัติงาน 3 รายการสำเร็จ! เพิ่มงานใหม่ลงตารางงานบอร์ดเรียบร้อยแล้ว`, "success");
    showSection('tasks');
    resetAgentWorkspace();
}

function buildSystemContextPrompt() {
    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(t => t.status === 'completed').length;
    const progressTasks = tasksData.filter(t => t.status === 'in-progress').length;
    const blockedTasks = tasksData.filter(t => t.status === 'blocked').length;
    const pendingTasks = tasksData.filter(t => t.status === 'pending').length;
    const criticalTasks = tasksData.filter(t => t.priority === 'critical').length;
    
    let blockedListStr = tasksData.filter(t => t.status === 'blocked')
        .map(t => `- งาน "${t.name}" มอบหมายให้ ${t.assignee} (ความเสี่ยง: ${t.aiRisk})`)
        .join('\n');
    if (!blockedListStr) blockedListStr = "ไม่มีงานที่ติดขัด";

    let criticalListStr = tasksData.filter(t => t.priority === 'critical')
        .map(t => `- งานวิกฤต "${t.name}" มอบหมายให้ ${t.assignee} สถานะ: ${t.status}`)
        .join('\n');
    if (!criticalListStr) criticalListStr = "ไม่มีงานวิกฤต";

    const topEmployees = [...employeesData].sort((a,b) => b.performance - a.performance).slice(0, 3)
        .map(e => `- ${e.name} (ฝ่าย: ${e.dept}, คะแนนประสิทธิภาพ: ${e.performance}/100, งานค้าง: ${e.tasks} งาน)`)
        .join('\n');

    const completedCoursesCount = coursesData.filter(c => c.status === 'completed' || c.progress === 100).length;
    const totalCoursesCount = coursesData.length;

    return `คุณคือ "AI Project Manager Assistant" ผู้ช่วยอัจฉริยะในบอร์ดบริการจัดการงานและพัฒนาทักษะ (TalentSphere) ขององค์กร
นี่คือข้อมูลจริงในระบบขณะนี้:
- จำนวนงานทั้งหมด: ${totalTasks} งาน (เสร็จสิ้น: ${completedTasks}, กำลังทำ: ${progressTasks}, รอเริ่ม: ${pendingTasks}, ติดขัด: ${blockedTasks})
- งานที่ติดขัด (Blocked):\n${blockedListStr}
- งานวิกฤต (Critical):\n${criticalListStr}
- บุคลากรระดับท็อป (คะแนนสูงสุด 3 คนแรก):\n${topEmployees}
- ระบบการเรียนรู้ LMS: เรียนจบแล้ว ${completedCoursesCount} คอร์ส จากคอร์สทั้งหมด ${totalCoursesCount} คอร์ส

จงใช้ข้อมูลด้านบนเพื่อตอบคำถามของผู้ใช้อย่างเป็นกันเอง มีความเป็นมืออาชีพ และตอบกลับเป็นภาษาไทยเท่านั้น หากมีข้อแนะนำด้านทักษะหรือการสลับเปลี่ยนงานให้คนเรียนจบหลักสูตร LMS ที่เหมาะสม ให้เสนอแนะอย่างสร้างสรรค์`;
}

// ===== DYNAMIC AI INSIGHTS ANALYSIS =====
async function runSystemAiAnalysis() {
    const btnText = document.getElementById('runAiAnalysisBtnText');
    const btn = document.getElementById('runAiAnalysisBtn');
    const resultBox = document.getElementById('dynamicAiAnalysisResult');
    const textContent = document.getElementById('aiAnalysisTextContent');

    if (!btn || !resultBox || !textContent) return;

    btn.disabled = true;
    if (btnText) btnText.textContent = "กำลังวิเคราะห์ข้อมูลด้วย AI...";
    resultBox.style.display = "block";
    textContent.innerHTML = `
        <div style="text-align: center; padding: 24px 0;">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; color: var(--primary-yellow); margin-bottom: 12px;"></i>
            <p style="color: var(--medium-gray);">Gemini AI กำลังวิเคราะห์ข้อมูลโครงการและประสานทักษะพนักงาน...</p>
        </div>
    `;

    const systemContext = buildSystemContextPrompt();
    const prompt = `${systemContext}
    
    จงจัดทำ "รายงานวิเคราะห์ประสิทธิภาพเชิงลึกและการบริหารจัดการความเชี่ยวชาญขององค์กร" เป็นภาษาไทย
    โดยต้องประเมินและระบุประเด็นดังนี้:
    1. วิเคราะห์สภาพปัญหาคอขวด (งานที่เป็น Blocked) และเสนอชื่อพนักงานที่มีทักษะที่เกี่ยวข้องที่ควรเข้าไปช่วยแก้ไข (ระบุว่าพนักงานคนใด มีทักษะใดตรง หรือพึ่งเรียนจบวิชาอะไรจาก LMS ที่เอามาประยุกต์ได้)
    2. วิเคราะห์ภาระงานพนักงานที่สูงเกินไป (Overload) และเสนอแนวทางสลับงานหรือผ่อนปรน
    3. แนะนำวิถีการอบรมและการพัฒนาทักษะผ่าน LMS ที่สอดคล้องกับโปรเจกต์ด่วนที่กำลังจะเข้ามา
    
    ตอบในรูปแบบหัวข้อชัดเจน สวยงาม จัดรูปแบบด้วย HTML (เช่น h3, p, strong, ul, li) ห้ามแสดงแท็ก markdown เช่น ### หรือ ** เด็ดขาด ให้ใช้ HTML tags เท่านั้น`;

    try {
        const reply = await callAnalysisAI(prompt);
        textContent.innerHTML = reply;
        showToast("วิเคราะห์วิกฤตระบบด้วย AI สำเร็จ", "success");
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        setTimeout(() => {
            textContent.innerHTML = generateLocalAiAnalysisHTML();
            showToast("ระบบสลับมาใช้โหมดวิเคราะห์ Rule-based สำรอง", "warning");
        }, 1000);
    }

    btn.disabled = false;
    if (btnText) btnText.textContent = "วิเคราะห์ประสิทธิภาพเชิงลึกด้วย AI";
}

function generateLocalAiAnalysisHTML() {
    const blockedTasks = tasksData.filter(t => t.status === 'blocked');
    const overloadedEmps = employeesData.filter(e => e.tasks > 4);
    
    let blockedStr = "";
    if (blockedTasks.length > 0) {
        blockedTasks.forEach(t => {
            let helper = "Wipa Rattanaporn (Tech Lead)";
            if (t.name.toLowerCase().includes('design') || t.name.toLowerCase().includes('ui') || t.name.toLowerCase().includes('ux')) {
                helper = "Nida Patchara (Interaction Designer)";
            } else if (t.name.toLowerCase().includes('ci/cd') || t.name.toLowerCase().includes('devops') || t.name.toLowerCase().includes('pipeline')) {
                helper = "John Doe (DevOps Engineer)";
            }
            blockedStr += `<li>งาน <strong>"${t.name}"</strong> (มอบหมายให้ <em>${t.assignee}</em>) ติดขัดอยู่ แนะนำสลับงานหรือดึง <strong>${helper}</strong> เข้ามาช่วยสนับสนุน เนื่องจากมีทักษะและผ่านหลักสูตรพัฒนาทักษะแล้ว 100%</li>`;
        });
    } else {
        blockedStr = "<li>ไม่พบงานติดขัดร้ายแรงในระบบในขณะนี้</li>";
    }

    let overloadStr = "";
    if (overloadedEmps.length > 0) {
        overloadedEmps.forEach(e => {
            overloadStr += `<li><strong>${e.name}</strong> (${e.dept}) มีงานในมือทั้งหมด <strong>${e.tasks} งาน</strong> ซึ่งเกินเกณฑ์แนะนำ (4 งาน) ควรแบ่งงานหรือให้พนักงานท่านอื่นในฝ่ายเข้ามาช่วยประคองงานด่วน</li>`;
        });
    } else {
        overloadStr = "<li>ปริมาณภาระงานเฉลี่ยของบุคลากรรายบุคคลอยู่ในเกณฑ์สมดุลดี</li>";
    }

    return `
        <h3>📌 สรุปปัญหาคอขวดและแผนการสลับงาน</h3>
        <ul>
            ${blockedStr}
        </ul>
        <h3>📌 การจัดสรรบุคลากรและภารกิจล้นมือ (Workload Analysis)</h3>
        <ul>
            ${overloadStr}
        </ul>
        <h3>📌 คำแนะนำการอบรมผ่านระบบ LMS</h3>
        <p>จากการประเมิน ทักษะคลาวด์เดฟออปส์ (Cloud/DevOps) และการเชื่อมต่อ API กำลังเป็นที่ต้องการสูงสุดในปัจจุบัน แนะนำให้ผู้ดูแลระบบอนุมัติงบประมาณและเวลาทำกิจกรรมการศึกษาคอร์ส "Advanced Cloud Architecture" และ "Secure API Development" ให้กับทีมฝ่ายพัฒนา 3 รายที่มีความคืบหน้าน้อยกว่า 50% เพื่อแก้ปัญหางานสะดุดระยะยาว</p>
    `;
}

// ===== DYNAMIC REPORTS GENERATOR =====
let currentReportType = "";
let currentReportDept = "";
let currentReportDataRows = [];

function generateReportData() {
    const type = document.getElementById('reportTypeSelect').value;
    const dept = document.getElementById('reportDeptSelect').value;
    
    currentReportType = type;
    currentReportDept = dept;
    
    const promptBox = document.getElementById('reportPromptBox');
    const renderArea = document.getElementById('reportRenderArea');
    if (promptBox) promptBox.style.display = "none";
    if (renderArea) renderArea.style.display = "block";
    
    const titleText = document.getElementById('reportTitleText');
    const subText = document.getElementById('reportSubText');
    const kpisRow = document.getElementById('reportKpisRow');
    const detailsBox = document.getElementById('reportDetailsBox');
    const tableData = document.getElementById('reportTableData');
    
    const now = new Date();
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const formattedDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear()} | เวลา ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    
    subText.innerHTML = `ฝ่ายงาน: ${dept === 'all' ? 'ทุกฝ่ายงาน' : dept} | ข้อมูลออกรายงาน ณ วันที่ ${formattedDate}`;

    let filteredEmployees = employeesData;
    if (dept !== 'all') {
        filteredEmployees = employeesData.filter(e => e.dept === dept);
    }
    
    let filteredTasks = tasksData;
    if (dept !== 'all') {
        filteredTasks = tasksData.filter(t => t.dept === dept);
    }

    if (type === 'monthly-overview') {
        titleText.textContent = "รายงานภาพรวมโครงการและพัฒนาบุคลากรรายเดือน";
        
        const totalEmp = filteredEmployees.length;
        const totalTsk = filteredTasks.length;
        const completedTsk = filteredTasks.filter(t => t.status === 'completed').length;
        const compRate = totalTsk > 0 ? Math.round((completedTsk / totalTsk) * 100) : 0;
        
        const avgPerf = totalEmp > 0 ? Math.round(filteredEmployees.reduce((acc, e) => acc + e.performance, 0) / totalEmp) : 0;
        const lmsDone = coursesData.filter(c => c.status === 'completed' || c.progress === 100).length;

        kpisRow.innerHTML = `
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">พนักงานในสังกัด</div>
                <div class="report-kpi-val">${totalEmp} คน</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">ประสิทธิภาพเฉลี่ย</div>
                <div class="report-kpi-val" style="color:var(--info);">${avgPerf}/100</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">อัตรางานสำเร็จ</div>
                <div class="report-kpi-val" style="color:var(--success);">${compRate}%</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">ลงเรียนจบ LMS</div>
                <div class="report-kpi-val" style="color:var(--primary-yellow-dark);">${lmsDone} รายการ</div>
            </div>
        `;

        detailsBox.innerHTML = `
            <div class="report-bulletin">
                <strong>💡 สรุปการประเมินผู้บริหารโครงการ:</strong> ภาพรวมความก้าวหน้าโครงการของ ${dept === 'all' ? 'ทุกฝ่าย' : dept} ดำเนินไปอย่างราบรื่น คิดเป็นคะแนนประสิทธิภาพเฉลี่ย <strong>${avgPerf} คะแนน</strong> อย่างไรก็ตาม แนะนำให้ผลักดันพนักงานที่อยู่ในเกณฑ์ประสิทธิภาพต่ำกว่า 70 คะแนน ให้เร่งรัดทบทวนการทำงานและการอบรมทักษะเพิ่มเติมเพื่อการขับเคลื่อนเป้าหมายไตรมาสถัดไป
            </div>
        `;

        const thead = tableData.querySelector('thead');
        const tbody = tableData.querySelector('tbody');
        thead.innerHTML = `
            <tr>
                <th style="text-align:left;">ชื่อ-นามสกุล</th>
                <th style="text-align:left;">ฝ่าย</th>
                <th style="text-align:left;">ตำแหน่ง</th>
                <th style="text-align:center;">ภาระงานในมือ</th>
                <th style="text-align:center;">คอร์สเรียน LMS</th>
                <th style="text-align:left;">ทักษะหลัก</th>
                <th style="text-align:center;">ประสิทธิภาพ</th>
            </tr>
        `;
        
        currentReportDataRows = [];
        let rowsHtml = "";
        filteredEmployees.forEach(e => {
            rowsHtml += `
                <tr>
                    <td style="font-weight:600; text-align:left;">${e.name}</td>
                    <td style="text-align:left;">${e.dept}</td>
                    <td style="text-align:left;">${e.position}</td>
                    <td style="text-align:center;">${e.tasks} งาน</td>
                    <td style="text-align:center;">${e.courses} คอร์ส</td>
                    <td style="text-align:left; font-size: 12px;">${e.skills}</td>
                    <td style="text-align:center; font-weight:700; color:${e.performance >= 85 ? 'var(--success)' : e.performance >= 70 ? 'var(--warning)' : 'var(--danger)'};">${e.performance}/100</td>
                </tr>
            `;
            currentReportDataRows.push([e.name, e.dept, e.position, `${e.tasks} งาน`, `${e.courses} คอร์ส`, e.skills, `${e.performance}/100`]);
        });
        tbody.innerHTML = rowsHtml;

    } else if (type === 'task-bottlenecks') {
        titleText.textContent = "รายงานประเมินความเสี่ยงและงานติดขัด (Bottlenecks)";
        
        const totalTsk = filteredTasks.length;
        const blockedTsk = filteredTasks.filter(t => t.status === 'blocked').length;
        const criticalTsk = filteredTasks.filter(t => t.priority === 'critical').length;
        const highRiskTsk = filteredTasks.filter(t => t.aiRisk === 'สูง').length;

        kpisRow.innerHTML = `
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">ภาระงานรวม</div>
                <div class="report-kpi-val">${totalTsk} งาน</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">งานที่ติดขัด (Blocked)</div>
                <div class="report-kpi-val" style="color:var(--danger);">${blockedTsk} งาน</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">งานระดับวิกฤต (Critical)</div>
                <div class="report-kpi-val" style="color:var(--warning);">${criticalTsk} รายการ</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">ความเสี่ยง AI ระดับสูง</div>
                <div class="report-kpi-val" style="color:var(--danger);">${highRiskTsk} งาน</div>
            </div>
        `;

        detailsBox.innerHTML = `
            <div class="report-bulletin" style="border-left-color: var(--danger); background: #fffafb;">
                <strong>⚠️ การวิเคราะห์ความเสี่ยงและแนวทางเยียวยาคอขวด:</strong> ตรวจพบงานที่มีสถานะติดขัดและค้างส่งเดดไลน์จำนวน <strong>${blockedTsk} งาน</strong> ทาง AI แนะนำให้ทำการประเมินภาระงานของพนักงาน หากพบว่ากำลังทำงานวิกฤตหลายรายการพร้อมกัน ควรสลับงานไปให้คนในฝ่ายที่มีศักยภาพสูงสุด ณ ตอนนี้
            </div>
        `;

        const thead = tableData.querySelector('thead');
        const tbody = tableData.querySelector('tbody');
        thead.innerHTML = `
            <tr>
                <th style="text-align:left;">ชื่องาน</th>
                <th style="text-align:left;">ผู้รับผิดชอบ</th>
                <th style="text-align:center;">ฝ่าย</th>
                <th style="text-align:center;">ความสำคัญ</th>
                <th style="text-align:center;">สถานะงาน</th>
                <th style="text-align:center;">Deadline</th>
                <th style="text-align:center;">ความเสี่ยง AI</th>
            </tr>
        `;

        currentReportDataRows = [];
        let rowsHtml = "";
        filteredTasks.forEach(t => {
            rowsHtml += `
                <tr>
                    <td style="font-weight:600; text-align:left;">${t.name}</td>
                    <td style="text-align:left;">${t.assignee}</td>
                    <td style="text-align:center;">${t.dept}</td>
                    <td style="text-align:center;"><span class="badge ${t.priority}">${t.priority === 'critical' ? 'วิกฤต' : t.priority === 'high' ? 'สูง' : t.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}</span></td>
                    <td style="text-align:center;"><span class="badge ${t.status}">${t.status === 'completed' ? 'เสร็จสิ้น' : t.status === 'in-progress' ? 'กำลังทำ' : t.status === 'blocked' ? 'ติดขัด' : 'รอดำเนินการ'}</span></td>
                    <td style="text-align:center;">${t.deadline}</td>
                    <td style="text-align:center; font-weight:700; color:${t.aiRisk === 'สูง' ? 'var(--danger)' : t.aiRisk === 'ปานกลาง' ? 'var(--warning)' : 'var(--success)'};">${t.aiRisk}</td>
                </tr>
            `;
            currentReportDataRows.push([t.name, t.assignee, t.dept, t.priority, t.status, t.deadline, t.aiRisk]);
        });
        tbody.innerHTML = rowsHtml;

    } else if (type === 'skill-development') {
        titleText.textContent = "รายงานความก้าวหน้าการอบรมทักษะ LMS";
        
        let filteredCourses = coursesData;
        if (dept !== 'all') {
            const deptLearners = employeesData.filter(e => e.dept === dept).map(e => e.name);
            filteredCourses = coursesData.filter(c => deptLearners.includes(c.learner));
        }

        const totalStudy = filteredCourses.length;
        const completedStudy = filteredCourses.filter(c => c.status === 'completed').length;
        const progressStudy = filteredCourses.filter(c => c.status === 'in-progress').length;
        const droppedStudy = filteredCourses.filter(c => c.status === 'dropped').length;
        const compRate = totalStudy > 0 ? Math.round((completedStudy / totalStudy) * 100) : 0;

        kpisRow.innerHTML = `
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">หลักสูตรที่ลงทะเบียน</div>
                <div class="report-kpi-val">${totalStudy} คอร์ส</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">เรียนเสร็จสมบูรณ์</div>
                <div class="report-kpi-val" style="color:var(--success);">${completedStudy} คอร์ส</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">กำลังเรียนศึกษาอยู่</div>
                <div class="report-kpi-val" style="color:var(--warning);">${progressStudy} รายการ</div>
            </div>
            <div class="report-kpi-card">
                <div style="font-size:12px; color:var(--medium-gray);">อัตราความสำเร็จ</div>
                <div class="report-kpi-val" style="color:var(--info);">${compRate}%</div>
            </div>
        `;

        detailsBox.innerHTML = `
            <div class="report-bulletin" style="border-left-color: var(--primary-yellow-dark); background: #fdfaf6;">
                <strong>🎓 บทวิเคราะห์ความก้าวหน้า LMS:</strong> ขณะนี้มีพนักงานศึกษาคอร์สออนไลน์จนสำเร็จการฝึกอบรมไปแล้วจำนวน <strong>${completedStudy} หลักสูตร</strong> และตรวจพบหลักสูตรที่มีอัตรา Drop-out (ดอง) สะสม ${droppedStudy} รายการ ซึ่งมีผลเสียทางด้าน Skill Gap แนะนำให้ส่งข้อความผลักดันรายคนเพื่อกระตุ้นให้กลับเข้ามาศึกษาต่อ
            </div>
        `;

        const thead = tableData.querySelector('thead');
        const tbody = tableData.querySelector('tbody');
        thead.innerHTML = `
            <tr>
                <th style="text-align:left;">ชื่อคอร์ส</th>
                <th style="text-align:left;">ผู้เรียน</th>
                <th style="text-align:center;">สถานะ</th>
                <th style="text-align:center;">ความคืบหน้า (%)</th>
                <th style="text-align:center;">บทเรียนที่เหลือ</th>
                <th style="text-align:left;">คำแนะนำอัจฉริยะจาก AI</th>
            </tr>
        `;

        currentReportDataRows = [];
        let rowsHtml = "";
        filteredCourses.forEach(c => {
            rowsHtml += `
                <tr>
                    <td style="font-weight:600; text-align:left;">${c.name}</td>
                    <td style="text-align:left;">${c.learner}</td>
                    <td style="text-align:center;"><span class="badge ${c.status === 'completed' ? 'completed' : c.status === 'in-progress' ? 'in-progress' : c.status === 'dropped' ? 'blocked' : 'pending'}">${c.status === 'completed' ? 'เรียนสำเร็จ' : c.status === 'in-progress' ? 'กำลังเรียน' : c.status === 'dropped' ? 'ดอง/ยกเลิก' : 'ยังไม่เริ่ม'}</span></td>
                    <td style="text-align:center; font-weight:700;">${c.progress}%</td>
                    <td style="text-align:center;">${c.remaining} บท</td>
                    <td style="text-align:left; font-size:12px; color:var(--medium-gray);">${c.aiSuggestion}</td>
                </tr>
            `;
            currentReportDataRows.push([c.name, c.learner, c.status, `${c.progress}%`, `${c.remaining} บท`, c.aiSuggestion]);
        });
        tbody.innerHTML = rowsHtml;
    }
    
    showToast("สร้างรายงานอัปเดตข้อมูลสำเร็จ", "success");
}

function exportReportCSV() {
    if (currentReportDataRows.length === 0) {
        showToast("ไม่พบข้อมูลรายงานให้ส่งออก", "warning");
        return;
    }
    
    let csv = "";
    let filename = "";
    let headers = [];
    
    if (currentReportType === 'monthly-overview') {
        headers = ["ชื่อ-นามสกุล", "ฝ่าย", "ตำแหน่ง", "ภาระงานในมือ", "คอร์สเรียน LMS", "ทักษะหลัก", "ประสิทธิภาพ"];
        filename = `monthly_overview_report_${currentReportDept}.csv`;
    } else if (currentReportType === 'task-bottlenecks') {
        headers = ["ชื่องาน", "ผู้รับผิดชอบ", "ฝ่าย", "ความสำคัญ", "สถานะ", "Deadline", "ความเสี่ยง AI"];
        filename = `task_bottlenecks_report_${currentReportDept}.csv`;
    } else if (currentReportType === 'skill-development') {
        headers = ["ชื่อคอร์ส", "ผู้เรียน", "สถานะการเรียน", "ความก้าวหน้า", "บทเรียนคงเหลือ", "คำแนะนำ AI"];
        filename = `skills_lms_report_${currentReportDept}.csv`;
    }
    
    csv += headers.join(",") + "\n";
    currentReportDataRows.forEach(r => {
        csv += r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",") + "\n";
    });
    
    downloadCSV(csv, filename);
    showToast("ส่งออกข้อมูลรายงานสำเร็จ (CSV)", "success");
}

// ===== Live Activity Ticker (Phase 3 Premium Interaction) =====
function buildActivityTicker() {
    const container = document.getElementById('activityTickerItems');
    if (!container) return;
    
    let tickerHtml = '';
    const items = [];
    
    // 1. Gather completed tasks
    if (typeof tasksData !== 'undefined') {
        tasksData.filter(t => t.status === 'completed').slice(0, 4).forEach(t => {
            items.push(`<i class="fas fa-check-circle" style="color: var(--success);"></i> <strong>${t.assignee}</strong> ทำงาน "<strong>${t.name}</strong>" เสร็จสิ้น (+50 แต้ม)`);
        });
        
        // 2. Gather blocked tasks
        tasksData.filter(t => t.status === 'blocked').forEach(t => {
            items.push(`<i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i> งาน "<strong>${t.name}</strong>" ของ <strong>${t.assignee}</strong> มีสถานะ <strong>ติดขัด (Blocked)</strong>`);
        });
    }
    
    // 3. Gather completed courses
    if (typeof coursesData !== 'undefined') {
        coursesData.filter(c => c.status === 'completed').slice(0, 3).forEach(c => {
            items.push(`<i class="fas fa-graduation-cap" style="color: var(--info);"></i> <strong>${c.learner}</strong> เรียนผ่านหลักสูตร "<strong>${c.name}</strong>" สำเร็จ`);
        });
    }
    
    // 4. Gather high priority in-progress tasks
    if (typeof tasksData !== 'undefined') {
        tasksData.filter(t => t.status === 'in-progress' && t.priority === 'high').slice(0, 3).forEach(t => {
            items.push(`<i class="fas fa-spinner fa-spin" style="color: var(--primary-yellow);"></i> <strong>${t.assignee}</strong> กำลังเร่งดำเนินงาน "<strong>${t.name}</strong>"`);
        });
    }
    
    // Fallback if no items
    if (items.length === 0) {
        items.push(`<i class="fas fa-info-circle"></i> ระบบทำงานปกติ ไม่มีปัญหาความเสี่ยงขณะนี้`);
    }
    
    // Repeat items to ensure continuous scroll loop with no empty gap
    const repeatedItems = [...items, ...items, ...items];
    
    tickerHtml = repeatedItems.map(item => `<span class="ticker-item">${item}</span>`).join('');
    container.innerHTML = tickerHtml;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadEnvConfig();
    await initDatabase();
    initTheme();
    
    renderTasksTable();
    renderAllTasks();
    renderCourses();
    renderEmployees();
    
    initDashboardCharts();
    dashboardChartsInitialized = true;
    initSearchAndFilters();
    startSimulation();

    // Trigger Phase 3 Premium Interactions
    buildActivityTicker();
    if (typeof animateCounters === 'function') animateCounters();
    if (typeof initTiltCards === 'function') initTiltCards();
    if (typeof initParticleTrail === 'function') initParticleTrail();
    if (typeof initProgressRings === 'function') initProgressRings();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            if (typeof playTick === 'function') playTick();
        });
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});
