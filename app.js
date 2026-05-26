const submitLabel = document.querySelector("#submit-label");
const screens = document.querySelectorAll("[data-screen]");
const confirmButton = document.querySelector("#confirm-button");
const orderSlides = document.querySelectorAll("[data-order-slide]");
const orderActions = document.querySelector(".order-actions");
const orderBackButton = document.querySelector("#order-back-button");
const orderTopBackButton = document.querySelector("#order-top-back-button");
const orderNextButton = document.querySelector("#order-next-button");
const backButton = document.querySelector("#back-button");
const doneButton = document.querySelector("#done-button");
const paymentBackButton = document.querySelector("#payment-back-button");
const payButton = document.querySelector("#pay-button");
const newBookingButton = document.querySelector("#new-booking-button");
const providersButton = document.querySelector("#providers-button");
const providersBackButton = document.querySelector("#providers-back-button");
const profileButton = document.querySelector("#profile-button");
const profileBackButton = document.querySelector("#profile-back-button");
const studentAuthStatus = document.querySelector("#student-auth-status");
const studentAuthForm = document.querySelector("#student-auth-form");
const studentAuthEmail = document.querySelector("#student-auth-email");
const studentAuthPassword = document.querySelector("#student-auth-password");
const studentAuthMessage = document.querySelector("#student-auth-message");
const studentSignOut = document.querySelector("#student-sign-out");
const instructionsKicker = document.querySelector("#instructions-kicker");
const instructionsTitle = document.querySelector("#instructions-title");
const instructionsCopy = document.querySelector("#instructions-copy");
const instructionList = document.querySelector("#instruction-list");
const providersTitle = document.querySelector("#providers-title");
const providerSearchWrap = document.querySelector("#provider-search-wrap");
const providerSearch = document.querySelector("#provider-search");
const providerList = document.querySelector("#provider-list");
const slotList = document.querySelector("#slot-list");
const upcomingList = document.querySelector("#upcoming-list");
const upcomingCount = document.querySelector("#upcoming-count");
const previousCleanersList = document.querySelector("#previous-cleaners-list");
const previousCleanerCount = document.querySelector("#previous-cleaner-count");
const selectedCleanerCard = document.querySelector("#selected-cleaner");
const selectedCleanerName = document.querySelector("#selected-cleaner-name");
const clearCleanerButton = document.querySelector("#clear-cleaner-button");
const cleaningDateInput = document.querySelector("#cleaning-date");
const cleaningTimeInput = document.querySelector("#cleaning-time");
const timeList = document.querySelector("#time-list");
const addTimeButton = document.querySelector("#add-time-button");
const paymentSummary = document.querySelector("#payment-summary");
const paymentOrderDetails = document.querySelector("#payment-order-details");
const paymentService = document.querySelector("#payment-service");
const paymentPrice = document.querySelector("#payment-price");
const confirmationPrice = document.querySelector("#confirmation-price");
const payLabel = document.querySelector("#pay-label");
const addressSearches = document.querySelectorAll("[data-address-search]");
const requestStorageKey = "cleanconnectRequests";
const cleanersStorageKey = "cleanconnectCleaners";
const cleanerSessionKey = "cleanconnectCleanerSession";
const updatesStorageKey = "cleanconnectUpdates";
const exampleResetStorageKey = "cleanconnectExamplesClearedV2";
const pendingCheckoutKey = "cleanconnectPendingCheckout";
let activeOrderSlide = "details";
let selectedCleaner = null;
let editingRequestId = "";

const readJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 180) };
  }
};

const suggestedAddresses = [
  {
    name: "The Radian",
    detail: "3925 Walnut St, Philadelphia, PA 19104",
    hint: "University City",
  },
  {
    name: "3737 Chestnut",
    detail: "3737 Chestnut St, Philadelphia, PA 19104",
    hint: "University City",
  },
  {
    name: "The Chestnut",
    detail: "3720 Chestnut St, Philadelphia, PA 19104",
    hint: "University City",
  },
  {
    name: "Powelton Village",
    detail: "3701 Baring St, Philadelphia, PA 19104",
    hint: "Powelton",
  },
  {
    name: "Spruce Hill",
    detail: "4500 Spruce St, Philadelphia, PA 19139",
    hint: "Spruce Hill",
  },
  {
    name: "Cedar Park",
    detail: "4919 Baltimore Ave, Philadelphia, PA 19143",
    hint: "Cedar Park",
  },
  {
    name: "Garden Court",
    detail: "4701 Pine St, Philadelphia, PA 19143",
    hint: "Garden Court",
  },
  {
    name: "Walnut Hill",
    detail: "4600 Walnut St, Philadelphia, PA 19139",
    hint: "Walnut Hill",
  },
  {
    name: "Mantua",
    detail: "3600 Spring Garden St, Philadelphia, PA 19104",
    hint: "Mantua",
  },
];

const serviceAreaRegions = [
  "pa 19104",
  "pa 19139",
  "pa 19143",
  "west philadelphia",
  "university city",
  "powelton",
  "spruce hill",
  "cedar park",
  "garden court",
  "walnut hill",
  "mantua",
  "squirrel hill",
];

const serviceAreaStreets = [
  "pine",
  "spruce",
  "walnut",
  "chestnut",
  "locust",
  "sansom",
  "baltimore",
  "baring",
  "spring garden",
  "market st",
];

const outsideAreaTerms = [
  "new york",
  "brooklyn",
  "queens",
  "boston",
  "dc",
  "washington, dc",
  "new jersey",
  "nj",
];

