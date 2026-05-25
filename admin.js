const requestStorageKey = "cleanconnectRequests";
const cleanersStorageKey = "cleanconnectCleaners";
const cleanerSessionKey = "cleanconnectCleanerSession";
const updatesStorageKey = "cleanconnectUpdates";
const exampleResetStorageKey = "cleanconnectExamplesClearedV2";
const defaultCleaners = [];
const tabs = document.querySelectorAll(".ops-tab");
const panels = document.querySelectorAll("[data-view-panel]");
const totalCharges = document.querySelector("#total-charges");
const totalRequests = document.querySelector("#total-requests");
const cleaningCount = document.querySelector("#cleaning-count");
const scheduledCharges = document.querySelector("#scheduled-charges");
const scheduledRequests = document.querySelector("#scheduled-requests");
const scheduledCleaningCount = document.querySelector("#scheduled-cleaning-count");
const logCount = document.querySelector("#log-count");
const requestLog = document.querySelector("#request-log");
const cleaningCalendar = document.querySelector("#cleaning-calendar");
const calendarMonthLabel = document.querySelector("#calendar-month-label");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");
const calendarDetail = document.querySelector("#calendar-detail");
const cleanerForm = document.querySelector("#cleaner-form");
const cleanerName = document.querySelector("#cleaner-name");
const cleanerPhoto = document.querySelector("#cleaner-photo");
const cleanerList = document.querySelector("#cleaner-list");
const cleanerCount = document.querySelector("#cleaner-count");
const updatesList = document.querySelector("#updates-list");
const updateCount = document.querySelector("#update-count");
let calendarAnchor = null;

const clearExampleDataOnce = () => {
  if (window.CleanConnectSync?.enabled) return;
  if (localStorage.getItem(exampleResetStorageKey)) return;

  localStorage.setItem(requestStorageKey, "[]");
  localStorage.setItem(cleanersStorageKey, "[]");
  localStorage.setItem(updatesStorageKey, "[]");
  localStorage.removeItem(cleanerSessionKey);
  localStorage.setItem(exampleResetStorageKey, "true");
};

clearExampleDataOnce();

const readRequests = () =>
  JSON.parse(localStorage.getItem(requestStorageKey) || "[]");

const readUpdates = () =>
  JSON.parse(localStorage.getItem(updatesStorageKey) || "[]");

const normalizeCleaner = (cleaner) => {
  if (typeof cleaner === "string") {
    return { name: cleaner, title: "Cleaner", photo: "", availability: [] };
  }

  return {
    name: cleaner.name || "Unnamed cleaner",
    title: cleaner.title || "Cleaner",
    photo: cleaner.photo || "",
    availability: Array.isArray(cleaner.availability) ? cleaner.availability : [],
  };
};

const readCleaners = () =>
  JSON.parse(localStorage.getItem(cleanersStorageKey) || JSON.stringify(defaultCleaners)).map(
    normalizeCleaner,
  );

const writeCleaners = (cleaners) => {
  localStorage.setItem(cleanersStorageKey, JSON.stringify(cleaners.map(normalizeCleaner)));
};

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.readAsDataURL(file);
  });

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatTimeOptions = (request) => {
  const times = request.timeOptions || [request.scheduledAt];
  return times.length > 1
    ? `Options: ${times.map(formatDateTime).join(" or ")}`
    : formatDateTime(times[0]);
};

const requestTimeLabel = (request) =>
  request.cleaner?.name ? formatDateTime(request.scheduledAt) : formatTimeOptions(request);

const formatCalendarMonth = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatCalendarTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatScope = (scope = {}) => {
  const labels = {
    bedrooms: "bed",
    bathrooms: "bath",
    kitchen: "kitchen",
    dining: "dining",
    livingRoom: "living room",
    commonSpace: "living room",
  };

  return Object.entries(labels)
    .filter(([key]) => Number(scope[key]) > 0)
    .map(([key, label]) => `${scope[key]} ${label}`)
    .join(" / ");
};

const formatCleaner = (cleaner) =>
  cleaner?.name ? `${cleaner.name}${cleaner.title ? ` / ${cleaner.title}` : ""}` : "";

const formatCleanerName = (cleaner) => (cleaner?.name ? cleaner.name : "");

const cleanerStatusLabel = (cleaner) =>
  formatCleanerName(cleaner) ? `Assigned: ${formatCleanerName(cleaner)}` : "Outstanding cleaner";

const updateTypeLabel = {
  logged: "Request logged",
  accepted: "Accepted by cleaner",
  completed: "Job completed",
  canceled: "Cleaner canceled",
};

