// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXH7JgXl7z8vHNMBLGJxs9TfE4XmPfgpY",
    authDomain: "step-tracker-app-demo.firebaseapp.com",
    databaseURL: "https://step-tracker-app-demo-default-rtdb.firebaseio.com",
    projectId: "step-tracker-app-demo",
    storageBucket: "step-tracker-app-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase with error handling
let database, usersRef, groupsRef, stepDataRef;

try {
    firebase.initializeApp(firebaseConfig);
    
    // Firebase references
    database = firebase.database();
    usersRef = database.ref('users');
    groupsRef = database.ref('groups');
    stepDataRef = database.ref('stepData');
    
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
    alert("Firebase连接错误，请检查网络连接或刷新页面重试。");
}

// DOM Elements
const loginModal = document.getElementById('login-modal');
const groupModal = document.getElementById('group-modal');
const usernameDisplay = document.getElementById('username');
const stepInput = document.getElementById('step-count');
const submitStepsBtn = document.getElementById('submit-steps');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const rankingContainer = document.querySelector('.ranking-container');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const joinGroupBtn = document.getElementById('join-group-btn');
const createGroupBtn = document.getElementById('create-group-btn');

// App state
let currentUser = null;
let currentGroup = null;
let users = [];
let groups = [];
let stepData = [];

// Check Firebase connection
function checkFirebaseConnection() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject("Firebase database not initialized");
            return;
        }
        
        const connectedRef = database.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            if (snap.val() === true) {
                console.log("Firebase connected");
                resolve(true);
            } else {
                console.log("Firebase not connected");
                resolve(false);
            }
        }, (error) => {
            console.error("Firebase connection check error:", error);
            reject(error);
        });
    });
}

// Initialize the app
async function init() {
    console.log("Initializing app...");
    
    try {
        // Check Firebase connection
        await checkFirebaseConnection();
        
        // Add event listeners first (so UI is responsive even if Firebase fails)
        if (submitStepsBtn) {
            submitStepsBtn.addEventListener('click', updateSteps);
            console.log("Submit button listener added");
        }
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
            console.log("Tab button listener added for", button.dataset.tab);
        });
        
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
            console.log("Login button listener added");
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', handleRegister);
            console.log("Register button listener added");
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log("Logout button listener added");
        }
        
        if (joinGroupBtn) {
            joinGroupBtn.addEventListener('click', handleJoinGroup);
            console.log("Join group button listener added");
        }
        
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', handleCreateGroup);
            console.log("Create group button listener added");
        }
        
        // Check if data exists in Firebase
        await initializeDatabase();
        
        // Show login modal if no user is logged in
        if (!currentUser) {
            showLoginModal();
        }
        
        // Listen for data changes
        if (stepDataRef) {
            stepDataRef.on('value', snapshot => {
                stepData = snapshot.val() || [];
                updateDashboard();
            });
        }
    } catch (error) {
        console.error("App initialization error:", error);
        alert("应用初始化错误，请刷新页面重试。");
        showLoginModal(); // Show login modal anyway so user can at least try to log in
    }
}

