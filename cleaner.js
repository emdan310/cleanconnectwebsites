const requestStorageKey = "cleanconnectRequests";
const cleanersStorageKey = "cleanconnectCleaners";
const cleanerSessionKey = "cleanconnectCleanerSession";
const updatesStorageKey = "cleanconnectUpdates";
const exampleResetStorageKey = "cleanconnectExamplesClearedV2";
const defaultCleaners = [];

const loginScreen = document.querySelector("#login-screen");
const workScreen = document.querySelector("#work-screen");
const loginForm = document.querySelector("#login-form");
const loginName = document.querySelector("#login-name");
const loginPasscode = document.querySelector("#login-passcode");
const loginEmail = document.querySelector("#login-email");
const loginAccountPassword = document.querySelector("#login-account-password");
const loginError = document.querySelector("#login-error");
const cleanerOptions = document.querySelector("#cleaner-options");
const signOutButton = document.querySelector("#sign-out-button");
const activeCleanerName = document.querySelector("#active-cleaner-name");
const openJobs = document.querySelector("#open-jobs");
const bookedValue = document.querySelector("#booked-value");
const assignedJobs = document.querySelector("#assigned-jobs");
const availabilitySlots = document.querySelector("#availability-slots");
const jobCount = document.querySelector("#job-count");
const jobList = document.querySelector("#job-list");
const cleanerTabs = document.querySelectorAll(".cleaner-tab");
const cleanerPanels = document.querySelectorAll("[data-cleaner-panel]");
const cleanerCalendar = document.querySelector("#cleaner-calendar");
const cleanerCalendarMonth = document.querySelector("#cleaner-calendar-month");
const cleanerCalendarPrev = document.querySelector("#cleaner-calendar-prev");
const cleanerCalendarNext = document.querySelector("#cleaner-calendar-next");
const cleanerCalendarDetail = document.querySelector("#cleaner-calendar-detail");
const cleanerCalendarZoomButtons = document.querySelectorAll("[data-calendar-zoom]");
const cleanerAvailabilityEditor = document.querySelector("#cleaner-availability-editor");
const availabilityWeekLabel = document.querySelector("#availability-week-label");
const availabilityPrev = document.querySelector("#availability-prev");
const availabilityNext = document.querySelector("#availability-next");

let signedInCleanerName = localStorage.getItem(cleanerSessionKey) || "";
let cleanerCalendarAnchor = null;
let cleanerCalendarZoom = "week";
let latestAssignedRequests = [];
let selectedAvailableSlot = null;
let availabilityWeekAnchor = null;
let availabilityDrag = null;
let availabilityCreateDrag = null;

const availabilityStartHour = 8;
const availabilityEndHour = 22;
const availabilityStepMinutes = 30;
const defaultAvailabilityDurationMinutes = availabilityStepMinutes;

const calendarSlotHeight = () =>
  Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--calendar-slot-height")) || 24;

const resetHorizontalScroll = () => {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
};

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
signedInCleanerName = localStorage.getItem(cleanerSessionKey) || "";

const toLocalDateTimeValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const normalizeAvailabilitySlot = (slot, index = 0) => {
  const startValue = typeof slot === "string" ? slot : slot?.start;
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(typeof slot === "object" && slot?.end ? slot.end : start.getTime() + defaultAvailabilityDurationMinutes * 60000);
  if (Number.isNaN(end.getTime()) || end <= start) {
    end.setTime(start.getTime() + defaultAvailabilityDurationMinutes * 60000);
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

const writeCleaners = (cleaners) => {
  localStorage.setItem(cleanersStorageKey, JSON.stringify(cleaners.map(normalizeCleaner)));
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

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const toDateTimeLocal = (date) => toLocalDateTimeValue(date);

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getRequestTimes = (request) => request.timeOptions || [request.scheduledAt];

const formatTimeOptions = (request) => {
  const times = getRequestTimes(request);
  return times.length > 1
    ? `Options: ${times.map(formatDateTime).join(" or ")}`
    : formatDateTime(times[0]);
};

const formatSlotTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open slot";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;

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

const formatCalendarJobTitle = (request) =>
  (request.location || "Address not set").split(",")[0].trim();

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateFromKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getCleanerSlots = (cleanerIndex) => {
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

const cleanerIndexByName = (cleaners, name) =>
  cleaners.findIndex((cleaner) => cleaner.name.toLowerCase() === name.trim().toLowerCase());

const isForCleaner = (request, cleaner) =>
  request.service === "cleaning" && request.cleaner?.name === cleaner.name;

const isOpenRequest = (request) =>
  request.service === "cleaning" && !request.cleaner?.name;

const sortBySchedule = (requests) =>
  [...requests].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

const groupByDateKey = (requests) =>
  requests.reduce((days, request) => {
    const date = new Date(request.scheduledAt);
    if (Number.isNaN(date.getTime())) return days;

    const key = dateKey(date);
    days[key] = days[key] || [];
    days[key].push(request);
    return days;
  }, {});

const startOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const minutesFromDate = (date) => date.getHours() * 60 + date.getMinutes();

const dateAtMinutes = (date, minutes) => {
  const next = new Date(date);
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return next;
};

const clampAvailabilityMinutes = (minutes, duration) =>
  Math.min(
    (availabilityEndHour * 60) - duration,
    Math.max(availabilityStartHour * 60, minutes),
  );

const snapAvailabilityMinutes = (minutes) =>
  Math.round(minutes / availabilityStepMinutes) * availabilityStepMinutes;

const snapAvailabilityEndMinutes = (minutes) =>
  Math.ceil(minutes / availabilityStepMinutes) * availabilityStepMinutes;

const formatAvailabilityWeek = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(weekStart);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  }).format(weekEnd);

  return `${startLabel} - ${endLabel}`;
};

const formatCalendarRange = (date, zoom) => {
  if (zoom === "day") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  if (zoom === "week") return formatAvailabilityWeek(startOfWeek(date));

  return formatCalendarMonth(date);
};

const formatAvailabilityTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const availabilitySlotsForWeek = (cleaner, weekStart) => {
  const weekEnd = addDays(weekStart, 7);
  return (cleaner.availability || [])
    .map(normalizeAvailabilitySlot)
    .filter(Boolean)
    .filter((slot) => {
      const start = new Date(slot.start);
      return start >= weekStart && start < weekEnd;
    })
    .sort((left, right) => new Date(left.start) - new Date(right.start));
};

const updateCleanerAvailability = (slots) => {
  const cleaners = readCleaners();
  const cleanerIndex = cleanerIndexByName(cleaners, signedInCleanerName);
  if (cleanerIndex === -1) return null;

  cleaners[cleanerIndex] = {
    ...cleaners[cleanerIndex],
    availability: slots.map(normalizeAvailabilitySlot).filter(Boolean),
  };
  writeCleaners(cleaners);
  return cleaners[cleanerIndex];
};

const addAvailabilitySlot = (cleaner, date, minutes, duration = defaultAvailabilityDurationMinutes) => {
  const startMinutes = clampAvailabilityMinutes(
    snapAvailabilityMinutes(minutes),
    duration,
  );
  const start = dateAtMinutes(date, startMinutes);
  const end = dateAtMinutes(date, startMinutes + duration);
  const slot = {
    id: `availability-${Date.now()}`,
    start: toDateTimeLocal(start),
    end: toDateTimeLocal(end),
  };

  const nextCleaner = updateCleanerAvailability([...(cleaner.availability || []), slot]);
  if (nextCleaner) renderCleanerAvailability(nextCleaner);
};

const minutesFromPointerInColumn = (event, column) => {
  const rect = column.getBoundingClientRect();
  const slotHeight = calendarSlotHeight();
  const offset = Math.max(0, event.clientY - rect.top);
  return availabilityStartHour * 60 + (offset / slotHeight) * availabilityStepMinutes;
};

const updateAvailabilityDraft = (event) => {
  if (!availabilityCreateDrag) return;

  const { block, column, date, startMinutes } = availabilityCreateDrag;
  const maxEndMinutes = availabilityEndHour * 60;
  const endMinutes = Math.min(
    maxEndMinutes,
    Math.max(
      startMinutes + availabilityStepMinutes,
      snapAvailabilityEndMinutes(minutesFromPointerInColumn(event, column)),
    ),
  );
  const slotHeight = calendarSlotHeight();
  const duration = endMinutes - startMinutes;

  block.style.height = `${(duration / availabilityStepMinutes) * slotHeight - 4}px`;
  block.dataset.pendingDuration = String(duration);
  block.querySelector("strong").textContent = formatAvailabilityTime(dateAtMinutes(date, startMinutes));
  block.querySelector("span").textContent = formatAvailabilityTime(dateAtMinutes(date, endMinutes));
};

const removeAvailabilitySlot = (cleaner, slotId) => {
  const nextCleaner = updateCleanerAvailability(
    (cleaner.availability || []).filter((slot) => slot.id !== slotId),
  );
  if (nextCleaner) renderCleanerAvailability(nextCleaner);
};

const moveAvailabilitySlot = (cleaner, slotId, date, minutes) => {
  const current = (cleaner.availability || []).find((slot) => slot.id === slotId);
  if (!current) return;

  const duration = Math.max(
    availabilityStepMinutes,
    (new Date(current.end) - new Date(current.start)) / 60000,
  );
  const startMinutes = clampAvailabilityMinutes(snapAvailabilityMinutes(minutes), duration);
  const start = dateAtMinutes(date, startMinutes);
  const end = dateAtMinutes(date, startMinutes + duration);

  const nextCleaner = updateCleanerAvailability(
    (cleaner.availability || []).map((slot) =>
      slot.id === slotId
        ? { ...slot, start: toDateTimeLocal(start), end: toDateTimeLocal(end) }
        : slot,
    ),
  );
  if (nextCleaner) renderCleanerAvailability(nextCleaner);
};

const renderCleanerAvailability = (cleaner) => {
  if (!cleanerAvailabilityEditor || !availabilityWeekLabel) return;

  availabilityWeekAnchor = startOfWeek(availabilityWeekAnchor || new Date());
  const weekStart = availabilityWeekAnchor;
  const rowCount = ((availabilityEndHour - availabilityStartHour) * 60) / availabilityStepMinutes;
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const minutes = availabilityStartHour * 60 + index * availabilityStepMinutes;
    return minutes;
  });
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const slots = availabilitySlotsForWeek(cleaner, weekStart);

  availabilityWeekLabel.textContent = formatAvailabilityWeek(weekStart);
  cleanerAvailabilityEditor.innerHTML = `
    <div class="availability-grid">
      <div class="availability-corner"></div>
      ${days
        .map(
          (day) => `
            <div class="availability-day-head">
              <strong>${new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}</strong>
              <span>${day.getDate()}</span>
            </div>
          `,
        )
        .join("")}
      <div class="availability-time-rail">
        ${rows
          .map((minutes) => {
            const label = minutes % 60 === 0 ? formatAvailabilityTime(dateAtMinutes(weekStart, minutes)).replace(":00", "") : "";
            return `<span class="availability-time-label">${escapeHtml(label)}</span>`;
          })
          .join("")}
      </div>
      ${days
        .map(
          (day) => `
            <div class="availability-day-column" data-availability-day="${dateKey(day)}">
              ${rows
                .map(
                  (minutes) => `
                    <button
                      class="availability-cell"
                      type="button"
                      data-availability-add="${dateKey(day)}"
                      data-availability-minutes="${minutes}"
                      aria-label="Add availability"
                    ></button>
                  `,
                )
                .join("")}
              ${slots
                .filter((slot) => dateKey(new Date(slot.start)) === dateKey(day))
                .map((slot) => {
                  const start = new Date(slot.start);
                  const end = new Date(slot.end);
                  const startMinutes = minutesFromDate(start);
                  const duration = Math.max(availabilityStepMinutes, (end - start) / 60000);
                  const slotHeight = calendarSlotHeight();
                  const top = ((startMinutes - availabilityStartHour * 60) / availabilityStepMinutes) * slotHeight;
                  const height = (duration / availabilityStepMinutes) * slotHeight - 4;

                  return `
                    <div
                      class="availability-block"
                      data-availability-block="${escapeHtml(slot.id)}"
                      style="top: ${top}px; height: ${height}px;"
                    >
                      <strong>${escapeHtml(formatAvailabilityTime(slot.start))}</strong>
                      <span>${escapeHtml(formatAvailabilityTime(slot.end))}</span>
                      <button class="availability-remove" type="button" data-remove-availability="${escapeHtml(slot.id)}" aria-label="Remove availability">×</button>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `,
        )
        .join("")}
    </div>
  `;

  cleanerAvailabilityEditor.querySelectorAll("[data-availability-add]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || availabilityDrag || availabilityCreateDrag) return;

      const column = button.closest(".availability-day-column");
      if (!column) return;

      const date = dateFromKey(button.dataset.availabilityAdd);
      const startMinutes = clampAvailabilityMinutes(
        snapAvailabilityMinutes(Number(button.dataset.availabilityMinutes)),
        availabilityStepMinutes,
      );
      const slotHeight = calendarSlotHeight();
      const top = ((startMinutes - availabilityStartHour * 60) / availabilityStepMinutes) * slotHeight;
      const block = document.createElement("div");
      block.className = "availability-block availability-draft dragging";
      block.style.top = `${top}px`;
      block.style.height = `${slotHeight - 4}px`;
      block.innerHTML = `
        <strong></strong>
        <span></span>
      `;
      column.append(block);

      availabilityCreateDrag = {
        block,
        button,
        cleaner,
        column,
        date,
        pointerId: event.pointerId,
        startMinutes,
      };
      button.setPointerCapture(event.pointerId);
      updateAvailabilityDraft(event);
    });
  });

  cleanerAvailabilityEditor.querySelectorAll("[data-remove-availability]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeAvailabilitySlot(cleaner, button.dataset.removeAvailability);
    });
  });

  cleanerAvailabilityEditor.querySelectorAll("[data-availability-block]").forEach((block) => {
    block.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".availability-remove")) return;

      const slot = (cleaner.availability || []).find((item) => item.id === block.dataset.availabilityBlock);
      if (!slot) return;

      const dayColumn = block.closest(".availability-day-column");
      const start = new Date(slot.start);
      availabilityDrag = {
        block,
        cleaner,
        slotId: slot.id,
        pointerId: event.pointerId,
        startY: event.clientY,
        startMinutes: minutesFromDate(start),
        dayKey: dayColumn.dataset.availabilityDay,
        duration: Math.max(availabilityStepMinutes, (new Date(slot.end) - start) / 60000),
      };

      block.classList.add("dragging");
      block.setPointerCapture(event.pointerId);
    });
  });
};

const renderCalendarDetail = (request) => {
  const scope = formatScope(request.scope);
  const detailText = [request.intensity || "Standard", scope, money(Number(request.charge || 0))]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" / ");

  cleanerCalendarDetail.classList.remove("hidden");
  cleanerCalendarDetail.innerHTML = `
    <div>
      <p>Cleaning details</p>
      <h3>${escapeHtml(request.location || "Address not set")}</h3>
      <a class="map-link" href="${mapsUrl(request.location)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>
      <span>${formatDateTime(request.scheduledAt)}</span>
    </div>
    <p class="cleaner-detail-summary">${detailText}</p>
    ${request.other ? `<p class="job-notes">Other: ${escapeHtml(request.other)}</p>` : ""}
    ${request.notes ? `<p class="job-notes">${escapeHtml(request.notes)}</p>` : ""}
  `;
};

const showLogin = () => {
  loginScreen.classList.remove("hidden");
  workScreen.classList.add("hidden");
};

const showWorkBoard = () => {
  loginScreen.classList.add("hidden");
  workScreen.classList.remove("hidden");
};

const renderLoginOptions = (cleaners) => {
  cleanerOptions.innerHTML = cleaners
    .map((cleaner) => `<option value="${escapeHtml(cleaner.name)}"></option>`)
    .join("");
};

const assignRequestToCleaner = (requestId, cleaner, selectedTime) => {
  const requests = readRequests();
  let acceptedRequest = null;
  const nextRequests = requests.map((request) => {
    if (request.id !== requestId) return request;

    acceptedRequest = {
      ...request,
      scheduledAt: selectedTime || request.scheduledAt,
      cleaner,
      status: "Accepted",
    };
    return acceptedRequest;
  });
  writeRequests(nextRequests);

  if (acceptedRequest) {
    logUpdate({
      type: "accepted",
      request: acceptedRequest,
      message: `${cleaner.name} accepted ${acceptedRequest.location} for ${formatDateTime(acceptedRequest.scheduledAt)}.`,
    });
  }

  selectedAvailableSlot = null;
  renderPortal();
};

const cancelRequestForCleaner = (requestId, cleaner) => {
  const requests = readRequests();
  let canceledRequest = null;
  const nextRequests = requests.map((request) => {
    if (request.id !== requestId) return request;

    canceledRequest = {
      ...request,
      cleaner: null,
      status: "Paid",
    };
    return canceledRequest;
  });
  writeRequests(nextRequests);

  if (canceledRequest) {
    logUpdate({
      type: "canceled",
      request: canceledRequest,
      message: `${cleaner.name} canceled ${canceledRequest.location}. It is open for another cleaner.`,
    });
  }

  renderPortal();
};

const renderAvailability = (requests, cleaner) => {
  if (!requests.length) {
    selectedAvailableSlot = null;
    availabilitySlots.innerHTML = '<div class="empty-state">No available cleanings right now.</div>';
    return;
  }

  if (
    selectedAvailableSlot &&
    !requests.some((request) => request.id === selectedAvailableSlot.requestId)
  ) {
    selectedAvailableSlot = null;
  }

  availabilitySlots.innerHTML = sortBySchedule(requests)
    .map(
      (request) => {
        const times = getRequestTimes(request);
        const isSelectedRequest = selectedAvailableSlot?.requestId === request.id;
        return `
        <article class="slot-chip ${isSelectedRequest ? "selected" : ""}">
          <div class="slot-main">
            <span>Requested time</span>
            <strong>${formatTimeOptions(request)}</strong>
          </div>
          <div class="slot-main">
            <span>Address</span>
            <a href="${mapsUrl(request.location)}" target="_blank" rel="noopener noreferrer">${escapeHtml(request.location || "Address not set")}</a>
          </div>
          <em>${escapeHtml(request.intensity || "Standard")}</em>
          <div class="slot-actions">
            ${times
              .map((time) => {
                const isSelected =
                  selectedAvailableSlot?.requestId === request.id &&
                  selectedAvailableSlot?.time === time;
                return `
                  <button
                    class="slot-select ${isSelected ? "selected" : ""}"
                    type="button"
                    data-select-request="${escapeHtml(request.id)}"
                    data-select-time="${escapeHtml(time)}"
                  >
                    ${isSelected ? "Selected" : "Select"} ${escapeHtml(formatSlotTime(time))}
                  </button>
                  ${
                    isSelected
                      ? `<button
                          class="slot-confirm"
                          type="button"
                          data-confirm-request="${escapeHtml(request.id)}"
                          data-confirm-time="${escapeHtml(time)}"
                        >
                          Confirm
                        </button>`
                      : ""
                  }
                `;
              })
              .join("")}
          </div>
        </article>
      `;
      },
    )
    .join("");

  availabilitySlots.querySelectorAll("[data-select-request]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAvailableSlot = {
        requestId: button.dataset.selectRequest,
        time: button.dataset.selectTime,
      };
      renderAvailability(requests, cleaner);
    });
  });

  availabilitySlots.querySelectorAll("[data-confirm-request]").forEach((button) => {
    button.addEventListener("click", () => {
      assignRequestToCleaner(button.dataset.confirmRequest, cleaner, button.dataset.confirmTime);
    });
  });
};

const renderMetrics = (requests) => {
  const value = requests.reduce((sum, request) => sum + Number(request.charge || 0), 0);

  if (openJobs) openJobs.textContent = requests.length;
  if (bookedValue) bookedValue.textContent = money(value);
  if (assignedJobs) assignedJobs.textContent = requests.length;
  jobCount.textContent = `${requests.length} ${requests.length === 1 ? "job" : "jobs"}`;
};

const renderJobs = (requests) => {
  if (!requests.length) {
    jobList.innerHTML = '<div class="empty-state">No assigned jobs yet. New bookings appear here after students choose you.</div>';
    return;
  }

  jobList.innerHTML = sortBySchedule(requests)
    .map((request) => {
      const scope = formatScope(request.scope);
      const detailText = [request.intensity || "Standard", scope]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" / ");
      return `
        <article class="job-card">
          <div class="job-card-top">
            <p class="job-time">${formatDateTime(request.scheduledAt)}</p>
            <strong class="job-pay">${money(Number(request.charge || 0))}</strong>
          </div>
          <div class="job-main">
            <h3>${escapeHtml(request.location || "Address not set")}</h3>
            <a class="map-link" href="${mapsUrl(request.location)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>
          </div>
          <p class="job-meta">${detailText}</p>
          ${request.other ? `<p class="job-notes">Other: ${escapeHtml(request.other)}</p>` : ""}
          ${request.notes ? `<p class="job-notes">${escapeHtml(request.notes)}</p>` : ""}
          <div class="job-actions">
            <button class="cancel-job" type="button" data-cancel-request="${escapeHtml(request.id)}">
              Cancel job
            </button>
          </div>
        </article>
      `;
    })
    .join("");
  jobList.querySelectorAll("[data-cancel-request]").forEach((button) => {
    button.addEventListener("click", () => {
      const cleaners = readCleaners();
      const cleaner = cleaners.find((person) => person.name === signedInCleanerName);
      if (!cleaner) return;

      cancelRequestForCleaner(button.dataset.cancelRequest, cleaner);
    });
  });
};

const renderCalendarJobButton = (request, className = "cleaner-calendar-job") => `
  <button class="${className}" type="button" data-cleaner-calendar-request="${escapeHtml(request.id)}">
    <strong>${formatCalendarTime(request.scheduledAt)}</strong>
    <span>${escapeHtml(formatCalendarJobTitle(request))}</span>
  </button>
`;

const renderWorkTimeGrid = (requests, days, mode) => {
  const rowCount = ((availabilityEndHour - availabilityStartHour) * 60) / availabilityStepMinutes;
  const rows = Array.from({ length: rowCount }, (_, index) => availabilityStartHour * 60 + index * availabilityStepMinutes);
  const dayKeys = days.map(dateKey);

  return `
    <div class="work-calendar-grid ${mode === "day" ? "day-mode" : ""}">
      <div class="work-calendar-corner"></div>
      ${days
        .map(
          (day) => `
            <button class="work-calendar-day-head" type="button" data-calendar-day="${dateKey(day)}">
              <strong>${new Intl.DateTimeFormat("en-US", { weekday: mode === "day" ? "long" : "short" }).format(day)}</strong>
              <span>${day.getDate()}</span>
            </button>
          `,
        )
        .join("")}
      <div class="work-calendar-time-rail">
        ${rows
          .map((minutes) => {
            const label = minutes % 60 === 0 ? formatAvailabilityTime(dateAtMinutes(days[0], minutes)).replace(":00", "") : "";
            return `<span class="work-calendar-time-label">${escapeHtml(label)}</span>`;
          })
          .join("")}
      </div>
      ${days
        .map(
          (day) => `
            <div class="work-calendar-day-column" data-calendar-day="${dateKey(day)}">
              ${rows.map(() => `<span class="work-calendar-cell"></span>`).join("")}
              ${requests
                .filter((request) => dateKey(new Date(request.scheduledAt)) === dateKey(day))
                .map((request) => {
                  const start = new Date(request.scheduledAt);
                  const startMinutes = clampAvailabilityMinutes(minutesFromDate(start), availabilityStepMinutes);
                  const slotHeight = calendarSlotHeight();
                  const top = ((startMinutes - availabilityStartHour * 60) / availabilityStepMinutes) * slotHeight;
                  const height = slotHeight * 2 - 4;

                  return `
                    <button
                      class="work-calendar-block"
                      type="button"
                      data-cleaner-calendar-request="${escapeHtml(request.id)}"
                      style="top: ${top}px; height: ${height}px;"
                    >
                      <strong>${formatCalendarTime(request.scheduledAt)}</strong>
                      <span>${escapeHtml(formatCalendarJobTitle(request))}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
};

const renderCalendar = (requests) => {
  const datedRequests = sortBySchedule(
    requests.filter((request) => !Number.isNaN(new Date(request.scheduledAt).getTime())),
  );
  if (!cleanerCalendarAnchor) {
    cleanerCalendarAnchor = datedRequests.length ? new Date(datedRequests[0].scheduledAt) : new Date();
  }
  const anchor = cleanerCalendarAnchor;
  const requestsByDay = groupByDateKey(datedRequests);

  cleanerCalendarMonth.textContent = formatCalendarRange(anchor, cleanerCalendarZoom);
  cleanerCalendarZoomButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.calendarZoom === cleanerCalendarZoom);
  });

  if (cleanerCalendarZoom === "day") {
    cleanerCalendar.innerHTML = renderWorkTimeGrid(datedRequests, [anchor], "day");
  } else if (cleanerCalendarZoom === "week") {
    const weekStart = startOfWeek(anchor);
    cleanerCalendar.innerHTML = renderWorkTimeGrid(
      datedRequests,
      Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
      "week",
    );
  } else {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingDays = firstDay.getDay();
    const totalCells = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;

    cleanerCalendar.innerHTML = `
      <div class="cleaner-calendar-weekdays" aria-hidden="true">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div class="cleaner-calendar-month-grid">
        ${Array.from({ length: totalCells }, (_, cellIndex) => {
          const dayNumber = cellIndex - leadingDays + 1;
          const isInMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
          const cellDate = new Date(year, month, dayNumber);
          const jobs = isInMonth ? requestsByDay[dateKey(cellDate)] || [] : [];

          return `
            <article class="cleaner-calendar-cell ${isInMonth ? "" : "muted"}">
              ${isInMonth ? `<button class="cleaner-calendar-number" type="button" data-calendar-day="${dateKey(cellDate)}">${dayNumber}</button>` : ""}
              <div class="cleaner-calendar-jobs">
                ${jobs.map((request) => renderCalendarJobButton(request)).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  cleanerCalendar.querySelectorAll("[data-cleaner-calendar-request]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const request = requests.find((item) => item.id === button.dataset.cleanerCalendarRequest);
      if (!request) return;

      cleanerCalendar.querySelectorAll(".cleaner-calendar-job, .work-calendar-block").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });
      renderCalendarDetail(request);
      cleanerCalendarDetail.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  });

  cleanerCalendar.querySelectorAll("button[data-calendar-day]").forEach((button) => {
    button.addEventListener("click", () => {
      cleanerCalendarAnchor = dateFromKey(button.dataset.calendarDay);
      cleanerCalendarZoom = "day";
      cleanerCalendarDetail.classList.add("hidden");
      renderCalendar(latestAssignedRequests);
    });
  });
};