const renderMetrics = (requests) => {
  const charges = requests.reduce((sum, request) => sum + request.charge, 0);
  const cleaningRequests = requests.filter((request) => request.service === "cleaning");

  totalCharges.textContent = money(charges);
  totalRequests.textContent = requests.length;
  cleaningCount.textContent = cleaningRequests.length;
  scheduledCharges.textContent = money(charges);
  scheduledRequests.textContent = requests.length;
  scheduledCleaningCount.textContent = cleaningRequests.length;
  logCount.textContent = `${requests.length} filed`;
};

const renderLog = (requests) => {
  if (!requests.length) {
    requestLog.innerHTML = '<div class="empty-state">Paid requests will appear here after students check out.</div>';
    return;
  }

  requestLog.innerHTML = requests
    .map(
      (request) => `
        <article class="request-row">
          <div>
            <h3>${request.serviceLabel} - ${request.id}</h3>
            <p class="request-meta">${request.location} / ${requestTimeLabel(request)} / ${request.intensity}</p>
            <p class="request-notes cleaner-request-status ${request.cleaner?.name ? "assigned" : "outstanding"}">${cleanerStatusLabel(request.cleaner)}</p>
            ${formatScope(request.scope) ? `<p class="request-notes">${formatScope(request.scope)}</p>` : ""}
            ${request.other ? `<p class="request-notes">Other: ${request.other}</p>` : ""}
            ${request.notes ? `<p class="request-notes">${request.notes}</p>` : ""}
          </div>
          <div>
            <span class="charge-pill">${money(request.charge)}</span>
          </div>
        </article>
      `,
    )
    .join("");
};

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const groupByDateKey = (requests) =>
  requests.reduce((days, request) => {
    const date = new Date(request.scheduledAt);
    const key = Number.isNaN(date.getTime()) ? "unscheduled" : dateKey(date);
    days[key] = days[key] || [];
    days[key].push(request);
    return days;
  }, {});

const renderCalendarDetail = (request) => {
  calendarDetail.classList.remove("hidden");
  calendarDetail.innerHTML = `
    <div>
      <p>Cleaning details</p>
      <h3>${request.location || "Address not set"}</h3>
      <span>${requestTimeLabel(request)} / ${request.intensity}</span>
    </div>
    <div class="calendar-detail-grid">
      <span>${formatCleanerName(request.cleaner) ? `Cleaner: ${formatCleanerName(request.cleaner)}` : "Outstanding cleaner"}</span>
      ${formatScope(request.scope) ? `<span>${formatScope(request.scope)}</span>` : ""}
      ${request.other ? `<span>Other: ${request.other}</span>` : ""}
      ${request.notes ? `<span>${request.notes}</span>` : ""}
      <span>${money(request.charge)}</span>
    </div>
  `;
};

const renderCalendar = (target, requests) => {
  const datedRequests = requests.filter((request) => {
    const date = new Date(request.scheduledAt);
    return !Number.isNaN(date.getTime());
  });
  if (!calendarAnchor) calendarAnchor = datedRequests.length ? new Date(datedRequests[0].scheduledAt) : new Date();
  const anchor = calendarAnchor;
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;
  const requestsByDay = groupByDateKey(datedRequests);

  calendarMonthLabel.textContent = formatCalendarMonth(anchor);
  target.innerHTML = Array.from({ length: totalCells }, (_, cellIndex) => {
    const dayNumber = cellIndex - leadingDays + 1;
    const isInMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
    const cellDate = new Date(year, month, dayNumber);
    const jobs = isInMonth ? requestsByDay[dateKey(cellDate)] || [] : [];

    return `
      <article class="calendar-cell ${isInMonth ? "" : "muted"}">
        ${isInMonth ? `<span class="calendar-number">${dayNumber}</span>` : ""}
        <div class="calendar-jobs">
          ${jobs
            .map(
              (request) => `
                <button class="calendar-job ${request.cleaner?.name ? "assigned" : "open"}" type="button" data-calendar-request="${request.id}">
                  <strong>${formatCalendarTime(request.scheduledAt)}${!request.cleaner?.name && (request.timeOptions || []).length > 1 ? " +" : ""}</strong>
                  <span>${request.location}</span>
                  ${formatCleanerName(request.cleaner) ? `<em>Cleaner: ${formatCleanerName(request.cleaner)}</em>` : ""}
                  ${formatScope(request.scope) ? `<em>${formatScope(request.scope)}</em>` : ""}
                  ${request.notes ? `<em>${request.notes}</em>` : ""}
                </button>
              `,
            )
            .join("")}
        </div>
      </article>
    `;
  }).join("");

  target.querySelectorAll("[data-calendar-request]").forEach((button) => {
    button.addEventListener("click", () => {
      const request = requests.find((item) => item.id === button.dataset.calendarRequest);
      if (request) renderCalendarDetail(request);
    });
  });
};