// Initialize database with sample data if empty
async function initializeDatabase() {
    try {
        if (!database || !usersRef || !groupsRef || !stepDataRef) {
            console.error("Firebase references not initialized");
            throw new Error("Firebase references not initialized");
        }
        
        // Check if users exist
        const usersSnapshot = await usersRef.once('value');
        if (!usersSnapshot.exists()) {
            // Add sample users
            await usersRef.set([
                { id: 1, username: '冉启兵', password: 'pass1' },
                { id: 2, username: '冉理', password: 'pass2' },
                { id: 3, username: '冉荣', password: 'pass3' }
            ]);
            console.log("Sample users created");
        }
        
        // Check if groups exist
        const groupsSnapshot = await groupsRef.once('value');
        if (!groupsSnapshot.exists()) {
            // Add sample group
            await groupsRef.set([
                { 
                    id: 1, 
                    name: '步数小组', 
                    code: 'STEP123',
                    members: [1, 2, 3]
                }
            ]);
            console.log("Sample group created");
        }
        
        // Check if step data exists
        const stepDataSnapshot = await stepDataRef.once('value');
        if (!stepDataSnapshot.exists()) {
            // Add sample step data (just a few recent entries for each user)
            const sampleData = [];
            
            // Generate data for the past 30 days
            const today = new Date();
            
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // User 1 data
                sampleData.push({
                    userId: 1,
                    date: dateStr,
                    steps: Math.floor(Math.random() * 15000) + 5000
                });
                
                // User 2 data
                sampleData.push({
                    userId: 2,
                    date: dateStr,
                    steps: Math.floor(Math.random() * 20000) + 5000
                });
                
                // User 3 data
                sampleData.push({
                    userId: 3,
                    date: dateStr,
                    steps: Math.floor(Math.random() * 25000) + 5000
                });
            }
            
            await stepDataRef.set(sampleData);
            console.log("Sample step data created");
        }
        
        // Load data from Firebase
        await loadData();
        
    } catch (error) {
        console.error("Database initialization error:", error);
        alert("数据初始化失败，请刷新页面重试。");
        throw error;
    }
}

// Load data from Firebase
async function loadData() {
    const usersSnapshot = await usersRef.once('value');
    users = usersSnapshot.val() || [];
    
    const groupsSnapshot = await groupsRef.once('value');
    groups = groupsSnapshot.val() || [];
    
    const stepDataSnapshot = await stepDataRef.once('value');
    stepData = stepDataSnapshot.val() || [];
    
    // Auto-login with the first user for demo purposes
    currentUser = users[0];
    currentGroup = groups[0];
    
    if (usernameDisplay && currentUser) {
        usernameDisplay.textContent = currentUser.username;
    }
    
    // Update the dashboard
    updateDashboard();
}

// Show login modal
function showLoginModal() {
    loginModal.classList.add('active');
}

// Show group modal
function showGroupModal() {
    groupModal.classList.add('active');
    loginModal.classList.remove('active');
}

// Handle login
async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const usersSnapshot = await usersRef.once('value');
    const allUsers = usersSnapshot.val() || [];
    
    const user = allUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        usernameDisplay.textContent = user.username;
        loginModal.classList.remove('active');
        
        // Check if user is in a group
        const groupsSnapshot = await groupsRef.once('value');
        const allGroups = groupsSnapshot.val() || [];
        
        const userGroup = allGroups.find(g => g.members.includes(user.id));
        if (userGroup) {
            currentGroup = userGroup;
            updateDashboard();
        } else {
            showGroupModal();
        }
    } else {
        alert('用户名或密码错误');
    }
}

// Handle register
async function handleRegister() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (username && password) {
        const usersSnapshot = await usersRef.once('value');
        const allUsers = usersSnapshot.val() || [];
        
        // Check if username already exists
        if (allUsers.some(u => u.username === username)) {
            alert('用户名已存在');
            return;
        }
        
        const newId = allUsers.length + 1;
        const newUser = { id: newId, username, password };
        allUsers.push(newUser);
        
        await usersRef.set(allUsers);
        
        currentUser = newUser;
        usernameDisplay.textContent = newUser.username;
        loginModal.classList.remove('active');
        showGroupModal();
    } else {
        alert('请输入用户名和密码');
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    currentGroup = null;
    showLoginModal();
}

// Handle join group
async function handleJoinGroup() {
    const groupCode = document.getElementById('group-code').value;
    
    const groupsSnapshot = await groupsRef.once('value');
    const allGroups = groupsSnapshot.val() || [];
    
    const groupIndex = allGroups.findIndex(g => g.code === groupCode);
    if (groupIndex !== -1) {
        const group = allGroups[groupIndex];
        if (!group.members.includes(currentUser.id)) {
            group.members.push(currentUser.id);
            await groupsRef.set(allGroups);
        }
        
        currentGroup = group;
        groupModal.classList.remove('active');
        updateDashboard();
    } else {
        alert('小组代码无效');
    }
}