const renderPortal = () => {
  const cleaners = readCleaners();
  renderLoginOptions(cleaners);

  const activeCleanerIndex = cleanerIndexByName(cleaners, signedInCleanerName);
  const activeCleaner = cleaners[activeCleanerIndex];

  if (!activeCleaner) {
    signedInCleanerName = "";
    localStorage.removeItem(cleanerSessionKey);
    showLogin();
    return;
  }

  if (activeCleanerName) activeCleanerName.textContent = activeCleaner.name;
  showWorkBoard();
  const requests = readRequests();
  const assignedRequests = requests.filter((request) => isForCleaner(request, activeCleaner));
  const openRequests = requests.filter(isOpenRequest);
  latestAssignedRequests = assignedRequests;

  renderAvailability(openRequests, activeCleaner);
  renderMetrics(assignedRequests);
  renderJobs(assignedRequests);
  renderCleanerAvailability(activeCleaner);
  renderCalendar(assignedRequests);
};

cleanerTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    cleanerTabs.forEach((item) => item.classList.remove("active"));
    cleanerPanels.forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    document.querySelector(`[data-cleaner-panel="${tab.dataset.cleanerView}"]`).classList.add("active");
    resetHorizontalScroll();
  });
});

cleanerCalendarPrev.addEventListener("click", () => {
  cleanerCalendarAnchor = cleanerCalendarAnchor || new Date();
  if (cleanerCalendarZoom === "day") {
    cleanerCalendarAnchor = addDays(cleanerCalendarAnchor, -1);
  } else if (cleanerCalendarZoom === "week") {
    cleanerCalendarAnchor = addDays(cleanerCalendarAnchor, -7);
  } else {
    cleanerCalendarAnchor = new Date(cleanerCalendarAnchor.getFullYear(), cleanerCalendarAnchor.getMonth() - 1, 1);
  }
  cleanerCalendarDetail.classList.add("hidden");
  renderCalendar(latestAssignedRequests);
});