const instructions = {
  cleaning: {
    kicker: "Room clean confirmed",
    title: "You are booked",
    copy: "Your cleaner will arrive at your selected time.",
    items: [
      "Be present or leave clear access instructions.",
      "Put away valuables and private items.",
      "Clear surfaces you want cleaned.",
      "Mark or mention any no-touch areas.",
    ],
  },
};

const defaultCleaners = [];

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

const paymentDetails = {
  cleaning: {
    service: "Room cleaning",
    price: "$32",
    label: "Pay and book",
  },
};

const readRequests = () =>
  JSON.parse(localStorage.getItem(requestStorageKey) || "[]");

const writeRequests = (requests) => {
  localStorage.setItem(requestStorageKey, JSON.stringify(requests));
};

const readUpdates = () =>
  JSON.parse(localStorage.getItem(updatesStorageKey) || "[]");

const writeUpdates = (updates) => {
  localStorage.setItem(updatesStorageKey, JSON.stringify(updates));
};

const logUpdate = ({ type, request, message }) => {
  writeUpdates([
    {
      id: `UP-${Date.now()}`,
      type,
      requestId: request.id,
      message,
      createdAt: new Date().toISOString(),
    },
    ...readUpdates(),
  ]);
};

const toLocalDateTimeValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const normalizeAvailabilitySlot = (slot, index = 0) => {
  const startValue = typeof slot === "string" ? slot : slot?.start;
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(typeof slot === "object" && slot?.end ? slot.end : start.getTime() + 120 * 60000);
  if (Number.isNaN(end.getTime()) || end <= start) {
    end.setTime(start.getTime() + 120 * 60000);
  }

  return {
    id: typeof slot === "object" && slot?.id ? slot.id : `availability-${start.getTime()}-${index}`,
    start: toLocalDateTimeValue(start),
    end: toLocalDateTimeValue(end),
  };
};

const normalizeCleaner = (cleaner) => {
  if (typeof cleaner === "string") {
    return { name: cleaner, title: "Cleaner", photo: "", availability: [] };
  }

  return {
    name: cleaner.name || "Unnamed cleaner",
    title: cleaner.title || "Cleaner",
    photo: cleaner.photo || "",
    availability: Array.isArray(cleaner.availability)
      ? cleaner.availability.map(normalizeAvailabilitySlot).filter(Boolean)
      : [],
  };
};

const readCleaners = () =>
  JSON.parse(localStorage.getItem(cleanersStorageKey) || JSON.stringify(defaultCleaners)).map(
    normalizeCleaner,
  );

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toDateTimeLocal = (date) => toLocalDateTimeValue(date);

