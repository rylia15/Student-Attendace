const KEY = "attendify_data_v1";

const defaultData = {
  teacher: "Admin",
  sections: [
    {id:1,name:"BSCS-2A",room:"Room 101"},
    {id:2,name:"BSCS-2B",room:"Room 102"},
    {id:3,name:"BSCS-2C",room:"Room 103"},
    {id:4,name:"BSCS-2D",room:"Room 104"}
  ],
  students: [
    {id:1,name:"Juan Dela Cruz",studentNo:"2026-0001",section:1},
    {id:2,name:"Maria Santos",studentNo:"2026-0002",section:1},
    {id:3,name:"John Reyes",studentNo:"2026-0003",section:2},
    {id:4,name:"Angela Garcia",studentNo:"2026-0004",section:2},
    {id:5,name:"Mark Villanueva",studentNo:"2026-0005",section:3},
    {id:6,name:"Sofia Mendoza",studentNo:"2026-0006",section:3},
    {id:7,name:"Daniel Torres",studentNo:"2026-0007",section:4},
    {id:8,name:"Ella Ramos",studentNo:"2026-0008",section:4}
  ],
  attendance: [],
  history: []
};

let data = JSON.parse(localStorage.getItem(KEY)) || defaultData;
let currentPage = "dashboard";
let attendanceDate = todayISO();

const content = document.getElementById("content");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

document.getElementById("today").innerText = formatDate(new Date());
document.getElementById("teacherName").innerText = data.teacher;

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    currentPage = btn.dataset.page;
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

document.getElementById("closeModal").onclick = closeModal;
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });

function save(){ localStorage.setItem(KEY, JSON.stringify(data)); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function formatDate(date){ return date.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}); }
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function sectionName(id){return data.sections.find(s=>s.id==id)?.name || "No Section"}
function openModal(html){modalContent.innerHTML=html;modal.classList.remove("hidden")}
function closeModal(){modal.classList.add("hidden")}
function toast(msg){const t=document.createElement("div");t.className="toast";t.innerText=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
function nextId(arr){return arr.length ? Math.max(...arr.map(x=>Number(x.id)))+1 : 1}

function getRecords(date=attendanceDate){
  return data.students.map(s=>{
    const r=data.attendance.find(a=>a.studentId===s.id && a.date===date);
    return {...s,status:r?.status||"Not Marked"};
  });
}
function countStatus(date=attendanceDate,status){return getRecords(date).filter(x=>x.status.toLowerCase()===status.toLowerCase()).length}

function render(){
  const titles={dashboard:"Dashboard",students:"Students",sections:"Sections",attendance:"Attendance",history:"History",reports:"Reports",settings:"Settings"};
  document.getElementById("pageTitle").innerText=titles[currentPage];
  if(currentPage==="dashboard") dashboardPage();
  if(currentPage==="students") studentsPage();
  if(currentPage==="sections") sectionsPage();
  if(currentPage==="attendance") attendancePage();
  if(currentPage==="history") historyPage();
  if(currentPage==="reports") reportsPage();
  if(currentPage==="settings") settingsPage();
}

function dashboardPage(){
  const p=countStatus(),a=countStatus(undefined,"Absent"),l=countStatus(undefined,"Late");
  content.innerHTML=`
  <div class="grid">
    <div class="card"><div class="stat-label">Total Students</div><div class="stat-value">${data.students.length}</div></div>
    <div class="card"><div class="stat-label">Total Sections</div><div class="stat-value">${data.sections.length}</div></div>
    <div class="card"><div class="stat-label">Present</div><div class="stat-value green">${p}</div></div>
    <div class="card"><div class="stat-label">Absent</div><div class="stat-value red">${a}</div></div>
    <div class="card"><div class="stat-label">Late</div><div class="stat-value orange">${l}</div></div>
  </div>
  <div class="dashboard-lower">
    <div class="table-wrap">
      <h2 class="section-title">Today's Attendance</h2>
      ${attendanceMiniTable()}
    </div>
    <div class="table-wrap">
      <h2 class="section-title">Sections</h2>
      ${data.sections.length ? `<table><thead><tr><th>Section</th><th>Room</th><th>Students</th></tr></thead><tbody>
      ${data.sections.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.room)}</td><td>${data.students.filter(x=>x.section==s.id).length}</td></tr>`).join("")}
      </tbody></table>` : '<div class="empty">No sections.</div>'}
    </div>
  </div>`;
}
function attendanceMiniTable(){
  if(!data.students.length)return '<div class="empty">No students yet.</div>';
  return `<table><thead><tr><th>Student</th><th>Section</th><th>Status</th></tr></thead><tbody>
  ${getRecords().slice(0,8).map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(sectionName(s.section))}</td><td><span class="status ${s.status.toLowerCase().replace(" ","")}">${s.status}</span></td></tr>`).join("")}
  </tbody></table>`;
}

