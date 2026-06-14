// Global chart instance references
let performanceChartInstance = null;
let statusChartInstance = null;
let learningChartInstance = null;
let courseStatusChartInstance = null;
let deptPerformanceChartInstance = null;
let priorityStatusChartInstance = null;
let skillsMatrixChartInstance = null;

// ===== CHARTS =====
function initDashboardCharts() {
    setTimeout(() => {
        // Calculate status chart data from real tasksData
        const completedCount = tasksData.filter(t => t.status === 'completed').length;
        const progressCount = tasksData.filter(t => t.status === 'in-progress').length;
        const blockedCount = tasksData.filter(t => t.status === 'blocked').length;
        const pendingCount = tasksData.filter(t => t.status === 'pending').length;

        // Status Chart
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            if (statusChartInstance) {
                statusChartInstance.data.datasets[0].data = [completedCount, progressCount, blockedCount, pendingCount];
                statusChartInstance.update();
            } else {
                statusChartInstance = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['เสร็จสิ้น', 'กำลังทำ', 'ติดขัด', 'รอดำเนินการ'],
                        datasets: [{
                            data: [completedCount, progressCount, blockedCount, pendingCount],
                            backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#2196F3'],
                            borderWidth: 0,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { usePointStyle: true, font: { family: 'Noto Sans Thai', size: 11 }, padding: 16 }
                            }
                        }
                    }
                });
            }
        }

        // Performance Chart (weekly trend representation based on status distribution)
        const perfCtx = document.getElementById('performanceChart');
        if (perfCtx) {
            const baseCompleted = [12, 15, 18, 14, 20, 22, completedCount];
            const baseBlocked = [3, 2, 4, 5, 3, 2, blockedCount];

            if (performanceChartInstance) {
                performanceChartInstance.data.datasets[0].data = baseCompleted;
                performanceChartInstance.data.datasets[1].data = baseBlocked;
                performanceChartInstance.update();
            } else {
                performanceChartInstance = new Chart(perfCtx, {
                    type: 'line',
                    data: {
                        labels: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
                        datasets: [{
                            label: 'งานเสร็จสิ้น',
                            data: baseCompleted,
                            borderColor: '#D4A017',
                            backgroundColor: 'rgba(212, 160, 23, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#D4A017',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        }, {
                            label: 'งานติดขัด',
                            data: baseBlocked,
                            borderColor: '#F44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#F44336',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { usePointStyle: true, font: { family: 'Noto Sans Thai', size: 12 } }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }
    }, 100);
}

function initLearningCharts() {
    setTimeout(() => {
        // Calculate course status chart data from real coursesData
        const completedLMS = coursesData.filter(c => c.status === 'completed').length;
        const progressLMS = coursesData.filter(c => c.status === 'in-progress').length;
        const droppedLMS = coursesData.filter(c => c.status === 'dropped').length;
        const pendingLMS = coursesData.filter(c => c.status === 'pending').length;

        // Course Status Chart
        const courseCtx = document.getElementById('courseStatusChart');
        if (courseCtx) {
            if (courseStatusChartInstance) {
                courseStatusChartInstance.data.datasets[0].data = [completedLMS, progressLMS, droppedLMS, pendingLMS];
                courseStatusChartInstance.update();
            } else {
                courseStatusChartInstance = new Chart(courseCtx, {
                    type: 'pie',
                    data: {
                        labels: ['เสร็จสิ้น', 'กำลังเรียน', 'ดอง', 'รอเริ่ม'],
                        datasets: [{
                            data: [completedLMS, progressLMS, droppedLMS, pendingLMS],
                            backgroundColor: ['#4CAF50', '#D4A017', '#F44336', '#9E9E9E'],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { usePointStyle: true, font: { family: 'Noto Sans Thai', size: 11 }, padding: 12 }
                            }
                        }
                    }
                });
            }
        }

        // Learning Chart (weekly progress lessons completed representation)
        const learnCtx = document.getElementById('learningChart');
        if (learnCtx) {
            const baseLessons = [24, 32, 28, 45, 38, completedLMS * 3 + 10]; // dynamically scaled final week

            if (learningChartInstance) {
                learningChartInstance.data.datasets[0].data = baseLessons;
                learningChartInstance.update();
            } else {
                learningChartInstance = new Chart(learnCtx, {
                    type: 'bar',
                    data: {
                        labels: ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4', 'สัปดาห์ 5', 'สัปดาห์ 6'],
                        datasets: [{
                            label: 'บทเรียนที่เสร็จสิ้น',
                            data: baseLessons,
                            backgroundColor: '#D4A017',
                            borderRadius: 6,
                            barThickness: 24
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }
    }, 100);
}

function initAnalyticsCharts() {
    setTimeout(() => {
        // 1. Department Performance Chart
        // Group employees by dept and average their performance
        const depts = ["ฝ่ายพัฒนา", "ฝ่ายออกแบบ", "ฝ่ายบริหาร"];
        const deptScores = depts.map(dept => {
            const list = employeesData.filter(e => e.dept === dept);
            if (list.length === 0) return 0;
            const sum = list.reduce((acc, curr) => acc + curr.performance, 0);
            return Math.round(sum / list.length);
        });

        // Set KPI card for top department
        const topDeptIdx = deptScores.indexOf(Math.max(...deptScores));
        const topDeptNameEl = document.getElementById('topDeptName');
        const topDeptScoreEl = document.getElementById('topDeptScore');
        if (topDeptNameEl && topDeptScoreEl && topDeptIdx !== -1) {
            topDeptNameEl.textContent = depts[topDeptIdx];
            topDeptScoreEl.textContent = `คะแนนเฉลี่ยสูงสุด: ${deptScores[topDeptIdx]}/100`;
        }

        const deptCtx = document.getElementById('deptPerformanceChart');
        if (deptCtx) {
            if (deptPerformanceChartInstance) {
                deptPerformanceChartInstance.data.datasets[0].data = deptScores;
                deptPerformanceChartInstance.update();
            } else {
                deptPerformanceChartInstance = new Chart(deptCtx, {
                    type: 'bar',
                    data: {
                        labels: depts,
                        datasets: [{
                            label: 'คะแนนประสิทธิภาพเฉลี่ย',
                            data: deptScores,
                            backgroundColor: ['#D4A017', '#4CAF50', '#2196F3'],
                            borderRadius: 6,
                            barThickness: 32
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        // 2. Priority vs Status Stacked Chart
        const priorities = ['critical', 'high', 'medium', 'low'];
        const priorityLabels = ['วิกฤต', 'สูง', 'ปานกลาง', 'ต่ำ'];
        const statuses = ['pending', 'in-progress', 'blocked', 'completed'];
        const statusLabels = ['รอดำเนินการ', 'กำลังทำ', 'ติดขัด', 'เสร็จสิ้น'];
        const statusColors = ['#2196F3', '#FF9800', '#F44336', '#4CAF50'];

        const datasets = statuses.map((status, idx) => {
            const data = priorities.map(priority => {
                return tasksData.filter(t => t.priority === priority && t.status === status).length;
            });
            return {
                label: statusLabels[idx],
                data: data,
                backgroundColor: statusColors[idx],
                barThickness: 28
            };
        });

        // Compute overall risk KPIs
        const blockedCount = tasksData.filter(t => t.status === 'blocked').length;
        const criticalCount = tasksData.filter(t => t.priority === 'critical').length;
        const avgRiskEl = document.getElementById('avgRiskText');
        const highRiskEl = document.getElementById('highRiskCount');
        if (avgRiskEl && highRiskEl) {
            let overallRisk = "ต่ำ";
            if (blockedCount > 3 || criticalCount > 3) {
                overallRisk = "สูง";
                avgRiskEl.style.color = "var(--danger)";
            } else if (blockedCount > 0 || criticalCount > 0) {
                overallRisk = "ปานกลาง";
                avgRiskEl.style.color = "var(--warning)";
            } else {
                avgRiskEl.style.color = "var(--success)";
            }
            avgRiskEl.textContent = overallRisk;
            highRiskEl.textContent = `มีงานติดขัด ${blockedCount} และวิกฤต ${criticalCount} รายการ`;
        }

        const priCtx = document.getElementById('priorityStatusChart');
        if (priCtx) {
            if (priorityStatusChartInstance) {
                priorityStatusChartInstance.data.datasets = datasets;
                priorityStatusChartInstance.update();
            } else {
                priorityStatusChartInstance = new Chart(priCtx, {
                    type: 'bar',
                    data: {
                        labels: priorityLabels,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                            x: { stacked: true, grid: { display: false } }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { usePointStyle: true, font: { family: 'Noto Sans Thai', size: 11 } }
                            }
                        }
                    }
                });
            }
        }

        // 3. Skills Matrix Chart (Horizontal Bar Chart)
        const skillFrequency = {};
        employeesData.forEach(e => {
            if (!e.skills) return;
            const skillList = e.skills.split(',').map(s => s.trim());
            skillList.forEach(s => {
                if (!s) return;
                const norm = s.toLowerCase();
                let display = s;
                if (norm === 'node.js' || norm === 'node') display = 'Node.js';
                else if (norm === 'react' || norm === 'react.js') display = 'React';
                else if (norm === 'python') display = 'Python';
                else if (norm === 'figma') display = 'Figma';
                else if (norm === 'css' || norm === 'html') display = 'CSS/HTML';
                else if (norm === 'cloud' || norm === 'aws') display = 'Cloud/AWS';
                else if (norm === 'agile' || norm === 'scrum') display = 'Agile/Scrum';
                
                skillFrequency[display] = (skillFrequency[display] || 0) + 1;
            });
        });

        const sortedSkills = Object.keys(skillFrequency).map(key => {
            return { name: key, count: skillFrequency[key] };
        }).sort((a, b) => b.count - a.count);

        const skillNames = sortedSkills.map(s => s.name);
        const skillCounts = sortedSkills.map(s => s.count);

        const totalSkillsTextEl = document.getElementById('totalSkillsText');
        if (totalSkillsTextEl) {
            totalSkillsTextEl.textContent = `${sortedSkills.length} ทักษะ`;
        }
        
        const completedCoursesCountEl = document.getElementById('completedCoursesCount');
        const completedCoursesPercentEl = document.getElementById('completedCoursesPercent');
        if (completedCoursesCountEl && completedCoursesPercentEl) {
            const completedCount = coursesData.filter(c => c.status === 'completed' || c.progress === 100).length;
            const totalCourses = coursesData.length;
            completedCoursesCountEl.textContent = `${completedCount} คอร์ส`;
            const pct = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
            completedCoursesPercentEl.textContent = `คิดเป็น ${pct}% จากทั้งหมด`;
        }

        const skillCtx = document.getElementById('skillsMatrixChart');
        if (skillCtx) {
            if (skillsMatrixChartInstance) {
                skillsMatrixChartInstance.data.labels = skillNames.slice(0, 10);
                skillsMatrixChartInstance.data.datasets[0].data = skillCounts.slice(0, 10);
                skillsMatrixChartInstance.update();
            } else {
                skillsMatrixChartInstance = new Chart(skillCtx, {
                    type: 'bar',
                    data: {
                        labels: skillNames.slice(0, 10),
                        datasets: [{
                            label: 'จำนวนพนักงานที่มีทักษะ',
                            data: skillCounts.slice(0, 10),
                            backgroundColor: 'rgba(212, 160, 23, 0.75)',
                            borderColor: 'var(--primary-yellow-dark)',
                            borderWidth: 1,
                            borderRadius: 4,
                            barThickness: 18
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
                            y: { grid: { display: false } }
                        }
                    }
                });
            }
        }
    }, 100);
}