const formatSlot = (value) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const isUpcomingRequest = (request) => {
  const scheduledAt = new Date(request.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;

  return scheduledAt.getTime() >= Date.now();
};

const cleanerAssignmentLabel = (request) =>
  request.cleaner?.name ? `Accepted by ${request.cleaner.name}` : "Waiting for cleaner";

const cleanupExpiredOpenRequests = () => {
  const requests = readRequests();
  const activeRequests = requests.filter((request) => isUpcomingRequest(request) || request.cleaner?.name);

  if (activeRequests.length !== requests.length) {
    writeRequests(activeRequests);
  }

  return activeRequests;
};

const uniqueCleanersFromRequests = (requests) => {
  const cleaners = new Map();
  requests.forEach((request) => {
    if (request.cleaner?.name && !cleaners.has(request.cleaner.name)) {
      cleaners.set(request.cleaner.name, normalizeCleaner(request.cleaner));
    }
  });
  return [...cleaners.values()];
};

const cancelStudentRequest = (requestId) => {
  const requests = readRequests();
  const request = requests.find((item) => item.id === requestId);

  writeRequests(requests.filter((item) => item.id !== requestId));
  editingRequestId = "";

  if (request) {
    logUpdate({
      type: "canceled",
      request,
      message: `${request.location} was canceled by the student.`,
    });
  }

  renderProfile();
};

const editableScopeFields = [
  ["bedrooms", "Bedrooms"],
  ["bathrooms", "Bathrooms"],
  ["kitchen", "Kitchen"],
  ["dining", "Dining"],
  ["livingRoom", "Living room"],
];

const requestScopeValue = (request, key) => Number(request.scope?.[key] || 0);

const renderRequestEditor = (request) => `
  <form class="profile-edit-form" data-request-edit-form="${escapeHtml(request.id)}">
    <div class="profile-edit-grid">
      ${editableScopeFields
        .map(
          ([key, label]) => `
            <label>
              <span>${label}</span>
              <input type="number" min="0" step="1" name="${key}" value="${requestScopeValue(request, key)}" />
            </label>
          `,
        )
        .join("")}
    </div>

    <fieldset class="profile-edit-intensity">
      <legend>Cleaning intensity</legend>
      ${["Light", "Standard", "Deep"]
        .map(
          (option) => `
            <label>
              <input type="radio" name="intensity" value="${option}" ${request.intensity === option ? "checked" : ""} />
              <span>${option}</span>
            </label>
          `,
        )
        .join("")}
    </fieldset>

    <label class="profile-edit-notes">
      <span>Other adjustments</span>
      <textarea name="other" placeholder="Anything else that needs attention?">${escapeHtml(request.other || "")}</textarea>
    </label>

    <label class="profile-edit-notes">
      <span>Comments</span>
      <textarea name="notes" placeholder="Access notes, no-touch items, or timing details.">${escapeHtml(request.notes || "")}</textarea>
    </label>

    <div class="profile-request-actions">
      <button class="save-request-button" type="submit">Save changes</button>
      <button type="button" data-close-request-editor>Cancel</button>
    </div>
  </form>
`;

const updateStudentRequest = (requestId, form) => {
  const requests = readRequests();
  const request = requests.find((item) => item.id === requestId);
  if (!request) return;

  const formData = new FormData(form);
  const nextScope = {};
  editableScopeFields.forEach(([key]) => {
    nextScope[key] = Math.max(0, Number(formData.get(key)) || 0);
  });

  const nextRequest = {
    ...request,
    scope: nextScope,
    intensity: formData.get("intensity") || request.intensity || "Standard",
    other: String(formData.get("other") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    updatedAt: new Date().toISOString(),
  };

  writeRequests(requests.map((item) => (item.id === requestId ? nextRequest : item)));
  logUpdate({
    type: "updated",
    request: nextRequest,
    message: `${nextRequest.location || "A cleaning request"} was updated by the student.`,
  });
  editingRequestId = "";
  renderProfile();
};

const getCleanerSlots = (cleaner, cleanerIndex) => {
  const savedSlots = (cleaner.availability || [])
    .map(normalizeAvailabilitySlot)
    .filter(Boolean)
    .map((slot) => slot.start);

  if (savedSlots.length) return savedSlots;

  const base = new Date("2026-05-23T09:00:00");
  const offsets = [cleanerIndex, cleanerIndex + 1, cleanerIndex + 2, cleanerIndex + 3];
  const hours = [10, 13, 16, 18];

  return offsets.map((offset, index) => {
    const slot = new Date(base);
    slot.setDate(base.getDate() + Math.floor(offset / 2));
    slot.setHours(hours[index], index % 2 ? 30 : 0, 0, 0);
    return toDateTimeLocal(slot);
  });
};

const isSameSlot = (left, right) =>
  new Date(left).getTime() === new Date(right).getTime();

const datePartFromLocal = (value) => value?.slice(0, 10) || "";

const timePartFromLocal = (value) => value?.slice(11, 16) || "";

const todayDateValue = () => toDateTimeLocal(new Date()).slice(0, 10);

const dateFromKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateTrigger = (key) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateFromKey(key));

const monthLabel = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatClockOption = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const buildTimeOptions = (selectedValue = "") => {
  const options = ['<option value="" disabled>Select time</option>'];
  for (let hour = 7; hour <= 22; hour += 1) {
    ["00", "30"].forEach((minute) => {
      if (hour === 22 && minute === "30") return;
      const value = `${String(hour).padStart(2, "0")}:${minute}`;
      options.push(`<option value="${value}" ${selectedValue === value ? "selected" : ""}>${formatClockOption(value)}</option>`);
    });
  }
  return options.join("");
};

const timeValues = () => {
  const values = [];
  for (let hour = 7; hour <= 22; hour += 1) {
    ["00", "30"].forEach((minute) => {
      if (hour === 22 && minute === "30") return;
      values.push(`${String(hour).padStart(2, "0")}:${minute}`);
    });
  }
  return values;
};

const buildTimeMenu = (selectedValue = "") =>
  timeValues()
    .map(
      (value) => `
        <button class="time-option ${selectedValue === value ? "selected" : ""}" type="button" role="option" aria-selected="${selectedValue === value}" data-time-value="${value}">
          ${formatClockOption(value)}
        </button>
      `,
    )
    .join("");

const parseTypedTime = (value = "") => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!normalized) return "";

  const period = normalized.includes("p") ? "pm" : normalized.includes("a") ? "am" : "";
  const digits = normalized.replace(/[^0-9:]/g, "");
  let hours;
  let minutes = 0;

  if (digits.includes(":")) {
    const [hourPart, minutePart = "0"] = digits.split(":");
    hours = Number(hourPart);
    minutes = Number(minutePart.padEnd(2, "0").slice(0, 2));
  } else if (digits.length <= 2) {
    hours = Number(digits);
  } else {
    hours = Number(digits.slice(0, -2));
    minutes = Number(digits.slice(-2));
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  if (![0, 30].includes(minutes) || hours < 7 || hours > 22 || (hours === 22 && minutes > 0)) return "";

  const parsed = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return timeValues().includes(parsed) ? parsed : "";
};

const closeTimeMenus = () => {
  document.querySelectorAll(".time-picker").forEach((picker) => {
    picker.querySelector(".time-menu").classList.add("hidden");
    picker.querySelector(".time-trigger").setAttribute("aria-expanded", "false");
  });
};

const closeDateMenus = () => {
  document.querySelectorAll(".date-picker").forEach((picker) => {
    picker.querySelector(".date-menu").classList.add("hidden");
    picker.querySelector(".date-trigger").setAttribute("aria-expanded", "false");
  });
};

const buildDateMenu = (selectedValue = "", monthOffset = 0) => {
  const today = dateFromKey(todayDateValue());
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const firstWeekday = monthDate.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<span class="date-option blank"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const value = toDateTimeLocal(date).slice(0, 10);
    const isPast = date < today;
    const isSelected = value === selectedValue;
    cells.push(`
      <button class="date-option ${isSelected ? "selected" : ""}" type="button" data-date-value="${value}" ${isPast ? "disabled" : ""}>
        ${day}
      </button>
    `);
  }

  return `
    <div class="date-menu-header">
      <button class="date-nav" type="button" data-date-nav="-1" ${monthOffset <= 0 ? "disabled" : ""} aria-label="Previous month">‹</button>
      <strong>${monthLabel(monthDate)}</strong>
      <button class="date-nav" type="button" data-date-nav="1" aria-label="Next month">›</button>
    </div>
    <div class="date-weekdays" aria-hidden="true">
      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
    </div>
    <div class="date-grid">${cells.join("")}</div>
  `;
};

