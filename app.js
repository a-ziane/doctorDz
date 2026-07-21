const supabaseSettings = window.PatientDZSupabase || window.DoctorDZSupabase || {};
const supabaseReady =
  window.supabase &&
  supabaseSettings.url &&
  supabaseSettings.anonKey &&
  !supabaseSettings.url.includes("YOUR_") &&
  !supabaseSettings.anonKey.includes("YOUR_");
const supabaseClient = supabaseReady ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey) : null;

const screens = Object.fromEntries([...document.querySelectorAll(".screen")].map((screen) => [screen.dataset.screen, screen]));
const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalActions = document.getElementById("modal-actions");
const appState = {
  user: null,
  profile: null,
  doctor: null,
  clinic: null,
  workingDays: [],
  timeOff: [],
  appointments: [],
  appointmentFilter: "today",
};

const appointmentFilters = ["all", "today", "pending", "upcoming", "completed", "cancelled"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const queueFlow = ["waiting", "checked_in", "in_consultation", "checked_out"];
const todayIso = () => new Date().toISOString().slice(0, 10);

document.addEventListener("click", handleDocumentClick);
initApp();

async function initApp() {
  renderAuthScreens();

  if (!supabaseClient) {
    navigate("start");
    toast("Add Supabase URL and anon key in supabase-config.js");
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    toast(error.message);
    navigate("start");
    return;
  }

  appState.user = data.session?.user || null;
  if (appState.user) {
    await loadDoctorWorkspace();
  } else {
    navigate("start");
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    appState.user = session?.user || null;
    if (appState.user) {
      await loadDoctorWorkspace();
    } else {
      resetWorkspace();
      renderAuthScreens();
      navigate("start");
    }
  });
}

async function loadDoctorWorkspace() {
  await loadProfileBundle();
  if (!appState.profile || !appState.doctor) {
    renderOnboarding();
    navigate("onboarding");
    return;
  }

  await Promise.all([loadAvailability(), loadAppointments()]);
  renderAppScreens();
  const appScreens = ["dashboard", "appointments", "queue", "availability", "profile"];
  const target = appScreens.includes(currentScreen()) ? currentScreen() : "dashboard";
  navigate(target);
}

async function loadProfileBundle() {
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", appState.user.id)
    .maybeSingle();

  if (profileError) {
    toast(profileError.message);
    return;
  }

  appState.profile = profile;

  const { data: doctor, error: doctorError } = await supabaseClient
    .from("doctor_profiles")
    .select("*, clinics(*)")
    .eq("id", appState.user.id)
    .maybeSingle();

  if (doctorError) {
    toast(doctorError.message);
    return;
  }

  appState.doctor = doctor;
  appState.clinic = doctor?.clinics || null;
}