cleanerCalendarNext.addEventListener("click", () => {
  cleanerCalendarAnchor = cleanerCalendarAnchor || new Date();
  if (cleanerCalendarZoom === "day") {
    cleanerCalendarAnchor = addDays(cleanerCalendarAnchor, 1);
  } else if (cleanerCalendarZoom === "week") {
    cleanerCalendarAnchor = addDays(cleanerCalendarAnchor, 7);
  } else {
    cleanerCalendarAnchor = new Date(cleanerCalendarAnchor.getFullYear(), cleanerCalendarAnchor.getMonth() + 1, 1);
  }
  cleanerCalendarDetail.classList.add("hidden");
  renderCalendar(latestAssignedRequests);
});

cleanerCalendarZoomButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cleanerCalendarZoom = button.dataset.calendarZoom;
    cleanerCalendarAnchor = cleanerCalendarAnchor || new Date();
    cleanerCalendarDetail.classList.add("hidden");
    renderCalendar(latestAssignedRequests);
    resetHorizontalScroll();
  });
});

availabilityPrev.addEventListener("click", () => {
  availabilityWeekAnchor = addDays(startOfWeek(availabilityWeekAnchor || new Date()), -7);
  const cleaner = readCleaners().find((person) => person.name === signedInCleanerName);
  if (cleaner) renderCleanerAvailability(cleaner);
});

