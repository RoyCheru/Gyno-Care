const doctorsPath = "http://localhost:3000/doctors";
const container = document.getElementById("doctors-grid");
const navContainer = document.getElementById("booking-nav");

let doctors = []; // will be filled by loadDoctors()
let bookingStage = {
  step: "select",
  doctor: null,
  concern: "",
  file: null, // uploaded doc
  date: "",
  time: "",
}; // step: select -> consult -> datetime -> review

// fallback sample if fetch fails (keeps example working)
const fallbackDoctors = [
  {
    id: 1,
    name: "Dr. Jane Doe",
    title: "Gynecologist",
    experienceYears: 10,
    fee: 50,
    currency: "USD",
    image: "assets/img/doctor1.jpg",
  },
  {
    id: 2,
    name: "Dr. Sarah Johnson",
    title: "Obstetrician",
    experienceYears: 8,
    fee: 40,
    currency: "USD",
    image: "assets/img/doctor2.jpg",
  },
  {
    id: 3,
    name: "Dr. Emily Clark",
    title: "Fertility Specialist",
    experienceYears: 12,
    fee: 60,
    currency: "USD",
    image: "assets/img/doctor3.jpg",
  },
];

async function loadDoctors() {
  try {
    const res = await fetch(doctorsPath);
    if (!res.ok) throw new Error("fetch failed");
    doctors = await res.json();
  } catch (e) {
    console.warn("Could not fetch doctors.json — using fallback sample.", e);
    doctors = fallbackDoctors;
  }
  bookingStage.step = "select";
  renderBooking(); // entry point render (we start with step select)
}

function renderBooking(){
    if(bookingStage.step === "select"){
        renderDoctorsGrid();
    }
    else if (bookingStage.step === "consult"){
        renderConsultationDetails();
    }
    else if(bookingStage.step === "datetime"){
        renderDateTimePicker();
    }
    else if(bookingStage.step === "review"){
        renderReview();
    }
}

