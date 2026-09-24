(() => {
  'use strict';

  const STORAGE_KEY = 'cb_signups';
  const NUT_PATTERN = /\b(?:nuts?|peanuts?|almonds?|cashews?|hazelnuts?|walnuts?|pecans?|pistachios?|macadamias?)\b/i;
  const MOBILE_PATTERN = /^(?:\+65\s*)?[689]\d{3}\s?\d{4}$/;
  const dialog = document.getElementById('signup-dialog');
  const form = document.getElementById('signup-form');
  const grid = document.getElementById('course-grid');
  const warning = document.getElementById('allergies-warning');
  const success = document.getElementById('signup-success');
  const saveError = document.getElementById('save-error');
  const controls = ['intake', 'experience', 'full-name', 'email', 'mobile', 'consent'];
  let courses = [];
  let selectedCourse = null;

  const get = (id) => document.getElementById(id);
  const fee = (amount) => `S$${Number(amount).toLocaleString('en-SG')}`;

  function singaporeDate() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  }

  function readSignups() {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) throw new Error('Saved sign-ups are not a list.');
    return value;
  }

  function nextReference(signups, date) {
    const prefix = `CB-${date.replaceAll('-', '')}-`;
    const last = signups.reduce((max, item) => {
      const match = typeof item.ref === 'string' && item.ref.startsWith(prefix)
        ? item.ref.slice(prefix.length).match(/^\d{4}$/) : null;
      return match ? Math.max(max, Number(match[0])) : max;
    }, 1000);
    if (last >= 9999) throw new Error('No reference numbers remain for today.');
    return `${prefix}${String(last + 1).padStart(4, '0')}`;
  }

  function clearErrors() {
    for (const id of controls) {
      get(id).removeAttribute('aria-invalid');
      get(`${id}-error`).textContent = '';
    }
    saveError.hidden = true;
    saveError.textContent = '';
  }

  function updateAllergyWarning() {
    warning.hidden = !(selectedCourse && NUT_PATTERN.test(get('allergies').value)
      && NUT_PATTERN.test(selectedCourse.allergens || ''));
  }

  function showCourse(course) {
    selectedCourse = course;
    form.reset();
    form.hidden = false;
    success.hidden = true;
    get('newsletter').checked = false;
    clearErrors();
    warning.hidden = true;
    get('selected-code').textContent = course.code;
    get('selected-title').textContent = course.title;
    get('selected-fee').textContent = fee(course.fee);
    get('selected-weeks').textContent = String(course.weeks);
    get('selected-schedule').textContent = course.when;
    get('selected-campus').textContent = course.campus;
    const intake = get('intake');
    intake.replaceChildren(new Option('Choose an intake', ''));
    for (const date of course.intakes) intake.add(new Option(date, date));
    dialog.showModal();
    intake.focus();
  }

  function validate() {
    clearErrors();
    const intake = get('intake');
    const experience = get('experience');
    const name = get('full-name');
    const email = get('email');
    const mobile = get('mobile');
    const consent = get('consent');
    const problems = [
      [intake, selectedCourse.intakes.includes(intake.value) ? '' : 'Choose one of this course’s intakes.'],
      [name, name.value.trim().length >= 2 ? '' : 'Enter a full name of at least 2 characters.'],
      [email, email.value.trim() && email.validity.valid ? '' : 'Enter a valid email address.'],
      [mobile, MOBILE_PATTERN.test(mobile.value.trim()) ? '' : 'Enter a Singapore number such as +65 9123 4567 or 91234567.'],
      [experience, ['None', 'Some', 'Confident'].includes(experience.value) ? '' : 'Choose your experience level.'],
      [consent, consent.checked ? '' : 'Agree to be contacted about this sign-up.']
    ].filter(([, message]) => message);
    for (const [control] of problems) control.setAttribute('aria-invalid', 'true');
    if (problems.length) {
      const [first, message] = problems[0];
      get(`${first.id}-error`).textContent = message;
      first.focus();
      return false;
    }
    return true;
  }

  function normalizedMobile(value) {
    const digits = value.replace(/\D/g, '').replace(/^65(?=[689]\d{7}$)/, '');
    return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  function emailLink(record) {
    const subject = `Cook & Bake sign-up ${record.ref}`;
    const body = [
      `Reference: ${record.ref}`,
      `Course: ${record.course_code} — ${record.course_title}`,
      `Fee: ${fee(selectedCourse.fee)}`,
      `Weeks: ${selectedCourse.weeks}`,
      `Schedule: ${selectedCourse.when}`,
      `Campus: ${selectedCourse.campus}`,
      `Intake: ${record.intake}`,
      `Full name: ${record.full_name}`,
      `Email: ${record.email}`,
      `Mobile: ${record.mobile}`,
      `Experience: ${record.experience}`,
      `Allergies: ${record.allergies || 'None stated'}`,
      'Consent to booking contact: yes',
      `Newsletter opt-in: ${record.marketing_opt_in}`
    ].join('\n');
    return `mailto:enrol@cookbakeacademy.sg?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function makeCard(course) {
    const article = document.createElement('article');
    article.className = 'course-card';
    const code = document.createElement('span');
    code.className = 'course-code';
    code.textContent = `${course.code} · ${course.cat}`;
    const title = document.createElement('h3');
    title.textContent = course.title;
    const summary = document.createElement('p');
    summary.textContent = course.summary;
    const meta = document.createElement('div');
    meta.className = 'course-meta';
    meta.textContent = `${fee(course.fee)} · ${course.weeks} ${course.weeks === 1 ? 'week' : 'weeks'} · ${course.campus}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'signup-button';
    button.dataset.courseCode = course.code;
    button.textContent = 'Sign up';
    article.append(code, title, summary, meta, button);
    return article;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-course-code]');
    if (!button) return;
    const course = courses.find((item) => item.code === button.dataset.courseCode);
    if (course) showCourse(course);
  });
  get('close-signup').addEventListener('click', () => dialog.close());
  get('allergies').addEventListener('input', updateAllergyWarning);
  form.addEventListener('input', (event) => {
    const control = event.target;
    if (!controls.includes(control.id)) return;
    control.removeAttribute('aria-invalid');
    get(`${control.id}-error`).textContent = '';
  });
  form.addEventListener('change', (event) => {
    const control = event.target;
    if (!controls.includes(control.id)) return;
    control.removeAttribute('aria-invalid');
    get(`${control.id}-error`).textContent = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedCourse || !validate()) return;
    try {
      const signups = readSignups();
      const submitted = singaporeDate();
      const record = {
        ref: nextReference(signups, submitted), submitted,
        course_code: selectedCourse.code, course_title: selectedCourse.title,
        intake: get('intake').value, full_name: get('full-name').value.trim(),
        email: get('email').value.trim(), mobile: normalizedMobile(get('mobile').value.trim()),
        experience: get('experience').value, allergies: get('allergies').value.trim(),
        marketing_opt_in: get('newsletter').checked ? 'yes' : 'no', paid: 'no',
        consent: true, course_fee: selectedCourse.fee, weeks: selectedCourse.weeks,
        schedule: selectedCourse.when, campus: selectedCourse.campus
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...signups, record]));
      get('signup-reference').textContent = record.ref;
      get('signup-mailto').href = emailLink(record);
      form.hidden = true;
      success.hidden = false;
      get('signup-mailto').focus();
    } catch (error) {
      saveError.textContent = 'This browser could not save the sign-up. Please check storage settings and try again.';
      saveError.hidden = false;
    }
  });

  fetch('courses.json').then((response) => {
    if (!response.ok) throw new Error('Course catalogue unavailable');
    return response.json();
  }).then((data) => {
    if (!Array.isArray(data) || data.length !== 20 || data.some((course) =>
      !course.code || !course.title || !Array.isArray(course.intakes) || course.intakes.length !== 2)) {
      throw new Error('Course catalogue is incomplete');
    }
    courses = data;
    grid.replaceChildren(...courses.map(makeCard));
  }).catch(() => {
    grid.replaceChildren();
    const message = document.createElement('p');
    message.className = 'course-loading error-banner';
    message.textContent = 'Courses could not be loaded. Please refresh the page.';
    grid.append(message);
    document.querySelectorAll('.launch [data-course-code]').forEach((button) => { button.disabled = true; });
  });
})();
