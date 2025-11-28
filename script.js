/* ===========================
   script.js - Smart Study UI (Updated)
   =========================== */

// Helper
function qs(id){ return document.getElementById(id); }
function nowStr(){ return new Date().toISOString(); }

// --------- INDEX: Save user input ----------
function saveUserInput() {
    const name = qs('name')?.value.trim() || '';
    const goal = qs('goal')?.value || 'DSA';
    const style = qs('style')?.value || 'Mixed Style';
    const hours = Number(qs('hours')?.value) || 10;
    if(!name){ alert('Enter your name'); return false; }

    localStorage.setItem('userInput', JSON.stringify({name, goal, style, hours, savedAt: nowStr()}));
    window.location.href = 'strategy.html';
    return false;
}

// --------- STRATEGY PAGE ----------
function initStrategyPage(){
    const raw = localStorage.getItem('userInput');
    if(!raw){ qs('tipsBox').innerText='No input. Fill form on Home.'; return; }
    const user = JSON.parse(raw);
    const tips = [
        `Hi ${user.name}, your goal: ${user.goal}, study style: ${user.style}.`,
        'Use Pomodoro: 25min study + 5min break.',
        'Follow Learn → Practice → Test.',
        `Weekly hours: ${user.hours}, keep 1 revision day/week.`,
        'Solve one problem daily.'
    ];
    qs('tipsBox').innerHTML = tips.map(t=>`• ${t}`).join('<br/>');
}

// --------- TOPICS (Updated per your requirement) ----------
const TOPICS = {
    dsa: ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'DP', 'Greedy', 'Sorting', 'Searching'],
    python: ['Basics', 'Functions', 'OOP', 'Modules', 'File Handling', 'NumPy', 'Pandas'],
    database: ['DBMS Basics', 'ER Models', 'Normalization', 'SQL Queries', 'Transactions', 'Indexing'],
    frontend: ['HTML', 'CSS', 'JavaScript', 'React Basics', 'Responsive Design', 'APIs'],
    backend: ['Node.js', 'Express', 'REST APIs', 'Authentication', 'MongoDB', 'Deployment'],
    sql: ['Joins', 'Constraints', 'Stored Procedures', 'Triggers', 'Aggregation', 'Query Optimization'],
    notes:'https://www.geeksforgeeks.org/explore',
    video:'https://www.youtube.com/results?search_query=',
    practice:'https://leetcode.com/problemset/all/'
};

// --------- PLAN GENERATOR ----------
function createPlan(){
    const raw = localStorage.getItem('userInput');
    if(!raw){ alert('Fill form first'); window.location.href='index.html'; return; }
    const user = JSON.parse(raw);

    const days = Number(qs('days')?.value) || 30;
    const perDayHours = Math.ceil(user.hours / 7);
    const pool = TOPICS[user.goal.toLowerCase()] || TOPICS.dsa;

    let plan = [], idx = 0;

    for(let d = 1; d <= days; d++){
        let tasks = [];

        if (d % 7 === 0) {
            tasks.push('Weekly Revision & Mock Test');
        } 
        else if (d % 6 === 0) {
            tasks.push('Revision of last 5 days');
        } 
        else {
            const topic = pool[idx % pool.length];
            idx++;

            if (user.style === 'Video Learning' || user.style === 'Mixed Style')
                tasks.push(` Watch Video: <a href="${TOPICS.video + topic}" target="_blank">${topic} Video</a>`);

            if (user.style === 'Notes Reading' || user.style === 'Mixed Style')
                tasks.push(`Read Notes: <a href="${TOPICS.notes}" target="_blank">GFG Notes</a>`);

            if (user.style === 'Coding Practice' || user.style === 'Mixed Style')
                tasks.push(` Practice: <a href="${TOPICS.practice}" target="_blank">Coding Practice</a>`);
        }

        plan.push({day: d, tasks, hours: perDayHours});
    }

    localStorage.setItem('currentPlan', JSON.stringify({user, days, plan, generatedAt: nowStr()}));
    window.location.href = 'plan.html';
}