function renderDoctorsGrid(){
  let html = '<div class="row g-4">';
  doctors.forEach((doc) => {
    const selectedClass =
      bookingStage.doctor && bookingStage.doctor.id === doc.id
        ? "doctor-selected"
        : "";
    html += `
      <div class="col-md-4">
        <div class="card doctor-card ${selectedClass}" data-id="${doc.id}" style="cursor:pointer;">
          <img src="${doc.image}" class="card-img-top" alt="${doc.name}" onerror="this.src='assets/img/doctor-placeholder.jpg'">
          <div class="card-body ">
            <h5 class="card-title mb-1">${doc.name}</h5>
            <p class="text-muted mb-1">${doc.title}</p>
             <p class="mb-1">${doc.experienceYears}+ years</p>
             <p class="price" style="color:#ff4081;font-weight:700">${doc.currency} ${doc.fee}</p>
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";
  // push markup
  container.innerHTML = html;

  // render nav buttons for this step (Back disabled on first step)
  renderNavButtons({
    backDisabled: true,
    continueDisabled: !bookingStage.doctor,
    continueText: "Continue",
  });

  // attach event listeners AFTER DOM injection
  container.querySelectorAll(".doctor-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      console.log("Clicked card id:", id, "Doctors:", doctors);
      // toggle selection: if same -> deselect, else select new
      bookingStage.doctor =
        bookingStage.doctor && bookingStage.doctor.id === id
          ? null
          : doctors.find((d) => d.id === id) || null;
      console.log("Selected doctor:", bookingStage.doctor); // 👀 see if state updates
      // re-render grid so that UI reflects updated state (and listeners re-attached)
      renderDoctorsGrid();
    });
  });
}

// 4) reusable nav buttons renderer (back/continue)
function renderNavButtons({ backDisabled = false, continueDisabled = true, continueText = "Continue" } = {}) {
  navContainer.innerHTML = `
    <div class="d-flex justify-content-between mt-4">
      <button id="back-btn" class="btn btn-outline-secondary" ${backDisabled ? "disabled" : ""}>Back</button>
      <button id="continue-btn" class="btn learn-more-btn" ${continueDisabled ? "disabled" : ""}>${continueText}</button>
    </div>
  `;

  // Back button behavior
  document.getElementById("back-btn").addEventListener("click", () => {
    if (backDisabled) return;
    // for select step there is no previous step - but kept generic
    if (bookingStage.step === "consult") {
      bookingStage.step = "select";
    } else if (bookingStage.step === "datetime") {
      bookingStage.step = "consult";
    } else if (bookingStage.step === "review") {
      bookingStage.step = "datetime";
    }
    renderBooking();
  });

  // Continue button behavior
  document.getElementById("continue-btn").addEventListener("click", () => {
    if (continueDisabled) return;
    // move forward to consult step (we'll implement consult next)
    if (bookingStage.step === "select") {
      bookingStage.step = "consult";
      renderBooking();
    } else if (bookingStage.step === "consult") {
      bookingStage.step = "datetime";
      renderBooking();
    } else if (bookingStage.step === "datetime") {
      // validate before moving to review
      const date = document.getElementById("dateInput").value;
      const time = document.getElementById("timeInput").value;

      if (!date || !time) {
        alert("Please select both date and time.");
        return;
      }

      bookingStage.date = date;
      bookingStage.time = time;
      bookingStage.step = "review";
      renderBooking();
    } else if (bookingStage.step === "review") {
      alert("✅ Booking confirmed!");
      // reset state
      bookingStage = {
        step: "select",
        doctor: null,
        concern: "",
        file: null,
        date: "",
        time: "",
      };

      renderBooking(); // go back to doctor grid
      // later: submit to backend
    }
  });
}

//consultation details
function renderConsultationDetails(){
  container.innerHTML = `
    <h3 class="mb-4 text-center">2. Consultation Details</h3>
    
    <div class="card p-4">
      <h5 class="mb-3">Doctor: ${bookingStage.doctor?.name}</h5>
      <div class="mb-3">
        <label for="concern" class="form-label">Describe your health concern</label>
        <textarea id="concern" class="form-control" rows="4">${
          bookingStage.concern || ""
        }</textarea>
      </div>
      <div class="mb-3">
        <label for="file" class="form-label">Upload medical documents (optional)</label>
        <input type="file" id="file" class="form-control">
      </div>
    </div>
  `;

  renderNavButtons({
    backDisabled: false,
    continueDisabled: false,
    continueText: "Continue",
  });

  // Save concern text as user types
  document.getElementById("concern").addEventListener("input", (e) => {
    bookingStage.concern = e.target.value;
  });

  // Save file input
  document.getElementById("file").addEventListener("change", (e) => {
    bookingStage.file = e.target.files[0] || null;
  });

//   // Hook into nav buttons
//   document.getElementById("back-btn").addEventListener("click", () => {
//     if (file) bookingStage.file = file; // keep old if no new one chosen
//     bookingStage.step = "select";
//     renderBooking();
//   });

//   document.getElementById("continue-btn").addEventListener("click", () => {
//     bookingStage.step = "datetime";
//     renderBooking();
//   });
}

function renderDateTimePicker(){
  container.innerHTML = container.innerHTML = `
    <h3 class="mb-4 text-center">Select Date & Time</h3>
    <form id="datetimeForm" class="p-3 border rounded bg-light">
      <div class="mb-3">
        <label for="dateInput" class="form-label">Preferred Date</label>
        <input type="date" id="dateInput" class="form-control" required value="${
          bookingStage.date || ""
        }">
      </div>
      <div class="mb-3">
        <label for="timeInput" class="form-label">Preferred Time</label>
        <input type="time" id="timeInput" class="form-control" required value="${
          bookingStage.time || ""
        }">
      </div>
    </form>
  `;

  // render nav buttons
  renderNavButtons({
    backDisabled: false,
    continueDisabled: false,
    continueText: "Review Booking",
  });

  
  // Back button
//   document.getElementById("back-btn").addEventListener("click", () => {
//     bookingStage.step = "consult";
//     renderBooking();
//   });

  // Continue button
//   document.getElementById("continue-btn").addEventListener("click", () => {
//     const date = document.getElementById("dateInput").value;
//     const time = document.getElementById("timeInput").value;

//     if (!date || !time) {
//       alert("Please select both date and time.");
//       return;
//     }
//     // save into state
//     bookingStage.date = date;
//     bookingStage.time = time;

//     // advance step
//     bookingStage.step = "review";
//     renderBooking();
//   });
}

function renderReview() {
  let html = `
    <div class="card p-4">
      <h4 class="mb-3">Review Your Booking</h4>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">
          <strong>Doctor:</strong> ${
            bookingStage.doctor ? bookingStage.doctor.name : "Not selected"
          }
          <br><small>${
            bookingStage.doctor ? bookingStage.doctor.title : ""
          }</small>
        </li>
        <li class="list-group-item">
          <strong>Concern:</strong> ${bookingStage.concern || "Not provided"}
        </li>
        <li class="list-group-item">
          <strong>File:</strong> ${
            bookingStage.file ? bookingStage.file.name : "No file uploaded"
          }
        </li>
        <li class="list-group-item">
          <strong>Charges:</strong> ${
            bookingStage.doctor.fee
          }
        </li>
        <li class="list-group-item">
          <strong>Date & Time:</strong> 
          ${bookingStage.date ? bookingStage.date : "Not set"} 
          ${bookingStage.time ? bookingStage.time : ""}
        </li>
      </ul>
    </div>
  `;

  container.innerHTML = html;

  // Render nav with Back and Confirm
  renderNavButtons({
    backDisabled: false,
    continueDisabled: false,
    continueText: "Confirm Booking",
  });

  // Hook up confirm action
//   document.getElementById("continue-btn").addEventListener("click", () => {
//     alert("✅ Booking confirmed!\n\n" + JSON.stringify(bookingStage, null, 2));
//     // later: send bookingStage to backend
//   });
}


// small helper to avoid XSS in inserted names/titles
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#039;");
}
//init
loadDoctors()