const syncDatePicker = (row) => {
  const dateInput = row.querySelector(".cleaning-date");
  const trigger = row.querySelector(".date-trigger");
  const menu = row.querySelector(".date-menu");
  const monthOffset = Number(row.dataset.dateMonthOffset || 0);
  trigger.textContent = dateInput.value ? formatDateTrigger(dateInput.value) : "Select date";
  menu.innerHTML = buildDateMenu(dateInput.value, monthOffset);
};

const syncTimePicker = (row) => {
  const timeInput = row.querySelector(".cleaning-time");
  const trigger = row.querySelector(".time-trigger");
  const menu = row.querySelector(".time-menu");
  trigger.value = timeInput.value ? formatClockOption(timeInput.value) : "";
  trigger.setCustomValidity("");
  menu.innerHTML = buildTimeMenu(timeInput.value);
};

const validateTimeRows = () => {
  const invalidTrigger = [...document.querySelectorAll(".time-row")].find((row) => {
    const trigger = row.querySelector(".time-trigger");
    const parsed = parseTypedTime(trigger.value);
    if (parsed) {
      row.querySelector(".cleaning-time").value = parsed;
      syncTimePicker(row);
      return false;
    }
    trigger.setCustomValidity("Choose a time on the hour or half hour.");
    return true;
  })?.querySelector(".time-trigger");

  if (invalidTrigger) {
    invalidTrigger.reportValidity();
    invalidTrigger.setCustomValidity("");
    return false;
  }

  return true;
};

const configureTimeRow = (row, value = "") => {
  const dateInput = row.querySelector(".cleaning-date");
  const timeInput = row.querySelector(".cleaning-time");
  dateInput.value = datePartFromLocal(value);
  row.dataset.dateMonthOffset = "0";
  syncDatePicker(row);
  timeInput.innerHTML = buildTimeOptions(timePartFromLocal(value));
  timeInput.value = timePartFromLocal(value);
  syncTimePicker(row);
};

const getSelectedTimes = () =>
  [...document.querySelectorAll(".time-row")]
    .map((row) => {
      const date = row.querySelector(".cleaning-date").value;
      const timeInput = row.querySelector(".cleaning-time");
      const typedTime = parseTypedTime(row.querySelector(".time-trigger").value);
      if (typedTime && timeInput.value !== typedTime) {
        timeInput.value = typedTime;
        syncTimePicker(row);
      }
      const time = timeInput.value;
      return date && time ? `${date}T${time}` : "";
    })
    .filter(Boolean);

const formatTimeOptions = (times = []) =>
  times.length > 1 ? `Options: ${times.map(formatSlot).join(" or ")}` : formatSlot(times[0]);

const formatTimeList = (times = []) =>
  times.map((time) => `<li>${escapeHtml(formatSlot(time))}</li>`).join("");

const requestTimeLabel = (request) =>
  request.cleaner?.name ? formatSlot(request.scheduledAt) : formatTimeOptions(request.timeOptions || [request.scheduledAt]);

const updateTimeButtons = () => {
  const rows = timeList.querySelectorAll(".time-row");
  rows.forEach((row) => {
    row.querySelector(".remove-time").classList.toggle("hidden", rows.length === 1);
  });
};

const addTimeRow = (value = "") => {
  const row = document.createElement("div");
  row.className = "time-row";
  row.innerHTML = `
    <div class="date-time-fields">
      <div class="date-picker">
        <input class="cleaning-date native-date-input" type="text" required />
        <button class="field-control date-trigger" type="button" aria-haspopup="dialog" aria-expanded="false">Select date</button>
        <div class="date-menu hidden"></div>
      </div>
      <div class="time-picker">
        <select class="cleaning-time native-time-select" required aria-label="Cleaning time"></select>
        <input class="field-control time-trigger" type="text" placeholder="Select time" autocomplete="off" inputmode="numeric" required aria-haspopup="listbox" aria-expanded="false" />
        <div class="time-menu hidden" role="listbox"></div>
      </div>
    </div>
    <button class="remove-time" type="button" aria-label="Remove time">×</button>
  `;
  configureTimeRow(row, value);
  row.querySelector(".remove-time").addEventListener("click", () => {
    row.remove();
    updateTimeButtons();
    updatePayment();
  });
  timeList.append(row);
  updateTimeButtons();
};

const isInServiceArea = (value) => {
  const normalized = value.toLowerCase();
  if (outsideAreaTerms.some((term) => normalized.includes(term))) return false;

  const hasRegion = serviceAreaRegions.some((term) => normalized.includes(term));
  const hasWestPhillyStreet = serviceAreaStreets.some((term) => normalized.includes(term));

  return hasRegion || hasWestPhillyStreet;
};

const isCleanerBooked = (cleaner, slot) =>
  readRequests().some(
    (request) =>
      request.cleaner?.name === cleaner.name &&
      request.status !== "Complete" &&
      isSameSlot(request.scheduledAt, slot),
  );

const addressValue = (address) => address.custom || `${address.name}, ${address.detail}`;