// --------- PLAN PAGE ----------
function renderCurrentPlan(){
    const raw = localStorage.getItem('currentPlan');
    if(!raw){ qs('planBox').innerHTML='No plan generated'; return; }
    const gen = JSON.parse(raw);

    let html = `<h3>${gen.user.name}'s ${gen.user.goal} Study Plan</h3>`;
    gen.plan.forEach(p =>{
        html += `<div><strong>Day ${p.day} - ${p.hours} hrs</strong><br/>${p.tasks.join('<br/>')}</div><hr/>`;
    });

    qs('planBox').innerHTML = html;
}

function savePlan(){
    const raw = localStorage.getItem('currentPlan');
    if(!raw){ alert('No plan to save'); return; }
    const gen = JSON.parse(raw);
    const saved = {id:'plan_'+Date.now(), title:`${gen.user.goal} Plan`, createdAt: nowStr(), content: gen};
    let arr = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    arr.unshift(saved);
    localStorage.setItem('savedPlans', JSON.stringify(arr));
    alert('Plan saved!');
    window.location.href = 'dashboard.html';
}
// -------- PDF DOWNLOAD FUNCTION (Updated) ----------
async function downloadPlan(planId){
    let arr = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    const p = arr.find(x => x.id === planId);
    if(!p){ alert('Plan not found'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 15;
    doc.setFont("Helvetica","bold");
    doc.setFontSize(16);
    doc.text(`${p.content.user.name}'s Study Plan`, 14, y);
    y += 8;

    doc.setFont("Helvetica","normal");
    doc.setFontSize(12);
    doc.text(`Goal: ${p.content.user.goal}`, 14, y);
    y += 6;
    doc.text(`Study Style: ${p.content.user.style}`, 14, y);
    y += 6;
    doc.text(`Days: ${p.content.days}`, 14, y);
    y += 10;

    p.content.plan.forEach(dayObj => {
        // Title (Day — Hours)
        doc.setFont("Helvetica","bold");
        doc.text(`Day ${dayObj.day} (${dayObj.hours} hrs)`, 14, y);
        y += 6;

        // Clean tasks (remove HTML & emojis ↓)
        doc.setFont("Helvetica","normal");
        dayObj.tasks.forEach(task => {
            let cleanText = task
                .replace(/<[^>]*>/g, "") // remove HTML tags
                .replace(/🎥|📘|💻/g, ""); // remove emojis (optional)
            doc.text("- " + cleanText.trim(), 18, y);
            y += 6;
        });

        y += 4;
        if (y > 270) {
            doc.addPage();
            y = 15;
        }
    });

    doc.save(`${p.title}.pdf`);
}


// --------- DASHBOARD ----------
function renderDashboard(){
    const cont = qs('savedPlans'); 
    if(!cont) return;
    let arr = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    if(arr.length === 0){ cont.innerHTML='No saved plans'; return; }
    cont.innerHTML = '';
    arr.forEach(p =>{
        const card = document.createElement('div');
        card.innerHTML = `<strong>${p.title}</strong> • ${new Date(p.createdAt).toLocaleString()}<br/>
        <button onclick="downloadPlan('${p.id}')">Download</button>
        <button onclick="deletePlan('${p.id}')">Delete</button><hr/>`;
        cont.appendChild(card);
    });
}

function deletePlan(id){
    if(!confirm('Delete?')) return;
    let arr = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    arr = arr.filter(p => p.id !== id);
    localStorage.setItem('savedPlans', JSON.stringify(arr));
    renderDashboard();
}

// ---------- Attach to window ----------
window.saveUserInput = saveUserInput;
window.createPlan = createPlan;
window.renderCurrentPlan = renderCurrentPlan;
window.savePlan = savePlan;
window.renderDashboard = renderDashboard;
window.deletePlan = deletePlan;
window.downloadPlan = downloadPlan;

// Auto initialize
document.addEventListener('DOMContentLoaded', ()=>{
    if(location.pathname.endsWith('strategy.html')) initStrategyPage();
    if(location.pathname.endsWith('plan.html')) renderCurrentPlan();
    if(location.pathname.endsWith('dashboard.html')) renderDashboard();
});

window.downloadPlan = downloadPlan;