function studentsPage(){
  content.innerHTML=`
  <div class="page-head"><div><h2 class="section-title">Student Management</h2><p>Manage students and their sections.</p></div>
  <button class="btn btn-primary" onclick="studentForm()">+ Add Student</button></div>
  <div class="table-wrap"><div style="margin-bottom:15px"><input id="studentSearch" class="search" placeholder="Search student..." oninput="filterStudents()"></div>
  <div id="studentTable">${studentTable()}</div></div>`;
}
function studentTable(filter=""){
  let arr=data.students.filter(s=>(s.name+" "+s.studentNo+" "+sectionName(s.section)).toLowerCase().includes(filter.toLowerCase()));
  if(!arr.length)return '<div class="empty">No students found.</div>';
  return `<table><thead><tr><th>#</th><th>Student No.</th><th>Name</th><th>Section</th><th>Actions</th></tr></thead><tbody>
  ${arr.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.studentNo)}</td><td>${esc(s.name)}</td><td>${esc(sectionName(s.section))}</td>
  <td class="actions"><button class="btn btn-secondary" onclick="studentForm(${s.id})">Edit</button><button class="btn btn-danger" onclick="deleteStudent(${s.id})">Delete</button></td></tr>`).join("")}
  </tbody></table>`;
}
function filterStudents(){document.getElementById("studentTable").innerHTML=studentTable(document.getElementById("studentSearch").value)}
function studentForm(id){
  const s=data.students.find(x=>x.id==id);
  openModal(`<h2>${s?"Edit":"Add"} Student</h2><br>
  <div class="form-grid">
  <div class="field"><label>Student Number</label><input id="fNo" value="${s?esc(s.studentNo):""}"></div>
  <div class="field"><label>Full Name</label><input id="fName" value="${s?esc(s.name):""}"></div>
  <div class="field full"><label>Section</label><select id="fSection">${data.sections.map(x=>`<option value="${x.id}" ${s&&s.section==x.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
  </div><br><button class="btn btn-primary" onclick="saveStudent(${id||0})">Save Student</button>`);
}
function saveStudent(id){
  const studentNo=document.getElementById("fNo").value.trim(),name=document.getElementById("fName").value.trim(),section=Number(document.getElementById("fSection").value);
  if(!studentNo||!name||!section)return toast("Please complete all fields.");
  if(id){Object.assign(data.students.find(x=>x.id==id),{studentNo,name,section})}else data.students.push({id:nextId(data.students),studentNo,name,section});
  save();closeModal();render();toast("Student saved.");
}
function deleteStudent(id){
  if(!confirm("Delete this student?"))return;
  data.students=data.students.filter(s=>s.id!==id);
  data.attendance=data.attendance.filter(a=>a.studentId!==id);
  save();render();toast("Student deleted.");
}