availabilityNext.addEventListener("click", () => {
  availabilityWeekAnchor = addDays(startOfWeek(availabilityWeekAnchor || new Date()), 7);
  const cleaner = readCleaners().find((person) => person.name === signedInCleanerName);
  if (cleaner) renderCleanerAvailability(cleaner);
});

document.addEventListener("pointermove", (event) => {
  if (availabilityCreateDrag) {
    updateAvailabilityDraft(event);
    return;
  }

  if (!availabilityDrag) return;

  const targetColumn = event.target.closest?.(".availability-day-column")
    || document.elementFromPoint(event.clientX, event.clientY)?.closest(".availability-day-column")
    || availabilityDrag.block.closest(".availability-day-column");
  if (!targetColumn) return;

  const slotHeight = calendarSlotHeight();
  const deltaSteps = Math.round((event.clientY - availabilityDrag.startY) / slotHeight);
  const nextMinutes = clampAvailabilityMinutes(
    availabilityDrag.startMinutes + deltaSteps * availabilityStepMinutes,
    availabilityDrag.duration,
  );
  const top = ((nextMinutes - availabilityStartHour * 60) / availabilityStepMinutes) * slotHeight;

  if (availabilityDrag.block.parentElement !== targetColumn) {
    targetColumn.append(availabilityDrag.block);
  }

  availabilityDrag.block.style.top = `${top}px`;
  availabilityDrag.block.dataset.pendingMinutes = String(nextMinutes);
  availabilityDrag.block.dataset.pendingDay = targetColumn.dataset.availabilityDay;
});