const renderDashboard = () => {
  const requests = readRequests().filter((request) => request.service === "cleaning");
  renderMetrics(requests);
  renderLog(requests);
  renderCalendar(cleaningCalendar, requests);
};

const renderUpdates = () => {
  const updates = readUpdates();
  updateCount.textContent = `${updates.length} ${updates.length === 1 ? "update" : "updates"}`;

  if (!updates.length) {
    updatesList.innerHTML = '<div class="empty-state">Request updates will appear here.</div>';
    return;
  }

  updatesList.innerHTML = updates
    .map(
      (update) => `
        <article class="update-row ${update.type}">
          <div>
            <span>${updateTypeLabel[update.type] || "Update"}</span>
            <h3>${update.requestId || "Request"}</h3>
            <p>${update.message}</p>
          </div>
          <time>${formatDateTime(update.createdAt)}</time>
        </article>
      `,
    )
    .join("");
};

const renderCleaners = () => {
  const cleaners = readCleaners();
  if (cleanerCount) cleanerCount.textContent = `${cleaners.length} active`;

  if (!cleaners.length) {
    cleanerList.innerHTML = '<div class="empty-state">No cleaners connected yet.</div>';
    return;
  }

  cleanerList.innerHTML = cleaners
    .map(
      (cleaner, index) => `
        <article class="cleaner-row">
          <div class="cleaner-profile">
            ${
              cleaner.photo
                ? `<img src="${cleaner.photo}" alt="${cleaner.name}" />`
                : `<div class="cleaner-initial">${cleaner.name.charAt(0)}</div>`
            }
            <div>
              <strong>${cleaner.name}</strong>
            </div>
          </div>
          <div class="cleaner-editor">
            <label>
              <span>Name</span>
              <input class="edit-cleaner-name" type="text" value="${cleaner.name}" data-cleaner-index="${index}" />
            </label>
            <label>
              <span>Replace photo</span>
              <input class="edit-cleaner-photo" type="file" accept="image/*" data-cleaner-index="${index}" />
            </label>
            <button class="save-cleaner" type="button" data-cleaner-index="${index}">Save</button>
            <button class="remove-cleaner" type="button" data-cleaner-index="${index}">Remove</button>
          </div>
        </article>
      `,
    )
    .join("");

  cleanerList.querySelectorAll(".remove-cleaner").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCleaners = readCleaners().filter(
        (_, index) => index !== Number(button.dataset.cleanerIndex),
      );
      writeCleaners(nextCleaners);
      renderCleaners();
    });
  });

  cleanerList.querySelectorAll(".save-cleaner").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.cleanerIndex);
      const row = button.closest(".cleaner-row");
      const cleaners = readCleaners();
      const photoFile = row.querySelector(".edit-cleaner-photo").files[0];
      const nextPhoto = await fileToDataUrl(photoFile);

      cleaners[index] = {
        name: row.querySelector(".edit-cleaner-name").value.trim() || cleaners[index].name,
        title: cleaners[index].title || "Cleaner",
        photo: nextPhoto || cleaners[index].photo,
        availability: cleaners[index].availability || [],
      };

      writeCleaners(cleaners);
      renderCleaners();
    });
  });
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    document.querySelector(`[data-view-panel="${tab.dataset.view}"]`).classList.add("active");
  });
});

calendarPrev.addEventListener("click", () => {
  calendarAnchor = calendarAnchor || new Date();
  calendarAnchor = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth() - 1, 1);
  calendarDetail.classList.add("hidden");
  renderDashboard();
});

calendarNext.addEventListener("click", () => {
  calendarAnchor = calendarAnchor || new Date();
  calendarAnchor = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth() + 1, 1);
  calendarDetail.classList.add("hidden");
  renderDashboard();
});

cleanerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanerName.value.trim();
  if (!name) return;

  const photo = await fileToDataUrl(cleanerPhoto.files[0]);
  writeCleaners([
    ...readCleaners(),
    {
      name,
      title: "Cleaner",
      photo,
      availability: [],
    },
  ]);
  cleanerName.value = "";
  cleanerPhoto.value = "";
  renderCleaners();
});

const initializeAdmin = () => {
  renderDashboard();
  renderCleaners();
  renderUpdates();
};

window.addEventListener("storage", initializeAdmin);
(window.CleanConnectSync?.ready || Promise.resolve()).finally(initializeAdmin);