const matchingAddresses = (query) => {
  const normalizedQuery = query.trim().toLowerCase();
  const pool = normalizedQuery
    ? suggestedAddresses.filter((address) =>
        `${address.name} ${address.detail} ${address.hint}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : suggestedAddresses;

  const matches = pool.slice(0, 4);
  return query.trim()
    ? [{ name: "Use this West Philly address", detail: query.trim(), hint: "Custom address", custom: query.trim() }, ...matches]
    : matches;
};

const closeAddressResults = () => {
  document.querySelectorAll(".address-results").forEach((results) => {
    results.classList.remove("active");
    results.innerHTML = "";
  });
};

const renderAddressResults = (wrapper) => {
  const input = wrapper.querySelector(".field-control");
  const results = wrapper.querySelector(".address-results");
  const matches = matchingAddresses(input.value);

  if (!matches.length) {
    results.innerHTML = '<div class="address-empty">Start typing an address.</div>';
    results.classList.add("active");
    return;
  }

  results.innerHTML = matches
    .map(
      (address, index) => `
        <button class="address-option" type="button" role="option" data-address-index="${index}">
          <strong>${address.name}</strong>
          <span>${address.detail} / ${address.hint}</span>
        </button>
      `,
    )
    .join("");

  results.classList.add("active");
  results.querySelectorAll(".address-option").forEach((button, index) => {
    button.addEventListener("click", () => {
      input.value = addressValue(matches[index]);
      closeAddressResults();
      input.focus();
    });
  });
};

const getActiveService = () => "cleaning";

const updateSubmitLabel = () => {
  submitLabel.textContent = "Book cleaning";
};

const showScreen = (screenName) => {
  document.querySelector(".phone-frame").classList.toggle("providers-mode", screenName === "providers");
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === screenName);
  });
};

const showOrderSlide = (slideName) => {
  activeOrderSlide = slideName;
  orderSlides.forEach((slide) => {
    slide.classList.toggle("active", slide.dataset.orderSlide === slideName);
  });

  const isDetails = slideName === "details";
  orderBackButton.classList.add("hidden");
  orderNextButton.classList.toggle("hidden", !isDetails);
  confirmButton.classList.toggle("hidden", isDetails);
};

const updateInstructions = () => {
  const service = getActiveService();
  const content = instructions[service];

  instructionsKicker.textContent = content.kicker;
  instructionsTitle.textContent = content.title;
  instructionsCopy.textContent = content.copy;
  instructionList.innerHTML = content.items.map((item) => `<li>${item}</li>`).join("");
};

const updateProviders = () => {
  const people = readCleaners();
  const query = providerSearch.value.trim().toLowerCase();
  const filteredPeople = query
    ? people.filter((cleaner) =>
        `${cleaner.name} ${cleaner.title}`.toLowerCase().includes(query),
      )
    : people;

  providersTitle.textContent = "Connected cleaners";
  slotList.classList.add("hidden");
  slotList.innerHTML = "";
  providerSearchWrap.classList.remove("hidden");
  providerList.classList.remove("hidden");
  providerList.innerHTML = filteredPeople.length
    ? filteredPeople
        .map(
          (cleaner) => `
        <button class="provider-card" type="button" data-cleaner-name="${cleaner.name}">
          ${
            cleaner.photo
              ? `<img class="provider-photo" src="${cleaner.photo}" alt="${cleaner.name}" />`
              : `<div class="provider-avatar" aria-hidden="true">${cleaner.name.charAt(0)}</div>`
          }
          <div>
            <h3>${cleaner.name}</h3>
          </div>
        </button>
      `,
        )
        .join("")
    : people.length
      ? '<div class="empty-provider-state">No cleaners match that search.</div>'
      : '<div class="empty-provider-state">No cleaners are connected yet.</div>';

  providerList.querySelectorAll(".provider-card").forEach((button) => {
    button.addEventListener("click", () => {
      const cleanerIndex = people.findIndex((cleaner) => cleaner.name === button.dataset.cleanerName);
      showCleanerSlots(people[cleanerIndex], cleanerIndex);
    });
  });
};

const updateSelectedCleaner = () => {
  selectedCleanerCard.classList.toggle("hidden", !selectedCleaner);
  if (!selectedCleaner) return;

  selectedCleanerName.textContent = selectedCleaner.name;
};

clearCleanerButton.addEventListener("click", () => {
  selectedCleaner = null;
  updateSelectedCleaner();
  updatePayment();
});

const showCleanerSlots = (cleaner, cleanerIndex) => {
  providersTitle.textContent = `${cleaner.name} available slots`;
  providerList.classList.add("hidden");
  providerSearchWrap.classList.add("hidden");
  slotList.classList.remove("hidden");
  const availableSlots = getCleanerSlots(cleaner, cleanerIndex).filter(
    (slot) => !isCleanerBooked(cleaner, slot),
  );

  slotList.innerHTML = availableSlots.length
    ? availableSlots
        .map(
          (slot) => `
        <button class="slot-option" type="button" data-slot="${slot}">
          <strong>${formatSlot(slot)}</strong>
        </button>
      `,
        )
        .join("")
    : '<div class="empty-provider-state">No open slots for this cleaner right now.</div>';

  slotList.querySelectorAll(".slot-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCleaner = cleaner;
      cleaningDateInput.value = datePartFromLocal(button.dataset.slot);
      cleaningTimeInput.value = timePartFromLocal(button.dataset.slot);
      updateSelectedCleaner();
      showOrderSlide("details");
      showScreen("order");
    });
  });
};

const renderProfile = () => {
  renderStudentAuth();
  const requests = cleanupExpiredOpenRequests();
  const upcomingRequests = requests.filter(isUpcomingRequest);
  const previousRequests = requests.filter((request) => !isUpcomingRequest(request) && request.cleaner?.name);

  upcomingCount.textContent = upcomingRequests.length;
  previousCleanerCount.textContent = previousRequests.length;

  upcomingList.innerHTML = upcomingRequests.length
    ? upcomingRequests
        .map(
          (request) => {
            const isEditing = editingRequestId === request.id;
            return `
            <article class="profile-item profile-item-editable ${isEditing ? "editing" : ""}" ${
              isEditing ? "" : `role="button" tabindex="0" data-open-request-editor="${escapeHtml(request.id)}"`
            }>
              <div class="profile-item-main">
                <span class="${request.cleaner?.name ? "accepted" : "waiting"}">${escapeHtml(cleanerAssignmentLabel(request))}</span>
                <strong>${escapeHtml(request.location || "Address not set")}</strong>
                <p>${requestTimeLabel(request)} / ${escapeHtml(request.intensity || "Standard")}</p>
              </div>
              ${
                isEditing
                  ? renderRequestEditor(request)
                  : `<div class="profile-request-actions">
                      <button class="edit-request-button" type="button" data-open-request-editor="${escapeHtml(request.id)}">Edit</button>
                      <button type="button" data-cancel-request="${escapeHtml(request.id)}">Cancel</button>
                    </div>`
              }
            </article>
          `;
          },
        )
        .join("")
    : '<div class="empty-provider-state">No upcoming cleaning requests yet.</div>';

  upcomingList.querySelectorAll("[data-open-request-editor]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("[data-cancel-request], [data-close-request-editor]")) return;
      editingRequestId = item.dataset.openRequestEditor;
      renderProfile();
    });

    item.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      editingRequestId = item.dataset.openRequestEditor;
      renderProfile();
    });
  });

  upcomingList.querySelectorAll("[data-request-edit-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateStudentRequest(form.dataset.requestEditForm, form);
    });
  });

  upcomingList.querySelectorAll("[data-close-request-editor]").forEach((button) => {
    button.addEventListener("click", () => {
      editingRequestId = "";
      renderProfile();
    });
  });

  upcomingList.querySelectorAll("[data-cancel-request]").forEach((button) => {
    button.addEventListener("click", () => {
      cancelStudentRequest(button.dataset.cancelRequest);
    });
  });

  previousCleanersList.innerHTML = previousRequests.length
    ? previousRequests
        .map(
          (request) => `
            <article class="profile-item previous-cleaning-item">
              <div class="profile-item-main">
                <span class="accepted">Previous cleaner</span>
                <strong class="previous-cleaner-name">${request.cleaner.name}</strong>
                <p class="previous-cleaning-meta">${request.location || "Address not set"}</p>
                <p class="previous-cleaning-meta">${requestTimeLabel(request)} / ${request.intensity}</p>
              </div>
              <div class="profile-request-actions">
                <button class="book-again-button" type="button" data-rebook-cleaner="${request.cleaner.name}">Book again</button>
              </div>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-provider-state">Previous cleanings will appear here.</div>';

  previousCleanersList.querySelectorAll("[data-rebook-cleaner]").forEach((button) => {
    button.addEventListener("click", () => {
      const people = readCleaners();
      const cleanerIndex = people.findIndex((cleaner) => cleaner.name === button.dataset.rebookCleaner);
      if (cleanerIndex === -1) return;

      showCleanerSlots(people[cleanerIndex], cleanerIndex);
      showScreen("providers");
    });
  });
};

const renderStudentAuth = async () => {
  if (!studentAuthStatus) return;

  if (!window.CleanConnectSync?.enabled) {
    studentAuthStatus.textContent = "Local";
    studentAuthMessage.textContent = "Add Supabase keys to enable account memory across devices.";
    return;
  }

  const user = await window.CleanConnectSync.getUser();
  studentAuthStatus.textContent = user?.email ? "Signed in" : "Signed out";
  studentAuthMessage.textContent = user?.email || "";
};

const updatePayment = () => {
  const service = getActiveService();
  const content = paymentDetails[service];

  paymentService.textContent = content.service;
  paymentPrice.textContent = content.price;
  confirmationPrice.textContent = content.price;
  payLabel.textContent = content.label;
  renderPaymentOrderDetails();
};

const scopeLabels = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  kitchen: "Kitchen",
  dining: "Dining",
  livingRoom: "Living room",
};