const finishAvailabilityDrag = (event) => {
  if (availabilityCreateDrag) {
    const { block, button, cleaner, date, pointerId, startMinutes } = availabilityCreateDrag;
    const duration = Number(block.dataset.pendingDuration || availabilityStepMinutes);

    if (button.hasPointerCapture?.(pointerId)) {
      button.releasePointerCapture(pointerId);
    }

    block.remove();
    availabilityCreateDrag = null;
    addAvailabilitySlot(cleaner, date, startMinutes, duration);
    return;
  }

  if (!availabilityDrag) return;

  const block = availabilityDrag.block;
  block.classList.remove("dragging");
  if (block.hasPointerCapture?.(availabilityDrag.pointerId)) {
    block.releasePointerCapture(availabilityDrag.pointerId);
  }

  const dayKey = block.dataset.pendingDay || availabilityDrag.dayKey;
  const minutes = Number(block.dataset.pendingMinutes || availabilityDrag.startMinutes);
  moveAvailabilitySlot(availabilityDrag.cleaner, availabilityDrag.slotId, dateFromKey(dayKey), minutes);
  availabilityDrag = null;
};

const cancelAvailabilityDrag = () => {
  if (availabilityCreateDrag) {
    const { block, button, pointerId } = availabilityCreateDrag;

    if (button.hasPointerCapture?.(pointerId)) {
      button.releasePointerCapture(pointerId);
    }

    block.remove();
    availabilityCreateDrag = null;
    return;
  }

  finishAvailabilityDrag();
};