async function loadAvailability() {
  const [workingDaysResult, timeOffResult] = await Promise.all([
    supabaseClient
      .from("doctor_working_days")
      .select("*")
      .eq("doctor_id", appState.user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabaseClient
      .from("doctor_time_off")
      .select("*")
      .eq("doctor_id", appState.user.id)
      .order("starts_at", { ascending: true }),
  ]);

  if (workingDaysResult.error) toast(workingDaysResult.error.message);
  if (timeOffResult.error) toast(timeOffResult.error.message);

  appState.workingDays = workingDaysResult.data || [];
  appState.timeOff = timeOffResult.data || [];
}

async function loadAppointments() {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*, profiles!appointments_patient_id_fkey(full_name, phone, email)")
    .eq("doctor_id", appState.user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    toast(error.message);
    return;
  }

  appState.appointments = data || [];
}

function renderAuthScreens() {
  renderStart();
  renderSignup();
  renderLogin();
  renderForgot();
  renderConfirm();
}

function renderAppScreens() {
  renderDashboard();
  renderAppointments();
  renderQueue();
  renderAvailability();
  renderProfile();
}

function renderStart() {
  screens.start.innerHTML = `
    <div class="auth-page">
      <section class="start-panel">
        <div class="start-copy">
          <img class="start-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
          <p class="eyebrow">Connected to Patient DZ</p>
          <h1 id="start-title">Manage your practice from the doctor dashboard.</h1>
          <p>Doctor DZ gives verified Algerian doctors one focused workspace for appointment requests, queue flow, weekly availability, and clinic profile updates.</p>
        </div>
        <div class="start-actions">
          <h2>Start</h2>
          <ul class="feature-list">
            <li>Create a doctor account with email confirmation.</li>
            <li>Complete clinic onboarding for admin verification.</li>
            <li>Run daily appointments and queue status from one screen.</li>
          </ul>
          <button class="button" data-nav="signup">Create Doctor Account</button>
          <button class="ghost" data-nav="login">Login</button>
        </div>
      </section>
    </div>
  `;
}

function renderSignup() {
  screens.signup.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="signup-title">Create doctor account</h1>
        <p class="meta">Use the email address you want patients and admins to recognize.</p>
        <form class="auth-form" data-form="signup">
          <div class="field"><label for="signup-name">Full name</label><input id="signup-name" name="name" autocomplete="name" required /></div>
          <div class="field"><label for="signup-email">Email</label><input id="signup-email" name="email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="signup-phone">Phone</label><input id="signup-phone" name="phone" autocomplete="tel" required /></div>
          <div class="field"><label for="signup-password">Password</label><input id="signup-password" name="password" type="password" autocomplete="new-password" required minlength="6" /></div>
          <button class="button" type="submit">Create Account</button>
        </form>
        <p class="auth-switch">Already registered? <button class="link-button" data-nav="login">Log in</button></p>
      </section>
    </div>
  `;

  screens.signup.querySelector("[data-form='signup']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const form = new FormData(event.currentTarget);
    const email = clean(form.get("email"));
    const { error } = await supabaseClient.auth.signUp({
      email,
      password: form.get("password"),
      options: {
        emailRedirectTo: window.location.href.split("#")[0],
        data: {
          full_name: clean(form.get("name")),
          phone: clean(form.get("phone")),
          role: "doctor",
        },
      },
    });

    if (error) {
      toast(error.message);
      return;
    }

    showModal(
      "Confirm your email",
      `<p>We sent a confirmation link to ${escapeHtml(email)}. Confirm it, then log in to complete doctor onboarding.</p>`,
      [["Log in", "button", () => {
        closeModal();
        navigate("login");
      }]],
    );
  });
}

function renderLogin() {
  screens.login.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="login-title">Log in</h1>
        <p class="meta">Access appointments, availability, and queue controls.</p>
        <form class="auth-form" data-form="login">
          <div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required /></div>
          <button class="button" type="submit">Log In</button>
        </form>
        <button class="link-button" data-nav="forgot">Forgot password?</button>
        <p class="auth-switch">Need an account? <button class="link-button" data-nav="signup">Create doctor account</button></p>
      </section>
    </div>
  `;

  screens.login.querySelector("[data-form='login']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: clean(form.get("email")),
      password: form.get("password"),
    });

    if (error) {
      toast(error.message);
      return;
    }

    appState.user = data.user;
    await loadDoctorWorkspace();
    toast("Logged in");
  });
}

function renderForgot() {
  screens.forgot.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="forgot-title">Reset password</h1>
        <p class="meta">Supabase will email a secure reset link.</p>
        <form class="auth-form" data-form="forgot">
          <div class="field"><label for="forgot-email">Email</label><input id="forgot-email" name="email" type="email" autocomplete="email" required /></div>
          <button class="button" type="submit">Send Reset Link</button>
        </form>
        <button class="link-button" data-nav="login">Back to login</button>
      </section>
    </div>
  `;

  screens.forgot.querySelector("[data-form='forgot']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const email = clean(new FormData(event.currentTarget).get("email"));
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split("#")[0],
    });

    if (error) {
      toast(error.message);
      return;
    }

    showModal("Reset link sent", `<p>Check ${escapeHtml(email)} for the password reset email.</p>`, [["Done", "button", closeModal]]);
  });
}

function renderConfirm() {
  screens.confirm.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="confirm-title">Email confirmation</h1>
        <p class="meta">After confirming your email, log in to complete doctor onboarding and wait for admin verification.</p>
        <button class="button" data-nav="login">Log In</button>
      </section>
    </div>
  `;
}