const renderPaymentOrderDetails = () => {
  const times = getSelectedTimes();
  const details = getOrderDetails(times, "draft");
  const scopeItems = Object.entries(details.scope)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${scopeLabels[key] || key}: ${value}`);

  paymentOrderDetails.innerHTML = `
    <div>
      <span>Address</span>
      <strong>${escapeHtml(details.location || "Not set")}</strong>
    </div>
    <div>
      <span>Time</span>
      ${
        times.length > 1
          ? `<ul class="payment-time-list">${formatTimeList(times)}</ul>`
          : `<strong>${times.length ? escapeHtml(formatSlot(times[0])) : "Not set"}</strong>`
      }
    </div>
    <div>
      <span>Cleaning details</span>
      <strong>${escapeHtml(scopeItems.join(" / ") || "No rooms selected")}</strong>
    </div>
    <div>
      <span>Intensity</span>
      <strong>${escapeHtml(details.intensity)}</strong>
    </div>
    ${
      details.cleaner?.name
        ? `<div><span>Cleaner</span><strong>${escapeHtml(details.cleaner.name)}</strong></div>`
        : ""
    }
    ${
      details.notes
        ? `<div><span>Comments</span><strong>${escapeHtml(details.notes)}</strong></div>`
        : ""
    }
  `;
};

const getOrderDetails = (timeOptions, orderGroupId) => {
  const service = getActiveService();
  const panel = document.querySelector(`[data-panel="${service}"]`);
  const textInput = panel.querySelector('input[type="search"]');
  const notesInput = panel.querySelector('textarea[name="cleaning-notes"]');
  const intensityInput = panel.querySelector('input[name="intensity"]:checked');
  const payment = paymentDetails[service];
  const scope = {};

  panel.querySelectorAll(".scope-row").forEach((row) => {
    scope[row.dataset.scope] = Number(row.querySelector("[data-count]").textContent);
  });

  return {
    id: orderGroupId,
    orderGroupId,
    service,
    serviceLabel: payment.service,
    location: textInput.value,
    scheduledAt: timeOptions[0],
    timeOptions,
    intensity: intensityInput?.value || "Standard",
    scope,
    other: "",
    cleaner: selectedCleaner,
    notes: notesInput?.value.trim() || "",
    charge: Number(payment.price.replace("$", "")),
    status: "Paid",
    submittedAt: new Date().toISOString(),
  };
};

const createRequestFromCurrentOrder = () => {
  const times = getSelectedTimes();
  const orderGroupId = `CC-${Date.now().toString().slice(-6)}`;
  return getOrderDetails(times, orderGroupId);
};

const fileRequest = (request = createRequestFromCurrentOrder()) => {
  const requests = readRequests();
  const newRequest = {
    ...request,
    status: request.status || "Paid",
    submittedAt: request.submittedAt || new Date().toISOString(),
  };

  if (requests.some((item) => item.orderGroupId === newRequest.orderGroupId)) return;

  writeRequests([newRequest, ...requests]);
  logUpdate({
    type: "logged",
    request: newRequest,
    message: `${newRequest.location} was booked with ${formatTimeOptions(newRequest.timeOptions)}.`,
  });
};

const startStripeCheckout = async () => {
  const booking = createRequestFromCurrentOrder();
  localStorage.setItem(pendingCheckoutKey, JSON.stringify(booking));
  payButton.disabled = true;
  payLabel.textContent = "Opening Stripe...";

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking }),
    });
    const data = await readJsonResponse(response);

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Stripe Checkout could not start.");
    }

    window.location.href = data.url;
  } catch (error) {
    payButton.disabled = false;
    updatePayment();
    alert(`Stripe Checkout could not start: ${error.message || "Unknown error"}`);
  }
};

const completeStripeCheckout = async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") !== "success") return false;

  const sessionId = params.get("session_id");
  const pending = JSON.parse(localStorage.getItem(pendingCheckoutKey) || "null");
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;

  if (!sessionId || !pending) {
    window.history.replaceState({}, "", cleanUrl);
    return false;
  }

  let response;
  let data;

  try {
    response = await fetch(`/api/confirm-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
    data = await readJsonResponse(response);
  } catch (error) {
    alert(`Stripe payment verification failed: ${error.message || "Unknown error"}`);
    return true;
  }

  if (response.ok && data.paid) {
    fileRequest({
      ...pending,
      stripeCheckoutSessionId: sessionId,
      stripePaymentStatus: data.paymentStatus,
      submittedAt: new Date().toISOString(),
    });
    localStorage.removeItem(pendingCheckoutKey);
    showOrderSlide("details");
    showScreen("confirmation");
  } else {
    alert(data.error || "Stripe payment was not completed.");
  }

  window.history.replaceState({}, "", cleanUrl);
  return true;
};