// Handle create group
async function handleCreateGroup() {
    const groupsSnapshot = await groupsRef.once('value');
    const allGroups = groupsSnapshot.val() || [];
    
    const newGroupId = allGroups.length + 1;
    const newGroupCode = 'G' + Math.floor(1000 + Math.random() * 9000);
    
    const newGroup = {
        id: newGroupId,
        name: '小组 ' + newGroupId,
        code: newGroupCode,
        members: [currentUser.id]
    };
    
    allGroups.push(newGroup);
    await groupsRef.set(allGroups);
    
    currentGroup = newGroup;
    groupModal.classList.remove('active');
    alert(`您的小组代码是: ${newGroupCode}`);
    updateDashboard();
}

// Get activity level based on step count
function getActivityLevel(steps) {
    if (steps < 5000) {
        return { level: '久坐不动型', color: '#FF5252' };
    } else if (steps < 10000) {
        return { level: '轻度活动型', color: '#FFC107' };
    } else if (steps <= 12500) {
        return { level: '活跃型', color: '#4CAF50' };
    } else {
        return { level: '高度活跃型', color: '#2196F3' };
    }
}

// Update steps
async function updateSteps() {
    if (!currentUser) {
        alert('请先登录');
        showLoginModal();
        return;
    }
    
    const steps = parseInt(stepInput.value);
    
    if (isNaN(steps) || steps < 0) {
        alert('请输入有效的步数');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const stepDataSnapshot = await stepDataRef.once('value');
    const allStepData = stepDataSnapshot.val() || [];
    
    // Check if there's already an entry for today
    const existingEntryIndex = allStepData.findIndex(
        entry => entry.userId === currentUser.id && entry.date === today
    );
    
    if (existingEntryIndex !== -1) {
        allStepData[existingEntryIndex].steps = steps;
    } else {
        allStepData.push({
            userId: currentUser.id,
            date: today,
            steps: steps
        });
    }
    
    await stepDataRef.set(allStepData);
    
    // Get activity level
    const activityInfo = getActivityLevel(steps);
    
    // Create activity level message
    const message = `步数更新成功！\n\n活动水平: ${activityInfo.level}`;
    
    stepInput.value = '';
    alert(message);
}

// Switch tab
function switchTab(tabId) {
    tabButtons.forEach(button => {
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    if (tabId === 'weekly') {
        renderWeeklyChart();
    } else if (tabId === 'monthly') {
        renderMonthlyChart();
    }
}

// Update dashboard
function updateDashboard() {
    if (!currentUser || !currentGroup) return;
    
    renderRankings();
    renderWeeklyChart();
    renderMonthlyChart();
}

// Render rankings
function renderRankings() {
    if (!currentGroup || !rankingContainer || !stepData.length) return;
    
    rankingContainer.innerHTML = '';
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Get today's steps for group members
    const groupSteps = stepData
        .filter(entry => 
            currentGroup.members.includes(entry.userId) && 
            entry.date === today
        )
        .sort((a, b) => b.steps - a.steps);
    
    groupSteps.forEach((entry, index) => {
        const user = users.find(u => u.id === entry.userId);
        if (!user) return;
        
        // Get yesterday's steps for trend comparison
        const yesterdayEntry = stepData.find(e => 
            e.userId === entry.userId && e.date === yesterdayStr
        );
        
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        const position = document.createElement('div');
        position.className = `rank-position position-${index + 1}`;
        position.textContent = index + 1;
        
        const name = document.createElement('div');
        name.className = 'rank-name';
        name.textContent = user.username;
        
        const stepsContainer = document.createElement('div');
        stepsContainer.style.display = 'flex';
        stepsContainer.style.alignItems = 'center';
        
        const steps = document.createElement('div');
        steps.className = 'rank-steps';
        steps.textContent = entry.steps.toLocaleString() + ' 步';
        
        // Add activity level indicator
        const activityInfo = getActivityLevel(entry.steps);
        const activityIndicator = document.createElement('div');
        activityIndicator.className = 'activity-level';
        activityIndicator.textContent = activityInfo.level;
        activityIndicator.style.color = activityInfo.color;
        
        stepsContainer.appendChild(steps);
        stepsContainer.appendChild(activityIndicator);
        
        rankItem.appendChild(position);
        rankItem.appendChild(name);
        rankItem.appendChild(stepsContainer);
        
        rankingContainer.appendChild(rankItem);
    });
    
    // If no data for today, show a message
    if (groupSteps.length === 0) {
        const noDataMsg = document.createElement('div');
        noDataMsg.textContent = '今日暂无步数数据';
        noDataMsg.style.textAlign = 'center';
        noDataMsg.style.padding = '20px';
        noDataMsg.style.color = '#666';
        rankingContainer.appendChild(noDataMsg);
    }
}

// Render weekly chart
function renderWeeklyChart() {
    const weeklyChartCanvas = document.getElementById('weekly-chart');
    if (!weeklyChartCanvas || !currentUser || !currentGroup) return;
    
    // Get dates for the past 7 days
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    // Get step data for each group member for the past 7 days
    const datasets = [];
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722'];
    
    currentGroup.members.forEach((memberId, index) => {
        const user = users.find(u => u.id === memberId);
        if (!user) return;
        
        const memberData = dates.map(date => {
            const entry = stepData.find(e => e.userId === memberId && e.date === date);
            return entry ? entry.steps : 0;
        });
        
        datasets.push({
            label: user.username,
            data: memberData,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        });
    });
    
    // Destroy previous chart if it exists
    if (window.weeklyChart) {
        window.weeklyChart.destroy();
    }
    
    // Create new chart
    window.weeklyChart = new Chart(weeklyChartCanvas, {
        type: 'line',
        data: {
            labels: dates.map(date => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            }),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 10000,
                            yMax: 10000,
                            borderColor: '#FF5252',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '10,000步 目标',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                },
                datalabels: {
                    align: 'end',
                    anchor: 'end',
                    formatter: function(value) {
                        return value > 0 ? value.toLocaleString() : '';
                    },
                    font: {
                        weight: 'bold',
                        size: 10
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '步数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                }
            }
        }
    });
}

// Render monthly chart
function renderMonthlyChart() {
    const monthlyChartCanvas = document.getElementById('monthly-chart');
    if (!monthlyChartCanvas || !currentUser || !currentGroup) return;
    
    // Get dates for the past 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    
    // Calculate average steps for each user in the past 30 days
    const userAverages = [];
    
    currentGroup.members.forEach(memberId => {
        const user = users.find(u => u.id === memberId);
        if (!user) return;
        
        // Get all step entries for this user in the past 30 days
        const userEntries = stepData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.userId === memberId && 
                   entryDate >= thirtyDaysAgo && 
                   entryDate <= today;
        });
        
        // Calculate average
        const totalSteps = userEntries.reduce((sum, entry) => sum + entry.steps, 0);
        const avgSteps = userEntries.length > 0 ? Math.round(totalSteps / userEntries.length) : 0;
        
        userAverages.push({
            username: user.username,
            avgSteps: avgSteps
        });
    });
    
    // Sort by average steps (descending)
    userAverages.sort((a, b) => b.avgSteps - a.avgSteps);
    
    // Destroy previous chart if it exists
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }
    
    // Create new chart
    window.monthlyChart = new Chart(monthlyChartCanvas, {
        type: 'bar',
        data: {
            labels: userAverages.map(u => u.username),
            datasets: [{
                label: '月平均步数',
                data: userAverages.map(u => u.avgSteps),
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#FF5722'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `平均步数: ${context.raw.toLocaleString()}`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 10000,
                            yMax: 10000,
                            borderColor: '#FF5252',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '10,000步 目标',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: function(value) {
                        return value.toLocaleString();
                    },
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '平均步数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '用户'
                    }
                }
            }
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
});