function renderOnboarding() {
  const metadata = appState.user?.user_metadata || {};
  screens.onboarding.innerHTML = `
    <div class="auth-page">
      <section class="auth-card wide-card">
        <div class="row row-start">
          <div>
            <h1 id="onboarding-title">Doctor onboarding</h1>
            <p class="meta">Your profile is unverified until an admin approves it.</p>
          </div>
          <button class="ghost" data-action="logout">Logout</button>
        </div>
        <form class="profile-form" data-form="onboarding">
          <div class="form-grid">
            <div class="field"><label>Full name</label><input name="full_name" value="${escapeAttr(appState.profile?.full_name || metadata.full_name || "")}" required /></div>
            <div class="field"><label>Phone</label><input name="phone" value="${escapeAttr(appState.profile?.phone || metadata.phone || "")}" required /></div>
            <div class="field"><label>Specialty</label><input name="specialty" required /></div>
            <div class="field"><label>License number</label><input name="license_number" required /></div>
            <div class="field"><label>Consultation price (DA)</label><input name="consultation_price" type="number" min="0" step="100" required /></div>
            <div class="field"><label>Clinic name</label><input name="clinic_name" required /></div>
            <div class="field"><label>Clinic phone</label><input name="clinic_phone" /></div>
            <div class="field"><label>Clinic email</label><input name="clinic_email" type="email" /></div>
            <div class="field"><label>City</label><input name="city" required /></div>
            <div class="field"><label>Wilaya</label><input name="wilaya" required /></div>
            <div class="field span-2"><label>Address</label><input name="address" required /></div>
            <div class="field span-2"><label>Bio</label><textarea name="bio" required></textarea></div>
          </div>
          <button class="button" type="submit">Save Doctor Profile</button>
        </form>
      </section>
    </div>
  `;

  screens.onboarding.querySelector("[data-form='onboarding']").addEventListener("submit", saveOnboarding);
}

async function saveOnboarding(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const profilePayload = {
    id: appState.user.id,
    role: "doctor",
    full_name: clean(form.get("full_name")),
    email: appState.user.email || "",
    phone: clean(form.get("phone")),
    updated_at: new Date().toISOString(),
  };
  const { error: profileError } = await supabaseClient.from("profiles").upsert(profilePayload);
  if (profileError) {
    toast(profileError.message);
    return;
  }

  const clinicPayload = clinicFromForm(form);
  const { data: clinic, error: clinicError } = await supabaseClient.from("clinics").insert(clinicPayload).select().single();
  if (clinicError) {
    toast(`Clinic save failed: ${clinicError.message}`);
    return;
  }

  const { error: doctorError } = await supabaseClient.from("doctor_profiles").upsert({
    id: appState.user.id,
    clinic_id: clinic.id,
    specialty: clean(form.get("specialty")),
    bio: clean(form.get("bio")),
    license_number: clean(form.get("license_number")),
    consultation_price: Number(form.get("consultation_price")) || null,
    accepts_new_patients: true,
    approval_required: true,
    is_verified: false,
    updated_at: new Date().toISOString(),
  });
  if (doctorError) {
    toast(doctorError.message);
    return;
  }

  await loadDoctorWorkspace();
  toast("Onboarding saved");
}

function renderDashboard() {
  const stats = getStats();
  screens.dashboard.innerHTML = `
    ${pageHead("dashboard-title", "Dashboard", "Today at a glance", logoutButton())}
    ${verificationNotice()}
    <section class="stats-grid">
      ${statCard("Today", stats.today)}
      ${statCard("Pending", stats.pending)}
      ${statCard("Upcoming", stats.upcoming)}
      ${statCard("Completed", stats.completed)}
      ${statCard("Cancelled", stats.cancelled)}
    </section>
    <section class="dashboard-grid">
      <div class="panel stack">
        <div class="row"><h2>Today's appointments</h2><button class="ghost" data-nav="appointments">View all</button></div>
        ${appointmentList(filterAppointments("today").slice(0, 6), true)}
      </div>
      <div class="stack">
        <div class="panel stack">
          <div class="row"><h2>Pending requests</h2><span class="badge pending">${stats.pending}</span></div>
          ${appointmentList(filterAppointments("pending").slice(0, 4), true)}
        </div>
        <div class="panel stack">
          <div class="row"><h2>Queue overview</h2><button class="ghost" data-nav="queue">Open queue</button></div>
          ${queueCards(filterQueueAppointments().slice(0, 3))}
        </div>
      </div>
    </section>
  `;
}