function sectionsPage(){
  content.innerHTML=`<div class="page-head"><div><h2 class="section-title">Section Management</h2><p>Create and manage class sections.</p></div>
  <button class="btn btn-primary" onclick="sectionForm()">+ Add Section</button></div>
  <div class="table-wrap"><table><thead><tr><th>Section</th><th>Room</th><th>Students</th><th>Actions</th></tr></thead><tbody>
  ${data.sections.length?data.sections.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.room)}</td><td>${data.students.filter(x=>x.section==s.id).length}</td><td class="actions"><button class="btn btn-secondary" onclick="sectionForm(${s.id})">Edit</button><button class="btn btn-danger" onclick="deleteSection(${s.id})">Delete</button></td></tr>`).join(""):'<tr><td colspan="4" class="empty">No sections.</td></tr>'}
  </tbody></table></div>`;
}
function sectionForm(id){
  const s=data.sections.find(x=>x.id==id);
  openModal(`<h2>${s?"Edit":"Add"} Section</h2><br><div class="form-grid">
  <div class="field"><label>Section Name</label><input id="sName" value="${s?esc(s.name):""}"></div>
  <div class="field"><label>Room</label><input id="sRoom" value="${s?esc(s.room):""}"></div></div><br>
  <button class="btn btn-primary" onclick="saveSection(${id||0})">Save Section</button>`);
}
function saveSection(id){
  const name=document.getElementById("sName").value.trim(),room=document.getElementById("sRoom").value.trim();
  if(!name||!room)return toast("Please complete all fields.");
  if(id)Object.assign(data.sections.find(x=>x.id==id),{name,room});
  else data.sections.push({id:nextId(data.sections),name,room});
  save();closeModal();render();toast("Section saved.");
}
function deleteSection(id){
  if(data.students.some(s=>s.section==id))return toast("Move students before deleting this section.");
  if(!confirm("Delete this section?"))return;
  data.sections=data.sections.filter(s=>s.id!==id);save();render();toast("Section deleted.");
}

function attendancePage(){
  content.innerHTML=`<div class="page-head"><div><h2 class="section-title">Take Attendance</h2><p>Mark each student as Present, Absent, or Late.</p></div>
  <div><input type="date" id="attendanceDate" value="${attendanceDate}" onchange="changeAttendanceDate(this.value)"></div></div>
  <div class="notice">Date: <strong>${formatDate(new Date(attendanceDate+"T00:00:00"))}</strong>. Changes are saved automatically.</div>
  <div class="table-wrap"><table><thead><tr><th>Student No.</th><th>Name</th><th>Section</th><th>Status</th><th>Action</th></tr></thead><tbody>
  ${data.students.length?getRecords().map(s=>`<tr><td>${esc(s.studentNo)}</td><td>${esc(s.name)}</td><td>${esc(sectionName(s.section))}</td><td><span class="status ${s.status.toLowerCase().replace(" ","")}">${s.status}</span></td>
  <td class="actions"><button class="btn btn-success" onclick="mark(${s.id},'Present')">Present</button><button class="btn btn-danger" onclick="mark(${s.id},'Absent')">Absent</button><button class="btn" style="background:#ffedd5;color:#c2410c" onclick="mark(${s.id},'Late')">Late</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty">No students.</td></tr>'}
  </tbody></table></div>
  <br><button class="btn btn-primary" onclick="markAll('Present')">Mark All Present</button>
  <button class="btn btn-secondary" onclick="clearToday()">Clear Date</button>`;
}
function changeAttendanceDate(v){attendanceDate=v||todayISO();render()}
function mark(studentId,status){
  let r=data.attendance.find(a=>a.studentId===studentId&&a.date===attendanceDate);
  if(r)r.status=status;else data.attendance.push({studentId,date:attendanceDate,status});
  save();render();
}
function markAll(status){
  data.students.forEach(s=>{let r=data.attendance.find(a=>a.studentId===s.id&&a.date===attendanceDate);if(r)r.status=status;else data.attendance.push({studentId:s.id,date:attendanceDate,status})});
  save();render();toast("All students marked "+status+".");
}
function clearToday(){
  data.attendance=data.attendance.filter(a=>a.date!==attendanceDate);save();render();toast("Attendance cleared.");
}

function historyPage(){
  const dates=[...new Set(data.attendance.map(a=>a.date))].sort().reverse();
  content.innerHTML=`<div class="page-head"><div><h2 class="section-title">Attendance History</h2><p>View recorded attendance by date.</p></div></div>
  <div class="table-wrap">${dates.length?`<table><thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Recorded</th><th>Action</th></tr></thead><tbody>
  ${dates.map(d=>`<tr><td>${formatDate(new Date(d+"T00:00:00"))}</td><td class="green">${countStatus(d,"Present")}</td><td class="red">${countStatus(d,"Absent")}</td><td class="orange">${countStatus(d,"Late")}</td><td>${data.attendance.filter(a=>a.date===d).length}</td><td><button class="btn btn-secondary" onclick="viewDate('${d}')">View</button></td></tr>`).join("")}
  </tbody></table>`:'<div class="empty">No attendance history yet. Start marking attendance.</div>'}</div>`;
}
function viewDate(d){attendanceDate=d;currentPage="attendance";document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page==="attendance"));render()}

function reportsPage(){
  const total=data.students.length, p=countStatus(),a=countStatus(undefined,"Absent"),l=countStatus(undefined,"Late"),marked=p+a+l;
  const percent=marked?Math.round(p/marked*100):0;
  content.innerHTML=`<div class="page-head"><div><h2 class="section-title">Reports</h2><p>Attendance summary for ${formatDate(new Date(attendanceDate+"T00:00:00"))}.</p></div>
  <button class="btn btn-primary" onclick="window.print()">Print Report</button></div>
  <div class="report-cards">
    <div class="card"><div class="stat-label">Present</div><div class="stat-value green">${p}</div></div>
    <div class="card"><div class="stat-label">Absent</div><div class="stat-value red">${a}</div></div>
    <div class="card"><div class="stat-label">Late</div><div class="stat-value orange">${l}</div></div>
  </div>
  <div class="table-wrap"><h2 class="section-title">Attendance Rate</h2><div style="font-size:28px;font-weight:bold">${percent}%</div><div class="progress"><span style="width:${percent}%"></span></div><br>
  <table><thead><tr><th>Student</th><th>Section</th><th>Status</th></tr></thead><tbody>
  ${getRecords().map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(sectionName(s.section))}</td><td>${esc(s.status)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function settingsPage(){
  content.innerHTML=`<div class="table-wrap"><h2 class="section-title">Settings</h2><div class="form-grid">
  <div class="field"><label>Teacher Name</label><input id="teacherInput" value="${esc(data.teacher)}"></div>
  </div><br><button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
  <hr style="border:0;border-top:1px solid #e5e7eb;margin:25px 0">
  <h3>Data</h3><p>Attendance data is stored in your browser using localStorage.</p>
  <button class="btn btn-secondary" onclick="exportData()">Export Backup</button>
  <button class="btn btn-danger" onclick="resetData()">Reset All Data</button>
  </div>`;
}
function saveSettings(){
  data.teacher=document.getElementById("teacherInput").value.trim()||"Admin";save();
  document.getElementById("teacherName").innerText=data.teacher;toast("Settings saved.");
}
function exportData(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="attendify-backup.json";a.click();URL.revokeObjectURL(url);
}
function resetData(){
  if(!confirm("Reset all students, sections, and attendance?"))return;
  data=JSON.parse(JSON.stringify(defaultData));save();document.getElementById("teacherName").innerText=data.teacher;render();toast("Data reset.");
}

render();