document.addEventListener("pointerup", finishAvailabilityDrag);
document.addEventListener("pointercancel", cancelAvailabilityDrag);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cleaners = readCleaners();
  const cleanerIndex = cleanerIndexByName(cleaners, loginName.value);

  if (cleanerIndex === -1) {
    loginError.textContent = "Cleaner not found.";
    return;
  }

  if (!loginPasscode.value.trim()) {
    loginError.textContent = "Enter your passcode.";
    return;
  }

  if (window.CleanConnectSync?.enabled && loginEmail.value.trim() && loginAccountPassword.value) {
    try {
      await window.CleanConnectSync.signInOrSignUp({
        email: loginEmail.value.trim(),
        password: loginAccountPassword.value,
        metadata: {
          role: "cleaner",
          cleaner_name: cleaners[cleanerIndex].name,
        },
      });
    } catch (error) {
      loginError.textContent = error.message || "Cleaner account sign-in failed.";
      return;
    }
  }

  signedInCleanerName = cleaners[cleanerIndex].name;
  localStorage.setItem(cleanerSessionKey, signedInCleanerName);
  loginName.value = "";
  loginPasscode.value = "";
  loginEmail.value = "";
  loginAccountPassword.value = "";
  loginError.textContent = "";
  renderPortal();
});

signOutButton.addEventListener("click", async () => {
  signedInCleanerName = "";
  localStorage.removeItem(cleanerSessionKey);
  await window.CleanConnectSync?.signOut();
  showLogin();
});

window.addEventListener("storage", (event) => {
  if ([requestStorageKey, cleanersStorageKey, cleanerSessionKey, updatesStorageKey].includes(event.key)) {
    signedInCleanerName = localStorage.getItem(cleanerSessionKey) || "";
    renderPortal();
  }
});

(window.CleanConnectSync?.ready || Promise.resolve()).finally(() => {
  signedInCleanerName = localStorage.getItem(cleanerSessionKey) || "";
  renderPortal();
});