function renderAppointments() {
  const appointments = filterAppointments(appState.appointmentFilter);
  screens.appointments.innerHTML = `
    ${pageHead("appointments-title", "Appointments", "Approve requests, cancel visits, and move patient status.", logoutButton())}
    <div class="tabs">
      ${appointmentFilters.map((filter) => `<button class="pill-tab ${appState.appointmentFilter === filter ? "active" : ""}" data-filter="${filter}">${label(filter)}</button>`).join("")}
    </div>
    <section class="appointment-grid">${appointmentList(appointments, false)}</section>
  `;
}

function renderQueue() {
  const queueAppointments = filterQueueAppointments();
  screens.queue.innerHTML = `
    ${pageHead("queue-title", "Queue", "Fast status controls for checked-in patients.", logoutButton())}
    <section class="queue-grid">${queueCards(queueAppointments)}</section>
  `;
}

function renderAvailability() {
  screens.availability.innerHTML = `
    ${pageHead("availability-title", "Availability", "Weekly blocks and time off control patient booking slots.", logoutButton())}
    <section class="two-grid">
      <div class="panel stack">
        <h2>Weekly working days</h2>
        <form class="availability-form" data-form="working-day">
          <div class="form-grid">
            <div class="field"><label>Day</label><select name="day_of_week">${dayNames.map((day, index) => `<option value="${index}">${day}</option>`).join("")}</select></div>
            <div class="field"><label>Slot duration</label><input name="slot_minutes" type="number" min="5" max="240" value="30" required /></div>
            <div class="field"><label>Start time</label><input name="start_time" type="time" value="09:00" required /></div>
            <div class="field"><label>End time</label><input name="end_time" type="time" value="17:00" required /></div>
            <label class="check-field span-2"><input name="is_active" type="checkbox" checked /> Active for booking</label>
          </div>
          <input name="id" type="hidden" />
          <button class="button" type="submit">Save Working Block</button>
        </form>
        <div class="stack">${workingDayCards()}</div>
      </div>
      <div class="panel stack">
        <h2>Time off</h2>
        <form class="availability-form" data-form="time-off">
          <div class="field"><label>Starts at</label><input name="starts_at" type="datetime-local" required /></div>
          <div class="field"><label>Ends at</label><input name="ends_at" type="datetime-local" required /></div>
          <div class="field"><label>Reason</label><input name="reason" /></div>
          <input name="id" type="hidden" />
          <button class="button" type="submit">Save Time Off</button>
        </form>
        <div class="stack">${timeOffCards()}</div>
      </div>
    </section>
  `;

  screens.availability.querySelector("[data-form='working-day']").addEventListener("submit", saveWorkingDay);
  screens.availability.querySelector("[data-form='time-off']").addEventListener("submit", saveTimeOff);
}