const handleStripeCancel = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") !== "cancelled") return false;

  window.history.replaceState({}, "", `${window.location.origin}${window.location.pathname}`);
  showScreen("payment");
  return true;
};

addressSearches.forEach((wrapper) => {
  const input = wrapper.querySelector(".field-control");

  input.addEventListener("focus", () => renderAddressResults(wrapper));
  input.addEventListener("input", () => renderAddressResults(wrapper));
});

document.querySelectorAll(".remove-time").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".time-row").remove();
    updateTimeButtons();
    updatePayment();
  });
});

["input", "change"].forEach((eventName) => {
  timeList.addEventListener(eventName, (event) => {
    if (event.target.classList.contains("cleaning-date") || event.target.classList.contains("cleaning-time")) {
      if (event.target.classList.contains("cleaning-time")) {
        syncTimePicker(event.target.closest(".time-row"));
      }
      updatePayment();
    }
  });
});

timeList.addEventListener("click", (event) => {
  const dateTrigger = event.target.closest(".date-trigger");
  if (dateTrigger) {
    const picker = dateTrigger.closest(".date-picker");
    const menu = picker.querySelector(".date-menu");
    const isOpen = !menu.classList.contains("hidden");
    closeDateMenus();
    closeTimeMenus();
    menu.classList.toggle("hidden", isOpen);
    dateTrigger.setAttribute("aria-expanded", String(!isOpen));
    return;
  }

  const dateNav = event.target.closest("[data-date-nav]");
  if (dateNav) {
    const row = dateNav.closest(".time-row");
    row.dataset.dateMonthOffset = String(Math.max(0, Number(row.dataset.dateMonthOffset || 0) + Number(dateNav.dataset.dateNav)));
    syncDatePicker(row);
    row.querySelector(".date-menu").classList.remove("hidden");
    row.querySelector(".date-trigger").setAttribute("aria-expanded", "true");
    return;
  }

  const dateOption = event.target.closest("[data-date-value]");
  if (dateOption) {
    const row = dateOption.closest(".time-row");
    const dateInput = row.querySelector(".cleaning-date");
    dateInput.value = dateOption.dataset.dateValue;
    syncDatePicker(row);
    closeDateMenus();
    dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const trigger = event.target.closest(".time-trigger");
  if (trigger) {
    const picker = trigger.closest(".time-picker");
    const menu = picker.querySelector(".time-menu");
    const isOpen = !menu.classList.contains("hidden");
    closeDateMenus();
    closeTimeMenus();
    menu.classList.toggle("hidden", isOpen);
    trigger.setAttribute("aria-expanded", String(!isOpen));
    return;
  }

  const option = event.target.closest(".time-option");
  if (!option) return;

  const row = option.closest(".time-row");
  const timeInput = row.querySelector(".cleaning-time");
  timeInput.value = option.dataset.timeValue;
  row.querySelector(".time-trigger").setCustomValidity("");
  syncTimePicker(row);
  closeTimeMenus();
  timeInput.dispatchEvent(new Event("change", { bubbles: true }));
});

timeList.addEventListener("input", (event) => {
  if (!event.target.classList.contains("time-trigger")) return;
  const row = event.target.closest(".time-row");
  const parsed = parseTypedTime(event.target.value);
  const timeInput = row.querySelector(".cleaning-time");
  timeInput.value = parsed;
  event.target.setCustomValidity("");
  row.querySelector(".time-menu").innerHTML = buildTimeMenu(parsed);
  updatePayment();
});

timeList.addEventListener("blur", (event) => {
  if (!event.target.classList.contains("time-trigger")) return;
  const row = event.target.closest(".time-row");
  const parsed = parseTypedTime(event.target.value);
  const timeInput = row.querySelector(".cleaning-time");
  if (parsed) {
    timeInput.value = parsed;
  }
  syncTimePicker(row);
}, true);

addTimeButton.addEventListener("click", () => {
  addTimeRow();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-address-search]")) {
    closeAddressResults();
  }

  if (!event.target.closest(".time-picker")) {
    closeTimeMenus();
  }

  if (!event.target.closest(".date-picker")) {
    closeDateMenus();
  }
});