function renderProfile() {
  screens.profile.innerHTML = `
    ${pageHead("profile-title", "Clinic and profile", "Edit public doctor details and linked clinic information.", logoutButton())}
    ${verificationNotice()}
    <section class="panel">
      <form class="profile-form" data-form="profile">
        <div class="form-grid">
          <div class="field"><label>Full name</label><input name="full_name" value="${escapeAttr(appState.profile?.full_name)}" required /></div>
          <div class="field"><label>Phone</label><input name="phone" value="${escapeAttr(appState.profile?.phone)}" /></div>
          <div class="field"><label>Specialty</label><input name="specialty" value="${escapeAttr(appState.doctor?.specialty)}" required /></div>
          <div class="field"><label>License number</label><input name="license_number" value="${escapeAttr(appState.doctor?.license_number)}" required /></div>
          <div class="field"><label>Consultation price (DA)</label><input name="consultation_price" type="number" min="0" step="100" value="${escapeAttr(appState.doctor?.consultation_price)}" /></div>
          <label class="check-field"><input name="accepts_new_patients" type="checkbox" ${appState.doctor?.accepts_new_patients ? "checked" : ""} /> Accepts new patients</label>
          <div class="field span-2"><label>Bio</label><textarea name="bio">${escapeHtml(appState.doctor?.bio)}</textarea></div>
          <div class="field"><label>Clinic name</label><input name="clinic_name" value="${escapeAttr(appState.clinic?.name)}" required /></div>
          <div class="field"><label>Clinic phone</label><input name="clinic_phone" value="${escapeAttr(appState.clinic?.phone)}" /></div>
          <div class="field"><label>Clinic email</label><input name="clinic_email" type="email" value="${escapeAttr(appState.clinic?.email)}" /></div>
          <div class="field"><label>City</label><input name="city" value="${escapeAttr(appState.clinic?.city)}" required /></div>
          <div class="field"><label>Wilaya</label><input name="wilaya" value="${escapeAttr(appState.clinic?.wilaya)}" required /></div>
          <div class="field"><label>Latitude</label><input name="latitude" type="number" step="0.0000001" value="${escapeAttr(appState.clinic?.latitude)}" /></div>
          <div class="field"><label>Longitude</label><input name="longitude" type="number" step="0.0000001" value="${escapeAttr(appState.clinic?.longitude)}" /></div>
          <div class="field span-2"><label>Address</label><input name="address" value="${escapeAttr(appState.clinic?.address)}" required /></div>
        </div>
        <button class="button" type="submit">Save Changes</button>
      </form>
    </section>
  `;

  screens.profile.querySelector("[data-form='profile']").addEventListener("submit", saveProfile);
}

function appointmentList(appointments, compact) {
  if (!appointments.length) return `<div class="empty">${compact ? "Nothing here yet." : "No appointments found for this tab."}</div>`;
  return appointments
    .map(
      (appointment) => `
        <article class="appointment-card">
          <div class="row row-start">
            <div>
              <h3>${appointmentTitle(appointment)}</h3>
              <p class="meta">${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)} · ${appointment.duration_minutes || 30} min</p>
              ${appointment.reason ? `<p class="meta">Reason: ${escapeHtml(appointment.reason)}</p>` : ""}
              ${appointment.cancel_reason ? `<p class="meta">Cancel reason: ${escapeHtml(appointment.cancel_reason)}</p>` : ""}
            </div>
            <span class="badge ${statusClass(appointment)}">${statusLabel(appointment)}</span>
          </div>
          ${compact ? "" : appointmentActions(appointment)}
        </article>
      `,
    )
    .join("");
}

function appointmentActions(appointment) {
  const actions = [];
  if (appointment.status === "pending") actions.push(`<button class="button" data-appointment="${appointment.id}" data-action="approve">Approve</button>`);
  if (!["completed", "cancelled_by_doctor", "cancelled_by_patient", "no_show"].includes(appointment.status)) {
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="checked_in">Checked In</button>`);
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="in_consultation">In Consultation</button>`);
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="checked_out">Checked Out</button>`);
    actions.push(`<button class="button" data-appointment="${appointment.id}" data-action="complete">Complete</button>`);
    actions.push(`<button class="danger" data-appointment="${appointment.id}" data-action="no_show">No Show</button>`);
    actions.push(`<button class="danger" data-appointment="${appointment.id}" data-action="cancel">Cancel</button>`);
  }
  return `<div class="actions">${actions.join("")}</div>`;
}

function queueCards(appointments) {
  if (!appointments.length) return `<div class="empty">No checked-in patients for today.</div>`;
  return appointments
    .map((appointment) => {
      const currentIndex = queueFlow.indexOf(appointment.queue_status);
      const nextStatus = queueFlow[Math.min(currentIndex + 1, queueFlow.length - 1)] || "checked_in";
      return `
        <article class="queue-card stack">
          <div class="row row-start">
            <div>
              <h3>${appointmentTitle(appointment)}</h3>
              <p class="meta">${formatTime(appointment.appointment_time)} · Position ${appointment.queue_position || "-"}</p>
            </div>
            <span class="badge ${appointment.queue_status}">${queueLabel(appointment.queue_status)}</span>
          </div>
          <div class="actions">
            ${queueFlow.map((status) => `<button class="${status === appointment.queue_status ? "button" : "ghost"}" data-appointment="${appointment.id}" data-action="${status}">${queueLabel(status)}</button>`).join("")}
            <button class="button" data-appointment="${appointment.id}" data-action="${nextStatus}" ${nextStatus === appointment.queue_status ? "disabled" : ""}>Next</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function workingDayCards() {
  if (!appState.workingDays.length) return `<div class="empty">No weekly availability yet.</div>`;
  return appState.workingDays
    .map(
      (day) => `
        <article class="day-card">
          <div class="row row-start">
            <div>
              <strong>${dayNames[day.day_of_week]}</strong>
              <p class="meta">${formatTime(day.start_time)}-${formatTime(day.end_time)} · ${day.slot_minutes} min slots</p>
            </div>
            <span class="badge ${day.is_active ? "verified" : "cancelled"}">${day.is_active ? "Active" : "Inactive"}</span>
          </div>
          <div class="actions">
            <button class="ghost" data-action="edit-working-day" data-id="${day.id}">Edit</button>
            <button class="danger" data-action="delete-working-day" data-id="${day.id}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function timeOffCards() {
  if (!appState.timeOff.length) return `<div class="empty">No time off scheduled.</div>`;
  return appState.timeOff
    .map(
      (item) => `
        <article class="timeoff-card">
          <div class="row row-start">
            <div>
              <strong>${formatDateTime(item.starts_at)}</strong>
              <p class="meta">Until ${formatDateTime(item.ends_at)}${item.reason ? ` · ${escapeHtml(item.reason)}` : ""}</p>
            </div>
            <button class="danger" data-action="delete-time-off" data-id="${item.id}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function saveProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const profilePayload = {
    full_name: clean(form.get("full_name")),
    phone: clean(form.get("phone")),
    updated_at: new Date().toISOString(),
  };
  const doctorPayload = {
    specialty: clean(form.get("specialty")),
    bio: clean(form.get("bio")),
    license_number: clean(form.get("license_number")),
    consultation_price: Number(form.get("consultation_price")) || null,
    accepts_new_patients: form.get("accepts_new_patients") === "on",
    updated_at: new Date().toISOString(),
  };

  const clinicPayload = clinicFromForm(form);
  const [profileResult, doctorResult, clinicResult] = await Promise.all([
    supabaseClient.from("profiles").update(profilePayload).eq("id", appState.user.id),
    supabaseClient.from("doctor_profiles").update(doctorPayload).eq("id", appState.user.id),
    supabaseClient.from("clinics").update(clinicPayload).eq("id", appState.clinic.id),
  ]);

  const error = profileResult.error || doctorResult.error || clinicResult.error;
  if (error) {
    toast(error.message);
    return;
  }

  await loadDoctorWorkspace();
  toast("Profile saved");
}

async function saveWorkingDay(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    doctor_id: appState.user.id,
    day_of_week: Number(form.get("day_of_week")),
    start_time: form.get("start_time"),
    end_time: form.get("end_time"),
    slot_minutes: Number(form.get("slot_minutes")) || 30,
    is_active: form.get("is_active") === "on",
  };
  const id = form.get("id");
  const request = id
    ? supabaseClient.from("doctor_working_days").update(payload).eq("id", id)
    : supabaseClient.from("doctor_working_days").insert(payload);
  const { error } = await request;
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast("Availability saved");
}

async function saveTimeOff(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    doctor_id: appState.user.id,
    starts_at: new Date(form.get("starts_at")).toISOString(),
    ends_at: new Date(form.get("ends_at")).toISOString(),
    reason: clean(form.get("reason")),
  };
  const { error } = await supabaseClient.from("doctor_time_off").insert(payload);
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast("Time off saved");
}

async function handleAppointmentAction(appointmentId, action) {
  const appointment = appState.appointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  if (action === "cancel") {
    showCancelModal(appointment);
    return;
  }

  const payload = {};
  if (action === "approve") {
    payload.status = "confirmed";
    payload.approved_at = new Date().toISOString();
  } else if (action === "complete") {
    payload.status = "completed";
    payload.queue_status = "checked_out";
    payload.checked_out_at = new Date().toISOString();
  } else if (action === "no_show") {
    payload.status = "no_show";
  } else if (queueFlow.includes(action)) {
    payload.queue_status = action;
    payload.checked_in = action !== "waiting";
    if (action === "checked_in") payload.checked_in_at = new Date().toISOString();
    if (action === "checked_out") payload.checked_out_at = new Date().toISOString();
  }

  await updateAppointment(appointment, payload, action);
}