document.querySelectorAll(".stepper button").forEach((button) => {
  button.addEventListener("click", () => {
    const count = button.closest(".stepper").querySelector("[data-count]");
    const nextValue = Math.max(0, Number(count.textContent) + Number(button.dataset.step));
    count.textContent = nextValue;
  });
});

orderNextButton.addEventListener("click", () => {
  if (!document.querySelector(".order-form").reportValidity()) return;
  if (!validateTimeRows()) return;
  const addressInput = document.querySelector("#cleaning-location");
  if (!isInServiceArea(addressInput.value)) {
    addressInput.setCustomValidity("Please use a West Philadelphia or nearby service-area address.");
    addressInput.reportValidity();
    addressInput.setCustomValidity("");
    return;
  }

  showOrderSlide("scope");
});

orderBackButton.addEventListener("click", () => {
  showOrderSlide("details");
});

orderTopBackButton.addEventListener("click", () => {
  showOrderSlide("details");
});

confirmButton.addEventListener("click", () => {
  updateInstructions();
  showScreen("instructions");
});

backButton.addEventListener("click", () => {
  showScreen("order");
});

doneButton.addEventListener("click", () => {
  updatePayment();
  showScreen("payment");
});

paymentBackButton.addEventListener("click", () => {
  showScreen("instructions");
});

const togglePaymentSummary = () => {
  const isOpen = !paymentOrderDetails.classList.contains("hidden");
  paymentOrderDetails.classList.toggle("hidden", isOpen);
  paymentSummary.setAttribute("aria-expanded", String(!isOpen));
};

paymentSummary.addEventListener("click", togglePaymentSummary);

paymentSummary.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  togglePaymentSummary();
});

payButton.addEventListener("click", startStripeCheckout);

newBookingButton.addEventListener("click", () => {
  selectedCleaner = null;
  updateSelectedCleaner();
  timeList.querySelectorAll(".time-row").forEach((row, index) => {
    if (index === 0) {
      row.querySelector(".cleaning-date").value = "";
      row.querySelector(".cleaning-time").value = "";
      return;
    }
    row.remove();
  });
  updateTimeButtons();
  updatePayment();
  showOrderSlide("details");
  showScreen("order");
});

providersButton.addEventListener("click", () => {
  providerSearch.value = "";
  updateProviders();
  showScreen("providers");
});

profileButton.addEventListener("click", () => {
  renderProfile();
  showScreen("profile");
});

profileBackButton.addEventListener("click", () => {
  showScreen("order");
});

studentAuthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  studentAuthMessage.textContent = "";

  try {
    const user = await window.CleanConnectSync.signInOrSignUp({
      email: studentAuthEmail.value.trim(),
      password: studentAuthPassword.value,
      metadata: { role: "student" },
    });
    studentAuthPassword.value = "";
    studentAuthMessage.textContent = user?.email ? `Signed in as ${user.email}` : "Check your email to confirm your account.";
    renderStudentAuth();
  } catch (error) {
    studentAuthMessage.textContent = error.message || "Account sign-in failed.";
  }
});

studentSignOut?.addEventListener("click", async () => {
  await window.CleanConnectSync?.signOut();
  studentAuthPassword.value = "";
  renderStudentAuth();
});

providersBackButton.addEventListener("click", () => {
  if (!slotList.classList.contains("hidden")) {
    updateProviders();
    return;
  }

  showScreen("order");
});

const initializeApp = () => {
  updateSubmitLabel();
  configureTimeRow(timeList.querySelector(".time-row"));
  updateProviders();
  updatePayment();
  updateSelectedCleaner();
  updateTimeButtons();
  showOrderSlide(activeOrderSlide);
  completeStripeCheckout().then((completed) => {
    if (!completed) handleStripeCancel();
  });
};

window.addEventListener("storage", (event) => {
  if ([cleanersStorageKey, requestStorageKey].includes(event.key)) {
    updateProviders();
    if (document.querySelector('[data-screen="profile"]').classList.contains("active")) {
      renderProfile();
    }
  }
});

providerSearch.addEventListener("input", updateProviders);

(window.CleanConnectSync?.ready || Promise.resolve()).finally(initializeApp);