async function updateAppointment(appointment, payload, action) {
  const { error } = await supabaseClient
    .from("appointments")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", appointment.id)
    .eq("doctor_id", appState.user.id);

  if (error) {
    toast(error.message);
    return;
  }

  const queueStatus = payload.queue_status || appointment.queue_status;
  if (queueStatus && (queueFlow.includes(queueStatus) || action === "complete")) {
    await insertQueueEvent(appointment.id, queueStatus, action);
  }

  await loadDoctorWorkspace();
  toast("Appointment updated");
}

async function insertQueueEvent(appointmentId, queueStatus, note) {
  const { error } = await supabaseClient.from("queue_events").insert({
    appointment_id: appointmentId,
    changed_by: appState.user.id,
    queue_status: queueStatus,
    note: label(note),
  });
  if (error) toast(error.message);
}

function showCancelModal(appointment) {
  showModal(
    "Cancel appointment",
    `<form class="auth-form" data-form="cancel">
      <p>Tell the patient why this appointment was cancelled.</p>
      <div class="field"><label>Reason</label><textarea name="cancel_reason" required></textarea></div>
    </form>`,
    [
      ["Keep", "ghost", closeModal],
      ["Cancel appointment", "danger", async () => {
        const reason = clean(modalBody.querySelector("textarea").value);
        if (!reason) {
          toast("Add a cancellation reason");
          return;
        }
        closeModal();
        await updateAppointment(appointment, {
          status: "cancelled_by_doctor",
          cancel_reason: reason,
        }, "cancelled");
      }],
    ],
  );
}

async function handleDelete(table, id, successMessage) {
  const { error } = await supabaseClient.from(table).delete().eq("id", id).eq("doctor_id", appState.user.id);
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast(successMessage);
}

function handleDocumentClick(event) {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    navigate(navButton.dataset.nav);
    return;
  }

  const targetButton = event.target.closest("[data-target]");
  if (targetButton) {
    navigate(targetButton.dataset.target);
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    appState.appointmentFilter = filterButton.dataset.filter;
    renderAppointments();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  if (action === "logout") {
    logout();
    return;
  }

  if (actionButton.dataset.appointment) {
    handleAppointmentAction(actionButton.dataset.appointment, action);
    return;
  }

  if (action === "delete-working-day") {
    handleDelete("doctor_working_days", actionButton.dataset.id, "Working block deleted");
    return;
  }

  if (action === "delete-time-off") {
    handleDelete("doctor_time_off", actionButton.dataset.id, "Time off deleted");
    return;
  }

  if (action === "edit-working-day") {
    const day = appState.workingDays.find((item) => item.id === actionButton.dataset.id);
    const form = screens.availability.querySelector("[data-form='working-day']");
    if (!day || !form) return;
    form.id.value = day.id;
    form.day_of_week.value = day.day_of_week;
    form.start_time.value = formatTime(day.start_time);
    form.end_time.value = formatTime(day.end_time);
    form.slot_minutes.value = day.slot_minutes;
    form.is_active.checked = day.is_active;
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  resetWorkspace();
  renderAuthScreens();
  navigate("start");
  toast("Logged out");
}

function navigate(screenName) {
  const authScreen = ["start", "signup", "login", "forgot", "confirm"].includes(screenName);
  const onboarding = screenName === "onboarding";
  Object.entries(screens).forEach(([name, element]) => {
    element.classList.toggle("active", name === screenName);
  });
  document.querySelectorAll(".nav, .bottom-nav, .sidebar-logout").forEach((element) => {
    element.classList.toggle("hidden", authScreen || onboarding);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === screenName);
  });
  screens[screenName]?.scrollTo({ top: 0 });
}

function currentScreen() {
  return document.querySelector(".screen.active")?.dataset.screen || "dashboard";
}

function resetWorkspace() {
  appState.user = null;
  appState.profile = null;
  appState.doctor = null;
  appState.clinic = null;
  appState.workingDays = [];
  appState.timeOff = [];
  appState.appointments = [];
}

function filterAppointments(filter) {
  const today = todayIso();
  return appState.appointments.filter((appointment) => {
    if (filter === "all") return true;
    if (filter === "today") return appointment.appointment_date === today;
    if (filter === "pending") return appointment.status === "pending";
    if (filter === "upcoming") return appointment.appointment_date >= today && ["pending", "confirmed"].includes(appointment.status);
    if (filter === "completed") return appointment.status === "completed";
    if (filter === "cancelled") return ["cancelled_by_patient", "cancelled_by_doctor", "no_show"].includes(appointment.status);
    return true;
  });
}

function filterQueueAppointments() {
  return appState.appointments.filter(
    (appointment) =>
      appointment.appointment_date === todayIso() &&
      ["confirmed", "completed"].includes(appointment.status) &&
      queueFlow.includes(appointment.queue_status) &&
      appointment.queue_status !== "checked_out",
  );
}

function getStats() {
  return {
    today: filterAppointments("today").length,
    pending: filterAppointments("pending").length,
    upcoming: filterAppointments("upcoming").length,
    completed: filterAppointments("completed").length,
    cancelled: filterAppointments("cancelled").length,
  };
}

function clinicFromForm(form) {
  return {
    name: clean(form.get("clinic_name")),
    phone: clean(form.get("clinic_phone")),
    email: clean(form.get("clinic_email")),
    address: clean(form.get("address")),
    city: clean(form.get("city")),
    wilaya: clean(form.get("wilaya")),
    latitude: form.get("latitude") ? Number(form.get("latitude")) : null,
    longitude: form.get("longitude") ? Number(form.get("longitude")) : null,
    updated_at: new Date().toISOString(),
  };
}

function pageHead(id, title, subtitle, actions = "") {
  return `<header class="page-head"><div><h1 id="${id}">${title}</h1><p>${subtitle}</p></div><div class="actions">${actions}</div></header>`;
}

function logoutButton() {
  return `<button class="ghost" data-action="logout">Logout</button>`;
}

function verificationNotice() {
  if (!appState.doctor) return "";
  const verified = appState.doctor.is_verified;
  return `
    <div class="${verified ? "panel" : "notice"} row">
      <div>
        <strong>${verified ? "Verified doctor account" : "Waiting for admin approval"}</strong>
        <p class="meta">${verified ? "Patients can book your available slots." : "Your profile is saved, but patients will not see you until an admin verifies the account."}</p>
      </div>
      <span class="badge ${verified ? "verified" : "unverified"}">${verified ? "Verified" : "Unverified"}</span>
    </div>
  `;
}

function statCard(labelText, value) {
  return `<article class="stat-card"><span class="meta">${labelText}</span><strong>${value}</strong></article>`;
}

function appointmentTitle(appointment) {
  return appointment.profiles?.full_name || `Patient ${String(appointment.patient_id || "").slice(0, 8) || "unknown"}`;
}

function statusLabel(appointment) {
  if (["cancelled_by_patient", "cancelled_by_doctor"].includes(appointment.status)) return label(appointment.status);
  if (appointment.status === "confirmed" && appointment.queue_status !== "not_checked_in") return queueLabel(appointment.queue_status);
  return label(appointment.status);
}

function statusClass(appointment) {
  if (appointment.status.startsWith("cancelled")) return "cancelled";
  if (appointment.status === "confirmed" && appointment.queue_status !== "not_checked_in") return appointment.queue_status;
  return appointment.status;
}

function queueLabel(status) {
  return label(status || "not_checked_in");
}

function label(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clean(value) {
  return String(value || "").trim();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-DZ", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-DZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatTime(value) {
  return String(value || "").slice(0, 5);
}

function requireSupabase() {
  if (supabaseClient) return true;
  toast("Add Supabase URL and anon key in supabase-config.js");
  return false;
}

function showModal(title, body, actions) {
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalActions.innerHTML = "";
  actions.forEach(([text, className, handler]) => {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", handler);
    modalActions.append(button);
  });
  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
}

function toast(message) {
  const region = document.getElementById("toast-region");
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  region.append(element);
  setTimeout(() => element.remove(), 4200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value ?? "");
}
